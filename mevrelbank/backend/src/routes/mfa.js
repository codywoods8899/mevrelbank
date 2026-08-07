const express = require('express');
const pool = require('../db/pool');
const { verifyMfa, signAccess, refreshExpiresAt } = require('../utils/jwt');
const { generateOTP, hashToken, otpExpiresAt } = require('../utils/otp');
const { generateSecret, generateOtpauthUrl, generateQRCode, verifyToken } = require('../services/totp');
const { sendLoginAlertEmail, sendMfaEmailFallback } = require('../services/email');
const requireAuth = require('../middleware/requireAuth');
const { v4: uuidv4 } = require('uuid');
const { CUSTOMER_COOKIE, ADMIN_COOKIE, ttlMs, cookieOptions } = require('../utils/cookies');

const router = express.Router();

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, accountType: u.account_type, totpEnabled: u.totp_enabled, role: u.role };
}

async function storeRefreshToken(userId, token, remember) {
  const hash = hashToken(token);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, remember) VALUES ($1, $2, $3, $4)`,
    [userId, hash, refreshExpiresAt(ttlMs(remember)), !!remember]
  );
}

// ─── POST /api/mfa/verify — exchange tempToken + TOTP code for session tokens ─

router.post('/verify', async (req, res) => {
  const { tempToken, code } = req.body ?? {};
  if (!tempToken || !code?.trim()) {
    return res.status(400).json({ error: 'Temp token and code are required.' });
  }

  let payload;
  try {
    payload = verifyMfa(tempToken);
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  if (payload.step !== 'mfa') {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
  if (rows.length === 0) return res.status(401).json({ error: 'User not found.' });
  const user = rows[0];

  let valid = false;

  if (user.totp_enabled && user.totp_secret) {
    valid = verifyToken(code.trim(), user.totp_secret);
  }

  if (!valid) {
    const { rows: otps } = await pool.query(
      `SELECT * FROM otp_codes WHERE user_id = $1 AND type = 'mfa_email' AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );
    if (otps.length > 0 && otps[0].code === code.trim()) {
      await pool.query('UPDATE otp_codes SET used = true WHERE id = $1', [otps[0].id]);
      valid = true;
    }
  }

  if (!valid) {
    return res.status(401).json({ error: 'Incorrect or expired code.' });
  }

  const remember = !!payload.remember;
  const accessToken = signAccess({ sub: user.id, email: user.email, accountType: user.account_type, role: user.role });
  const refreshToken = uuidv4();
  await storeRefreshToken(user.id, refreshToken, remember);

  const cookieName = user.role === 'admin' ? ADMIN_COOKIE : CUSTOMER_COOKIE;
  res.cookie(cookieName, refreshToken, cookieOptions(remember));

  const ip = req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket?.remoteAddress;
  try {
    await sendLoginAlertEmail({ to: user.email, name: user.name, ip, time: new Date().toUTCString() });
  } catch (err) {
    console.error('[email] Failed to send login alert:', err.message);
  }

  return res.json({ accessToken, user: publicUser(user) });
});

// ─── POST /api/mfa/send-email-code — send OTP to email as MFA fallback ──────

router.post('/send-email-code', async (req, res) => {
  const { tempToken } = req.body ?? {};
  if (!tempToken) return res.status(400).json({ error: 'Temp token required.' });

  let payload;
  try {
    payload = verifyMfa(tempToken);
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
  if (rows.length === 0) return res.status(401).json({ error: 'User not found.' });
  const user = rows[0];

  const code = generateOTP();
  await pool.query('UPDATE otp_codes SET used = true WHERE user_id = $1 AND type = $2 AND used = false', [user.id, 'mfa_email']);
  await pool.query(
    `INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES ($1, $2, 'mfa_email', $3)`,
    [user.id, code, otpExpiresAt(10)]
  );

  try {
    await sendMfaEmailFallback({ to: user.email, name: user.name, code });
  } catch (err) {
    console.error('[email] Failed to send MFA email:', err.message);
  }

  return res.json({ message: 'A code has been sent to your email.' });
});

// ─── GET /api/mfa/setup — get TOTP secret + QR for setup (auth required) ─────

router.get('/setup', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
  if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  const user = rows[0];

  if (user.totp_enabled) {
    return res.status(409).json({ error: 'Authenticator app is already enabled.' });
  }

  const secret = generateSecret();
  const otpauthUrl = generateOtpauthUrl(user.email, secret);
  const qrCodeDataUrl = await generateQRCode(otpauthUrl);

  return res.json({ secret, otpauthUrl, qrCode: qrCodeDataUrl });
});

// ─── POST /api/mfa/enable — confirm TOTP code and save secret (auth required) ─

router.post('/enable', requireAuth, async (req, res) => {
  const { secret, code } = req.body ?? {};
  if (!secret || !code?.trim()) {
    return res.status(400).json({ error: 'Secret and code are required.' });
  }

  if (!verifyToken(code.trim(), secret)) {
    return res.status(401).json({ error: 'Incorrect code. Make sure your authenticator is synced.' });
  }

  await pool.query(
    'UPDATE users SET totp_enabled = true, totp_secret = $1, updated_at = NOW() WHERE id = $2',
    [secret, req.user.sub]
  );

  return res.json({ message: 'Authenticator app enabled.' });
});

// ─── POST /api/mfa/disable — disable TOTP (auth required, code verification) ─

router.post('/disable', requireAuth, async (req, res) => {
  const { code } = req.body ?? {};
  if (!code?.trim()) return res.status(400).json({ error: 'Code is required.' });

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
  if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  const user = rows[0];

  if (!user.totp_enabled || !user.totp_secret) {
    return res.status(409).json({ error: 'Authenticator app is not enabled.' });
  }

  if (!verifyToken(code.trim(), user.totp_secret)) {
    return res.status(401).json({ error: 'Incorrect code.' });
  }

  await pool.query(
    'UPDATE users SET totp_enabled = false, totp_secret = NULL, updated_at = NOW() WHERE id = $1',
    [req.user.sub]
  );
  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [req.user.sub]);

  return res.json({ message: 'Authenticator app disabled.' });
});

module.exports = router;
