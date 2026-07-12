const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { signAccess, signRefresh, signMfa, verifyRefresh, verifyMfa, refreshExpiresAt } = require('../utils/jwt');
const { generateOTP, hashToken, otpExpiresAt } = require('../utils/otp');
const { sendVerificationEmail, sendPasswordResetEmail, sendLoginAlertEmail } = require('../services/email');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const requireAuth = require('../middleware/requireAuth');

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

async function storeRefreshToken(userId, token) {
  const hash = hashToken(token);
  const expiresAt = refreshExpiresAt();
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hash, expiresAt]
  );
}

function issueTokens(user) {
  const payload = { sub: user.id, email: user.email, accountType: user.account_type };
  const accessToken = signAccess(payload);
  const refreshToken = uuidv4();
  return { accessToken, refreshToken, payload };
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, accountType: u.account_type, totpEnabled: u.totp_enabled };
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
    console.error('[register] Error:', err.message);
    return res.status(500).json({ error: err.message });
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
  const { email, password } = req.body ?? {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

  const INVALID = 'Invalid email or password.';
  if (rows.length === 0) {
    await bcrypt.compare(password, '$2b$12$invalidhashfortimingnvtWXx.placeholder...........');
    return res.status(401).json({ error: INVALID });
  }
  const user = rows[0];

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: INVALID });

  if (!user.email_verified) {
    return res.status(403).json({ error: 'Please verify your email before signing in.', code: 'EMAIL_UNVERIFIED' });
  }

  if (user.totp_enabled) {
    const tempToken = signMfa({ sub: user.id, step: 'mfa' });
    return res.json({ mfaRequired: true, tempToken });
  }

  const { accessToken, refreshToken } = issueTokens(user);
  await storeRefreshToken(user.id, refreshToken);

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
    refreshToken,
    user: publicUser(user),
  });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required.' });

  let payload;
  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }

  const hash = hashToken(refreshToken);
  const { rows } = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`,
    [hash]
  );

  if (rows.length === 0) return res.status(401).json({ error: 'Refresh token not found or revoked.' });

  const { rows: users } = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
  if (users.length === 0) return res.status(401).json({ error: 'User not found.' });

  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [hash]);

  const { accessToken, refreshToken: newRefresh } = issueTokens(users[0]);
  await storeRefreshToken(users[0].id, newRefresh);

  return res.json({ accessToken, refreshToken: newRefresh });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

router.post('/logout', requireAuth, async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (refreshToken) {
    const hash = hashToken(refreshToken);
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [hash]).catch(() => {});
  }
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
