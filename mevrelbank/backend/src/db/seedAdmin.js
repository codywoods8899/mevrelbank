require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('./pool');
const { generateOTP, otpExpiresAt } = require('../utils/otp');
const { sendPasswordResetEmail } = require('../services/email');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'support@mevrelbank.com').trim().toLowerCase();
const ADMIN_NAME = 'MevrelBank Support';

async function seedAdmin() {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [ADMIN_EMAIL]);

  let admin;
  if (rows.length === 0) {
    // Random, never-communicated placeholder password — the real owner sets their
    // own via the password-reset email sent below.
    const placeholder = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(placeholder, 12);
    const { rows: inserted } = await pool.query(
      `INSERT INTO users (name, email, password_hash, account_type, email_verified, role, is_active)
       VALUES ($1, $2, $3, 'business', true, 'admin', true) RETURNING *`,
      [ADMIN_NAME, ADMIN_EMAIL, passwordHash]
    );
    admin = inserted[0];
    console.log(`[seedAdmin] Created admin account for ${ADMIN_EMAIL}.`);
  } else {
    admin = rows[0];
    if (admin.role !== 'admin') {
      await pool.query(`UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = $1`, [admin.id]);
      console.log(`[seedAdmin] Promoted existing account ${ADMIN_EMAIL} to admin.`);
    } else {
      console.log(`[seedAdmin] Admin account for ${ADMIN_EMAIL} already exists.`);
    }
  }

  // Always send a fresh password-reset code so the real owner of the support
  // mailbox can set (or reset) their own admin password.
  const code = generateOTP();
  await pool.query('UPDATE otp_codes SET used = true WHERE user_id = $1 AND type = $2 AND used = false', [admin.id, 'password_reset']);
  await pool.query(
    `INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES ($1, $2, 'password_reset', $3)`,
    [admin.id, code, otpExpiresAt(30)]
  );

  try {
    await sendPasswordResetEmail({ to: ADMIN_EMAIL, name: ADMIN_NAME, code });
    console.log(`[seedAdmin] Password-reset code emailed to ${ADMIN_EMAIL}. Use the "Forgot password" flow on /reset-password to set your admin password.`);
  } catch (err) {
    console.error('[seedAdmin] Failed to send reset email:', err.message);
    console.log(`[seedAdmin] Reset code (email delivery failed): ${code}`);
  }
}

seedAdmin()
  .catch((err) => {
    console.error('[seedAdmin] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
