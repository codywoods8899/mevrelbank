const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { signAccess, signMfa, refreshExpiresAt } = require('../utils/jwt');
const { generateOTP, hashToken, otpExpiresAt } = require('../utils/otp');
const { sendVerificationEmail, sendPasswordResetEmail, sendLoginAlertEmail } = require('../services/email');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { CUSTOMER_COOKIE, ttlMs, cookieOptions, clearCookieOptions } = require('../utils/cookies');
const { generateAccountNumber } = require('../lib/accountNumber');

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function storeOTP(userId, code, type, minutes) {
  await pool.query(
    `UPDATE otp_codes SET used = true WHERE user_id = $1 AND type = $2 AND used = false`,
    [userId, type]
  );
  await pool.query(
    `INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES ($1, $2, $3, $4)`,
    [userId, code, type, otpExpiresAt(minutes)]
  );
}

async function seedNewCustomer(user) {
  const sortCode = '40-47-84';
  const [currentAccountNumber, savingsAccountNumber] = await Promise.all([
    generateAccountNumber(),
    generateAccountNumber(),
  ]);
  await pool.query(
    `INSERT INTO accounts (user_id, name, type, sort_code, account_number, balance, available)
     VALUES ($1, 'Current Account', 'Current Account', $2, $3, 0, 0),
            ($1, 'Instant Access Savings', 'Savings Account', $2, $4, 0, 0)`,
    [user.id, sortCode, currentAccountNumber, savingsAccountNumber]
  );
  await pool.query(
    `INSERT INTO notifications (user_id, title, body, kind)
     VALUES ($1, 'Welcome to MevrelBank', 'Your Current and Savings accounts are ready. Add a beneficiary to get started.', 'info')`,
    [user.id]
  );
}

async function storeRefreshToken(userId, token, remember) {
  const hash = hashToken(token);
  const expiresAt = refreshExpiresAt(ttlMs(remember));
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, remember) VALUES ($1, $2, $3, $4)`,
    [userId, hash, expiresAt, !!remember]
  );
}

function issueTokens(user) {
  const payload = { sub: user.id, email: user.email, accountType: user.account_type, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = uuidv4();
  return { accessToken, refreshToken, payload };
}

/** Sets the httpOnly session cookie and stores the hashed refresh token, keyed by remember-me duration. */
async function startSession(res, user, remember) {
  const { accessToken, refreshToken } = issueTokens(user);
  await storeRefreshToken(user.id, refreshToken, remember);
  res.cookie(CUSTOMER_COOKIE, refreshToken, cookieOptions(remember));
  return accessToken;
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, accountType: u.account_type, totpEnabled: u.totp_enabled, role: u.role };
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, accountType } = req.body ?? {};

  if (!name?.trim() || !email?.trim() || !password || !accountType) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!['personal', 'business'].includes(accountType)) {
    return res.status(400).json({ error: 'Invalid account type.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, account_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), normalizedEmail, passwordHash, accountType]
    );
    const user = rows[0];

    const code = generateOTP();
    await storeOTP(user.id, code, 'email_verification', 10);

    try {
      await sendVerificationEmail({ to: normalizedEmail, name: user.name, code });
    } catch (emailErr) {
      console.error('[email] Failed to send verification email:', emailErr.message);
    }

    return res.status(201).json({ message: 'Account created. Check your email for the verification code.' });
  } catch (err) {
    console.error('[register] Error:', err?.message || err?.detail || err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── POST /api/auth/verify-email ─────────────────────────────────────────────

router.post('/verify-email', authLimiter, async (req, res) => {
  const { email, code } = req.body ?? {};
  if (!email?.trim() || !code?.trim()) {
    return res.status(400).json({ error: 'Email and code are required.' });
  }
  if (!/^\d{6}$/.test(code.trim())) {
    return res.status(400).json({ error: 'Enter the 6-digit code from your email.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows: users } = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
  if (users.length === 0) {
    return res.status(400).json({ error: 'Invalid verification code.' });
  }
  const user = users[0];

  if (user.email_verified) {
    return res.json({ message: 'Email already verified. You can sign in.' });
  }

  const { rows: otps } = await pool.query(
    `SELECT * FROM otp_codes WHERE user_id = $1 AND type = 'email_verification' AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );

  if (otps.length === 0 || otps[0].code !== code.trim()) {
    return res.status(400).json({ error: 'Code is incorrect or has expired.' });
  }

  await pool.query('UPDATE otp_codes SET used = true WHERE id = $1', [otps[0].id]);
  await pool.query('UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1', [user.id]);

  try {
    await seedNewCustomer(user);
  } catch (err) {
    console.error('[seed] Failed to seed default accounts:', err.message);
  }

  return res.json({ message: 'Email verified. You can now sign in.' });
});

// ─── POST /api/auth/resend-otp ───────────────────────────────────────────────

router.post('/resend-otp', otpLimiter, async (req, res) => {
  const { email, type } = req.body ?? {};
  if (!email?.trim() || !['email_verification', 'password_reset'].includes(type)) {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

  if (rows.length === 0) {
    return res.json({ message: 'If that email is registered, a new code has been sent.' });
  }
  const user = rows[0];

  const code = generateOTP();
  const minutes = type === 'password_reset' ? 30 : 10;
  await storeOTP(user.id, code, type, minutes);

  try {
    if (type === 'email_verification') {
      await sendVerificationEmail({ to: normalizedEmail, name: user.name, code });
    } else {
      await sendPasswordResetEmail({ to: normalizedEmail, name: user.name, code });
    }
  } catch (err) {
    console.error('[email] Failed to resend OTP:', err.message);
  }

  return res.json({ message: 'If that email is registered, a new code has been sent.' });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', authLimiter, async (req, res) => {
  const { email, password, remember } = req.body ?? {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1 AND role = 'customer'`, [normalizedEmail]);

  const INVALID = 'Invalid email or password.';
  if (rows.length === 0) {
    await bcrypt.compare(password, '$2b$12$invalidhashfortimingnvtWXx.placeholder...........');
    return res.status(401).json({ error: INVALID });
  }
  const user = rows[0];

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: INVALID });

  if (!user.is_active) {
    return res.status(403).json({ error: 'This account has been disabled. Contact support.' });
  }

  if (!user.email_verified) {
    return res.status(403).json({ error: 'Please verify your email before signing in.', code: 'EMAIL_UNVERIFIED' });
  }

  if (user.totp_enabled) {
    const tempToken = signMfa({ sub: user.id, step: 'mfa', remember: !!remember });
    return res.json({ mfaRequired: true, tempToken });
  }

  const accessToken = await startSession(res, user, !!remember);

  const ip = req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket?.remoteAddress;
  try {
    await sendLoginAlertEmail({
      to: user.email,
      name: user.name,
      ip,
      time: new Date().toUTCString(),
    });
  } catch (err) {
    console.error('[email] Failed to send login alert:', err.message);
  }

  return res.json({
    mfaRequired: false,
    accessToken,
    user: publicUser(user),
  });
});

// ─── POST /api/auth/refresh — reads the httpOnly session cookie, not the body ─

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.[CUSTOMER_COOKIE];
  if (!refreshToken) return res.status(401).json({ error: 'No session cookie.' });

  const hash = hashToken(refreshToken);
  const { rows } = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`,
    [hash]
  );

  if (rows.length === 0) {
    res.clearCookie(CUSTOMER_COOKIE, clearCookieOptions());
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
  const tokenRow = rows[0];

  const { rows: users } = await pool.query(`SELECT * FROM users WHERE id = $1 AND role = 'customer'`, [tokenRow.user_id]);
  if (users.length === 0 || !users[0].is_active) {
    res.clearCookie(CUSTOMER_COOKIE, clearCookieOptions());
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [hash]);
  const accessToken = await startSession(res, users[0], tokenRow.remember);

  return res.json({ accessToken, user: publicUser(users[0]) });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.[CUSTOMER_COOKIE];
  if (refreshToken) {
    const hash = hashToken(refreshToken);
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [hash]).catch(() => {});
  }
  res.clearCookie(CUSTOMER_COOKIE, clearCookieOptions());
  return res.json({ message: 'Signed out.' });
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

router.post('/forgot-password', otpLimiter, async (req, res) => {
  const { email } = req.body ?? {};
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required.' });

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

  if (rows.length > 0) {
    const user = rows[0];
    const code = generateOTP();
    await storeOTP(user.id, code, 'password_reset', 30);
    try {
      await sendPasswordResetEmail({ to: normalizedEmail, name: user.name, code });
    } catch (err) {
      console.error('[email] Failed to send reset email:', err.message);
    }
  }

  return res.json({ message: 'If that email is registered, a reset code has been sent.' });
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

router.post('/reset-password', authLimiter, async (req, res) => {
  const { email, code, newPassword } = req.body ?? {};
  if (!email?.trim() || !code?.trim() || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and new password are required.' });
  }
  if (!/^\d{6}$/.test(code.trim())) {
    return res.status(400).json({ error: 'Enter the 6-digit reset code.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows: users } = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
  if (users.length === 0) return res.status(400).json({ error: 'Invalid code.' });
  const user = users[0];

  const { rows: otps } = await pool.query(
    `SELECT * FROM otp_codes WHERE user_id = $1 AND type = 'password_reset' AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );

  if (otps.length === 0 || otps[0].code !== code.trim()) {
    return res.status(400).json({ error: 'Code is incorrect or has expired.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE otp_codes SET used = true WHERE id = $1', [otps[0].id]);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, user.id]);
  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [user.id]);

  return res.json({ message: 'Password updated. You can now sign in.' });
});

module.exports = router;
