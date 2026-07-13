const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const requireAuth = require('../middleware/requireAuth');
const { requireAdmin } = require('../middleware/requireAuth');
const { signAccess, signMfa, refreshExpiresAt } = require('../utils/jwt');
const { hashToken } = require('../utils/otp');
const { authLimiter } = require('../middleware/rateLimiter');
const { ADMIN_COOKIE, ttlMs, cookieOptions, clearCookieOptions } = require('../utils/cookies');

const router = express.Router();

// Only this exact mailbox may ever hold the 'admin' role — enforced both here
// and at account-provisioning time (see src/db/seedAdmin.js).
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'support@mevrelbank.com').trim().toLowerCase();

function publicAdmin(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, totpEnabled: u.totp_enabled };
}

async function storeRefreshToken(userId, token, remember) {
  const hash = hashToken(token);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, remember) VALUES ($1, $2, $3, $4)`,
    [userId, hash, refreshExpiresAt(ttlMs(remember)), !!remember]
  );
}

async function startAdminSession(res, admin, remember) {
  const accessToken = signAccess({ sub: admin.id, email: admin.email, role: admin.role });
  const refreshToken = uuidv4();
  await storeRefreshToken(admin.id, refreshToken, remember);
  res.cookie(ADMIN_COOKIE, refreshToken, cookieOptions(remember));
  return accessToken;
}

// ─── POST /api/admin/login ────────────────────────────────────────────────────

router.post('/login', authLimiter, async (req, res) => {
  const { email, password, remember } = req.body ?? {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const INVALID = 'Invalid email or password.';

  if (normalizedEmail !== ADMIN_EMAIL) {
    await bcrypt.compare(password, '$2b$12$invalidhashfortimingnvtWXx.placeholder...........');
    return res.status(401).json({ error: INVALID });
  }

  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1 AND role = 'admin'`, [normalizedEmail]);
  if (rows.length === 0) {
    await bcrypt.compare(password, '$2b$12$invalidhashfortimingnvtWXx.placeholder...........');
    return res.status(401).json({ error: INVALID });
  }
  const admin = rows[0];

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: INVALID });

  if (!admin.is_active) {
    return res.status(403).json({ error: 'This admin account has been disabled.' });
  }

  if (admin.totp_enabled) {
    const tempToken = signMfa({ sub: admin.id, step: 'mfa', remember: !!remember });
    return res.json({ mfaRequired: true, tempToken });
  }

  const accessToken = await startAdminSession(res, admin, !!remember);
  return res.json({ mfaRequired: false, accessToken, user: publicAdmin(admin) });
});

// ─── POST /api/admin/refresh ───────────────────────────────────────────────────

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.[ADMIN_COOKIE];
  if (!refreshToken) return res.status(401).json({ error: 'No session cookie.' });

  const hash = hashToken(refreshToken);
  const { rows } = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`,
    [hash]
  );
  if (rows.length === 0) {
    res.clearCookie(ADMIN_COOKIE, clearCookieOptions());
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
  const tokenRow = rows[0];

  const { rows: admins } = await pool.query(`SELECT * FROM users WHERE id = $1 AND role = 'admin'`, [tokenRow.user_id]);
  if (admins.length === 0 || !admins[0].is_active) {
    res.clearCookie(ADMIN_COOKIE, clearCookieOptions());
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [hash]);
  const accessToken = await startAdminSession(res, admins[0], tokenRow.remember);
  return res.json({ accessToken, user: publicAdmin(admins[0]) });
});

// ─── POST /api/admin/logout ────────────────────────────────────────────────────

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.[ADMIN_COOKIE];
  if (refreshToken) {
    const hash = hashToken(refreshToken);
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [hash]).catch(() => {});
  }
  res.clearCookie(ADMIN_COOKIE, clearCookieOptions());
  return res.json({ message: 'Signed out.' });
});

// ─── Everything below requires an authenticated admin session ────────────────

router.use(requireAuth, requireAdmin);

router.get('/me', async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1 AND role = 'admin'`, [req.user.sub]);
  if (rows.length === 0) return res.status(404).json({ error: 'Admin not found.' });
  return res.json({ user: publicAdmin(rows[0]) });
});

// ─── GET /api/admin/overview — bank-wide KPIs ─────────────────────────────────

router.get('/overview', async (req, res) => {
  const [users, accounts, txns, verified] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer'`),
    pool.query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(balance), 0)::numeric AS total_balance FROM accounts`),
    pool.query(`SELECT COUNT(*)::int AS count FROM transactions WHERE occurred_at > NOW() - INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer' AND email_verified = true`),
  ]);

  return res.json({
    totalUsers: users.rows[0].count,
    verifiedUsers: verified.rows[0].count,
    totalAccounts: accounts.rows[0].count,
    totalBalance: Number(accounts.rows[0].total_balance),
    transactions30d: txns.rows[0].count,
  });
});

// ─── GET /api/admin/users — paginated customer directory ─────────────────────

router.get('/users', async (req, res) => {
  const search = (req.query.search ?? '').toString().trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  const params = [];
  let where = `WHERE u.role = 'customer'`;
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`;
  }

  const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int AS count FROM users u ${where}`, params);
  const total = countRows[0].count;

  params.push(pageSize, offset);
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.account_type, u.email_verified, u.is_active, u.created_at,
            COALESCE(a.account_count, 0)::int AS account_count,
            COALESCE(a.total_balance, 0)::numeric AS total_balance
     FROM users u
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS account_count, SUM(balance) AS total_balance
       FROM accounts GROUP BY user_id
     ) a ON a.user_id = u.id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return res.json({
    total,
    page,
    pageSize,
    users: rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      accountType: u.account_type,
      emailVerified: u.email_verified,
      isActive: u.is_active,
      createdAt: u.created_at,
      accountCount: u.account_count,
      totalBalance: Number(u.total_balance),
    })),
  });
});

// ─── GET /api/admin/users/:id — customer detail ───────────────────────────────

router.get('/users/:id', async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1 AND role = 'customer'`, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  const user = rows[0];

  const { rows: accounts } = await pool.query(
    `SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC`,
    [user.id]
  );

  const accountIds = accounts.map(a => a.id);
  let transactions = [];
  if (accountIds.length > 0) {
    const { rows: txns } = await pool.query(
      `SELECT t.*, a.name AS account_name FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       WHERE t.account_id = ANY($1::uuid[])
       ORDER BY t.occurred_at DESC LIMIT 25`,
      [accountIds]
    );
    transactions = txns;
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      accountType: user.account_type,
      emailVerified: user.email_verified,
      totpEnabled: user.totp_enabled,
      isActive: user.is_active,
      createdAt: user.created_at,
    },
    accounts: accounts.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      sortCode: a.sort_code,
      accountNumber: a.account_number,
      balance: Number(a.balance),
      available: Number(a.available),
    })),
    transactions: transactions.map(t => ({
      id: t.id,
      account: t.account_name,
      name: t.name,
      category: t.category,
      amount: Number(t.amount),
      status: t.status,
      date: t.occurred_at,
    })),
  });
});

// ─── PATCH /api/admin/users/:id/status — suspend / reactivate a customer ─────

router.patch('/users/:id/status', async (req, res) => {
  const { isActive } = req.body ?? {};
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive (boolean) is required.' });
  }

  const { rows } = await pool.query(
    `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 AND role = 'customer' RETURNING id, is_active`,
    [isActive, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

  if (!isActive) {
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [req.params.id]);
  }

  return res.json({ id: rows[0].id, isActive: rows[0].is_active });
});

module.exports = router;
