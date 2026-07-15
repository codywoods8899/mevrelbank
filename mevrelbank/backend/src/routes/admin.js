const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const requireAuth = require('../middleware/requireAuth');
const { requireAdmin } = require('../middleware/requireAuth');
const { signAccess, signMfa, signConfirm, verifyConfirm, refreshExpiresAt } = require('../utils/jwt');
const { hashToken } = require('../utils/otp');
const { verifyToken: verifyTotp } = require('../services/totp');
const { authLimiter } = require('../middleware/rateLimiter');
const { ADMIN_COOKIE, ttlMs, cookieOptions, clearCookieOptions } = require('../utils/cookies');
const {
  sendTransactionConfirmedEmail,
  sendTransactionRejectedEmail,
  sendAdminTransactionEmail,
} = require('../services/email');

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

// Helper: get user + account for email notifications
async function getUserForAccount(accountId) {
  const { rows } = await pool.query(
    `SELECT u.name, u.email, a.name AS account_name
     FROM users u JOIN accounts a ON a.user_id = u.id
     WHERE a.id = $1`,
    [accountId]
  );
  return rows[0] ?? null;
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
  const [users, accounts, txns, verified, pending] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer'`),
    pool.query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(balance), 0)::numeric AS total_balance FROM accounts`),
    pool.query(`SELECT COUNT(*)::int AS count FROM transactions`),
    pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer' AND email_verified = true`),
    pool.query(`SELECT COUNT(*)::int AS count FROM transactions WHERE status = 'pending'`),
  ]);

  const [archived, closed] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE archived_at IS NOT NULL`),
    pool.query(`SELECT COUNT(*)::int AS count FROM accounts WHERE status = 'closed'`),
  ]);

  return res.json({
    totalUsers: users.rows[0].count,
    verifiedUsers: verified.rows[0].count,
    totalAccounts: accounts.rows[0].count,
    totalBalance: Number(accounts.rows[0].total_balance),
    transactionsTotal: txns.rows[0].count,
    pendingTransactions: pending.rows[0].count,
    archivedUsers: archived.rows[0].count,
    closedAccounts: closed.rows[0].count,
  });
});

// ─── GET /api/admin/users — paginated customer directory ─────────────────────

router.get('/users', async (req, res) => {
  const search = (req.query.search ?? '').toString().trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  const includeArchived = req.query.includeArchived === 'true';

  const params = [];
  let where = `WHERE u.role = 'customer'`;
  if (!includeArchived) where += ` AND u.archived_at IS NULL`;
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where += ` AND (LOWER(u.name) LIKE ${params.length} OR LOWER(u.email) LIKE ${params.length})`;
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
      archivedAt: u.archived_at ?? null,
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
       ORDER BY t.occurred_at DESC LIMIT 50`,
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
      archivedAt: user.archived_at ?? null,
      archiveReason: user.archive_reason ?? null,
      createdAt: user.created_at,
    },
    accounts: accounts.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      routingNumber: a.routing_number,
      accountNumber: a.account_number,
      balance: Number(a.balance),
      available: Number(a.available),
      status: a.status ?? 'active',
    })),
    transactions: transactions.map(t => ({
      id: t.id,
      account: t.account_name,
      name: t.name,
      category: t.category,
      txType: t.tx_type ?? 'transaction',
      amount: Number(t.amount),
      status: t.status,
      initiatedBy: t.initiated_by,
      reversalOf: t.reversal_of ?? null,
      reversedBy: t.reversed_by ?? null,
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

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN TRANSACTION OPERATIONS — no external gateway needed for admin
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/admin/accounts — all accounts across all customers ──────────────

router.get('/accounts', async (req, res) => {
  const search = (req.query.search ?? '').toString().trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  const includeClosed = req.query.includeClosed === 'true';

  const params = [];
  let where = `WHERE u.role = 'customer'`;
  if (!includeClosed) where += ` AND a.status = 'active'`;
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where += ` AND (LOWER(u.name) LIKE ${params.length} OR LOWER(u.email) LIKE ${params.length} OR LOWER(a.name) LIKE ${params.length})`;
  }

  params.push(pageSize, offset);
  const { rows } = await pool.query(
    `SELECT a.*, u.name AS user_name, u.email AS user_email
     FROM accounts a JOIN users u ON u.id = a.user_id
     ${where}
     ORDER BY u.name ASC, a.created_at ASC
     LIMIT ${params.length - 1} OFFSET ${params.length}`,
    params
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM accounts a JOIN users u ON u.id = a.user_id ${where}`,
    params.slice(0, params.length - 2)
  );

  return res.json({
    total: countRows[0].count,
    page,
    pageSize,
    accounts: rows.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      routingNumber: a.routing_number,
      accountNumber: a.account_number,
      balance: Number(a.balance),
      available: Number(a.available),
      status: a.status ?? 'active',
      userName: a.user_name,
      userEmail: a.user_email,
      userId: a.user_id,
    })),
  });
});

// ─── GET /api/admin/pending — all pending transactions ────────────────────────

router.get('/pending', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `SELECT t.*, a.name AS account_name, u.name AS user_name, u.email AS user_email
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN users u ON u.id = a.user_id
       WHERE t.status = 'pending'
       ORDER BY t.occurred_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS count FROM transactions WHERE status = 'pending'`),
  ]);

  return res.json({
    total: countRows[0].count,
    page,
    pageSize,
    transactions: rows.map(t => ({
      id: t.id,
      accountId: t.account_id,
      accountName: t.account_name,
      userName: t.user_name,
      userEmail: t.user_email,
      name: t.name,
      category: t.category,
      txType: t.tx_type ?? 'transaction',
      amount: Number(t.amount),
      status: t.status,
      initiatedBy: t.initiated_by,
      reversalOf: t.reversal_of ?? null,
      reversedBy: t.reversed_by ?? null,
      metadata: t.metadata,
      date: t.occurred_at,
    })),
  });
});

// ─── GET /api/admin/transactions — all transactions ───────────────────────────

router.get('/transactions', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  const status = req.query.status ?? null;
  const userId = req.query.userId ?? null;

  const params = [];
  const conditions = [];
  if (status) { params.push(status); conditions.push(`t.status = $${params.length}`); }
  if (userId) { params.push(userId); conditions.push(`u.id = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(pageSize, offset);

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `SELECT t.*, a.name AS account_name, u.name AS user_name, u.email AS user_email
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY t.occurred_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN users u ON u.id = a.user_id
       ${where}`,
      params.slice(0, params.length - 2)
    ),
  ]);

  return res.json({
    total: countRows[0].count,
    page,
    pageSize,
    transactions: rows.map(t => ({
      id: t.id,
      accountId: t.account_id,
      accountName: t.account_name,
      userName: t.user_name,
      userEmail: t.user_email,
      name: t.name,
      category: t.category,
      txType: t.tx_type ?? 'transaction',
      amount: Number(t.amount),
      status: t.status,
      initiatedBy: t.initiated_by,
      reversalOf: t.reversal_of ?? null,
      reversedBy: t.reversed_by ?? null,
      metadata: t.metadata,
      date: t.occurred_at,
    })),
  });
});

// ─── Middleware: require a short-lived confirm token for destructive operations ─

function requireConfirmToken(req, res, next) {
  const token = req.headers['x-admin-confirm-token'];
  if (!token) {
    return res.status(403).json({ error: 'This action requires re-authentication. Please confirm your admin password.' });
  }
  try {
    const payload = verifyConfirm(token);
    if (payload.sub !== req.user.sub) throw new Error('Token subject mismatch.');
    next();
  } catch {
    return res.status(403).json({ error: 'Confirmation token is invalid or expired. Please re-authenticate.' });
  }
}

// ─── POST /api/admin/re-auth — issue a 5-minute destructive-action token ──────

router.post('/re-auth', async (req, res) => {
  const { password, totpCode } = req.body ?? {};
  if (!password) return res.status(400).json({ error: 'Password is required.' });

  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1 AND role = 'admin'`, [req.user.sub]);
  if (rows.length === 0) return res.status(404).json({ error: 'Admin not found.' });
  const admin = rows[0];

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password.' });

  if (admin.totp_enabled) {
    if (!totpCode?.trim()) return res.status(400).json({ error: '2FA code is required.' });
    const ok = verifyTotp(totpCode.trim(), admin.totp_secret);
    if (!ok) return res.status(401).json({ error: 'Invalid 2FA code.' });
  }

  const confirmToken = signConfirm({ sub: admin.id });
  return res.json({ confirmToken });
});

// ─── PATCH /api/admin/users/:id — edit customer profile ──────────────────────

router.patch('/users/:id', async (req, res) => {
  const ALLOWED = ['name', 'email', 'phone', 'address', 'account_type'];
  const { name, email, phone, address, accountType } = req.body ?? {};

  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1 AND role = 'customer'`, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  const user = rows[0];

  const updates = [];
  const params  = [];

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty.' });
    params.push(name.trim()); updates.push(`name = ${params.length}`);
  }

  let emailChanged = false;
  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return res.status(400).json({ error: 'Email cannot be empty.' });
    if (normalizedEmail !== user.email) {
      // Check uniqueness
      const { rows: existing } = await pool.query(`SELECT id FROM users WHERE email = $1 AND id <> $2`, [normalizedEmail, user.id]);
      if (existing.length > 0) return res.status(409).json({ error: 'That email address is already in use.' });
      params.push(normalizedEmail); updates.push(`email = ${params.length}`);
      updates.push(`email_verified = false`);
      emailChanged = true;
    }
  }

  if (phone !== undefined) { params.push(phone.trim() || null); updates.push(`phone = ${params.length}`); }
  if (address !== undefined) { params.push(address.trim() || null); updates.push(`address = ${params.length}`); }
  if (accountType !== undefined) {
    if (!['personal', 'business'].includes(accountType)) return res.status(400).json({ error: 'accountType must be personal or business.' });
    params.push(accountType); updates.push(`account_type = ${params.length}`);
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
  updates.push(`updated_at = NOW()`);
  params.push(user.id);

  const { rows: updated } = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ${params.length} RETURNING *`,
    params
  );

  // If email changed: revoke sessions + send security notification
  if (emailChanged) {
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [user.id]);
    await pool.query(
      `INSERT INTO notifications (user_id, title, body, kind) VALUES ($1, 'Email address updated', $2, 'security')`,
      [user.id, `Your email address has been updated by an administrator from ${user.email} to ${updated[0].email}.`]
    );
  }

  const u = updated[0];
  return res.json({
    user: {
      id: u.id, name: u.name, email: u.email, phone: u.phone, address: u.address,
      accountType: u.account_type, emailVerified: u.email_verified, isActive: u.is_active,
    },
  });
});

// ─── POST /api/admin/users/:id/archive — archive a customer ──────────────────

router.post('/users/:id/archive', requireConfirmToken, async (req, res) => {
  const { reason } = req.body ?? {};

  // ── Guard: reason is mandatory ────────────────────────────────────────────────
  if (!reason?.trim()) {
    return res.status(400).json({ error: 'A reason is required to archive a customer.' });
  }

  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1 AND role = 'customer'`, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  const user = rows[0];

  if (user.archived_at) return res.status(409).json({ error: 'Customer is already archived.' });

  // ── Fetch all active accounts owned by this customer ─────────────────────────
  const { rows: accounts } = await pool.query(
    `SELECT * FROM accounts WHERE user_id = $1 AND status = 'active'`,
    [user.id]
  );

  // ── Validate every active account satisfies close conditions ─────────────────
  // All checks must pass for every account before any account is touched.
  if (accounts.length > 0) {
    // Fetch pending transaction counts for all accounts in one query.
    const accountIds = accounts.map(a => a.id);
    const { rows: pendingCounts } = await pool.query(
      `SELECT account_id, COUNT(*)::int AS count
       FROM transactions
       WHERE account_id = ANY($1) AND status = 'pending'
       GROUP BY account_id`,
      [accountIds]
    );
    const pendingByAccount = Object.fromEntries(pendingCounts.map(r => [r.account_id, r.count]));

    for (const acct of accounts) {
      const balance   = Number(acct.balance);
      const available = Number(acct.available);
      const held      = balance - available;
      const pending   = pendingByAccount[acct.id] ?? 0;
      const name      = acct.name;

      if (balance !== 0) {
        return res.status(409).json({
          error: `Cannot archive customer. Account "${name}" cannot be closed because the balance is not zero.`,
        });
      }
      if (available !== 0) {
        return res.status(409).json({
          error: `Cannot archive customer. Account "${name}" cannot be closed because the available balance is not zero.`,
        });
      }
      if (held !== 0) {
        return res.status(409).json({
          error: `Cannot archive customer. Account "${name}" cannot be closed because funds are currently reserved.`,
        });
      }
      if (pending > 0) {
        return res.status(409).json({
          error: `Cannot archive customer. Account "${name}" cannot be closed because there ${pending === 1 ? 'is 1 pending transaction' : `are ${pending} pending transactions`}. Resolve or cancel them first.`,
        });
      }
    }
  }

  // ── All accounts are closeable — execute atomically ───────────────────────────
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Close every active account.
    for (const acct of accounts) {
      await client.query(
        `UPDATE accounts SET status = 'closed', closed_at = NOW(),
         close_reason = 'Closed automatically during customer archival.', updated_at = NOW()
         WHERE id = $1`,
        [acct.id]
      );
    }

    // Archive the customer.
    await client.query(
      `UPDATE users SET is_active = false, archived_at = NOW(), archive_reason = $1, updated_at = NOW() WHERE id = $2`,
      [reason.trim(), user.id]
    );

    // Revoke all active sessions.
    await client.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [user.id]);

    // Audit trail notification (user cannot see it post-archival, but it is retained).
    await client.query(
      `INSERT INTO notifications (user_id, title, body, kind) VALUES ($1, 'Account archived', $2, 'security')`,
      [user.id, `Account archived by administrator. Reason: ${reason.trim()}`]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin archive] failed:', err.message);
    return res.status(500).json({ error: 'Archival failed. Please try again.' });
  } finally {
    client.release();
  }

  return res.json({ id: user.id, archived: true, accountsClosed: accounts.length });
});

// ─── PATCH /api/admin/accounts/:id/name — rename an account ──────────────────

router.patch('/accounts/:id/name', async (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });

  const { rows } = await pool.query(
    `UPDATE accounts SET name = $1, updated_at = NOW() WHERE id = $2 AND status = 'active' RETURNING id, name`,
    [name.trim(), req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Account not found or already closed.' });
  return res.json({ id: rows[0].id, name: rows[0].name });
});

// ─── POST /api/admin/accounts/:id/close — soft-close an account ──────────────

router.post('/accounts/:id/close', requireConfirmToken, async (req, res) => {
  const { reason } = req.body ?? {};

  // Fetch the account and a count of its pending transactions in one round-trip.
  const [{ rows: acctRows }, { rows: pendingRows }] = await Promise.all([
    pool.query(
      `SELECT a.*, u.id AS user_id FROM accounts a JOIN users u ON u.id = a.user_id WHERE a.id = $1`,
      [req.params.id]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM transactions WHERE account_id = $1 AND status = 'pending'`,
      [req.params.id]
    ),
  ]);

  if (acctRows.length === 0) return res.status(404).json({ error: 'Account not found.' });
  const account = acctRows[0];

  // ── Guard: already closed ────────────────────────────────────────────────────
  if (account.status === 'closed') {
    return res.status(409).json({ error: 'Account is already closed.' });
  }

  const balance   = Number(account.balance);
  const available = Number(account.available);
  const held      = balance - available; // positive when funds are reserved/held

  // ── Guard 1: balance must be exactly zero ────────────────────────────────────
  if (balance !== 0) {
    return res.status(409).json({
      error: 'Account cannot be closed because the balance is not zero.',
    });
  }

  // ── Guard 2: available balance must be exactly zero ──────────────────────────
  if (available !== 0) {
    return res.status(409).json({
      error: 'Account cannot be closed because the available balance is not zero.',
    });
  }

  // ── Guard 3 & 4: no held or reserved funds ───────────────────────────────────
  // held > 0 means balance and available have diverged — funds are reserved.
  // held < 0 would indicate a data integrity issue; block closure in that case too.
  if (held !== 0) {
    return res.status(409).json({
      error: 'Account cannot be closed because funds are currently reserved.',
    });
  }

  // ── Guard 5: no pending (in-progress) transactions ───────────────────────────
  if (pendingRows[0].count > 0) {
    return res.status(409).json({
      error: `Account cannot be closed because there ${pendingRows[0].count === 1 ? 'is 1 pending transaction' : `are ${pendingRows[0].count} pending transactions`}. Resolve or cancel them first.`,
    });
  }

  // ── All conditions satisfied — proceed with soft-close ───────────────────────
  await pool.query(
    `UPDATE accounts SET status = 'closed', closed_at = NOW(), close_reason = $1, updated_at = NOW() WHERE id = $2`,
    [reason?.trim() || null, account.id]
  );

  await pool.query(
    `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
     VALUES ($1, 'Account closed', $2, 'info', 'account', $3)`,
    [account.user_id, `Your ${account.name} has been closed. ${reason?.trim() ? reason.trim() : ''}`.trim(), account.id]
  );

  return res.json({ id: account.id, status: 'closed' });
});

// ─── PATCH /api/admin/transactions/:id/description — edit description/category

router.patch('/transactions/:id/description', async (req, res) => {
  const { name, category } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: 'Description (name) is required.' });

  // Fetch the transaction to determine its period for statement invalidation
  const { rows: txRows } = await pool.query(
    `SELECT t.*, a.user_id FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE t.id = $1`,
    [req.params.id]
  );
  if (txRows.length === 0) return res.status(404).json({ error: 'Transaction not found.' });
  const tx = txRows[0];

  const updates = [`name = $1`];
  const params  = [name.trim()];

  if (category !== undefined && category.trim()) {
    params.push(category.trim());
    updates.push(`category = ${params.length}`);
  }

  params.push(tx.id);
  await pool.query(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ${params.length}`, params);

  // Invalidate any already-generated statement PDF that covers this transaction's period
  // so it regenerates with the updated description on next access.
  const d = new Date(tx.occurred_at);
  const periodLabel = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  await pool.query(
    `UPDATE statements SET file_url = NULL WHERE account_id = $1 AND period = $2`,
    [tx.account_id, periodLabel]
  );

  return res.json({ id: tx.id, name: name.trim() });
});

// ─── POST /api/admin/transactions/:id/void — void with explicit reversal ──────

router.post('/transactions/:id/void', requireConfirmToken, async (req, res) => {
  const { reason } = req.body ?? {};
  if (!reason?.trim()) return res.status(400).json({ error: 'Reason is required for a void.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: txRows } = await client.query(
      `SELECT t.*, a.name AS account_name, a.user_id, a.balance AS account_balance, a.available AS account_available,
              u.name AS user_name, u.email AS user_email
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN users u ON u.id = a.user_id
       WHERE t.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (txRows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Transaction not found.' }); }
    const tx = txRows[0];

    if (tx.status !== 'completed') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Only completed transactions can be voided. Use reject for pending ones.' });
    }
    if (tx.reversed_by) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This transaction has already been voided.' });
    }
    if (tx.tx_type === 'void_reversal') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Cannot void a void-reversal entry.' });
    }

    const reversalAmount = -Number(tx.amount); // opposite sign

    // Post the void-reversal transaction
    const { rows: reversalRows } = await client.query(
      `INSERT INTO transactions
         (account_id, name, category, amount, status, initiated_by, tx_type, admin_reason, reversal_of, occurred_at)
       VALUES ($1, $2, $3, $4, 'completed', 'admin', 'void_reversal', $5, $6, NOW()) RETURNING id`,
      [
        tx.account_id,
        `Void: ${tx.name}`,
        tx.category,
        reversalAmount,
        reason.trim(),
        tx.id,
      ]
    );
    const reversalId = reversalRows[0].id;

    // Link the original transaction to its reversal
    await client.query(`UPDATE transactions SET reversed_by = $1 WHERE id = $2`, [reversalId, tx.id]);

    // Adjust account balance and available (reversal unwinds the original amount)
    await client.query(
      `UPDATE accounts SET balance = balance + $1, available = available + $1, updated_at = NOW() WHERE id = $2`,
      [reversalAmount, tx.account_id]
    );

    // Invalidate statement PDFs for both the original period and the current period
    const origDate = new Date(tx.occurred_at);
    const origPeriod = origDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const nowDate = new Date();
    const nowPeriod = nowDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const periodsToInvalidate = [...new Set([origPeriod, nowPeriod])];
    await client.query(
      `UPDATE statements SET file_url = NULL WHERE account_id = $1 AND period = ANY($2::text[])`,
      [tx.account_id, periodsToInvalidate]
    );

    // Notify the customer
    await client.query(
      `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
       VALUES ($1, 'Transaction voided', $2, 'payment', 'transaction', $3)`,
      [tx.user_id, `A transaction of ${Math.abs(Number(tx.amount)).toFixed(2)} (${tx.name}) has been voided and reversed.`, reversalId]
    );

    await client.query('COMMIT');
    return res.json({ originalId: tx.id, reversalId, reversalAmount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin void] failed:', err.message);
    return res.status(500).json({ error: 'Void failed. Please try again.' });
  } finally {
    client.release();
  }
});

// ─── POST /api/admin/accounts/:id/credit — credit any account ────────────────

router.post('/accounts/:id/credit', async (req, res) => {
  const { amount, description, reason, category } = req.body ?? {};
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Enter a valid positive amount.' });
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required.' });
  if (!reason?.trim()) return res.status(400).json({ error: 'Internal reason is required.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: acctRows } = await client.query(
      `SELECT a.*, u.name AS user_name, u.email AS user_email
       FROM accounts a JOIN users u ON u.id = a.user_id
       WHERE a.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (acctRows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Account not found.' }); }
    const account = acctRows[0];

    await client.query(
      'UPDATE accounts SET balance = balance + $1, available = available + $1, updated_at = NOW() WHERE id = $2',
      [value, account.id]
    );

    const label = description.trim();
    const cat = category?.trim() || 'Credit';
    const { rows: creditTxRows } = await client.query(
      `INSERT INTO transactions (account_id, name, category, amount, status, initiated_by, tx_type, admin_reason, occurred_at)
       VALUES ($1, $2, $3, $4, 'completed', 'admin', 'adjustment', $5, NOW()) RETURNING id`,
      [account.id, label, cat, value, reason.trim()]
    );
    await client.query(
      `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
       VALUES ($1, 'Account credit', $2, 'payment', 'transaction', $3)`,
      [account.user_id, `${value.toFixed(2)} has been credited to your ${account.name}.`, creditTxRows[0].id]
    );

    await client.query('COMMIT');

    sendAdminTransactionEmail({
      to: account.user_email,
      name: account.user_name,
      type: cat,
      amount: value,
      description: label,
      accountName: account.name,
    }).catch((e) => console.error('[email] admin credit:', e.message));

    const { rows: updated } = await pool.query('SELECT * FROM accounts WHERE id = $1', [account.id]);
    return res.json({ account: { id: updated[0].id, balance: Number(updated[0].balance), available: Number(updated[0].available) } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin credit] failed:', err.message);
    return res.status(500).json({ error: 'Credit failed. Please try again.' });
  } finally {
    client.release();
  }
});

// ─── POST /api/admin/accounts/:id/debit — debit any account ─────────────────

router.post('/accounts/:id/debit', async (req, res) => {
  const { amount, description, reason, category, allowNegative } = req.body ?? {};
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Enter a valid positive amount.' });
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required.' });
  if (!reason?.trim()) return res.status(400).json({ error: 'Internal reason is required.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: acctRows } = await client.query(
      `SELECT a.*, u.name AS user_name, u.email AS user_email
       FROM accounts a JOIN users u ON u.id = a.user_id
       WHERE a.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (acctRows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Account not found.' }); }
    const account = acctRows[0];

    if (!allowNegative && Number(account.balance) < value) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance. Use allowNegative=true to override.' });
    }

    await client.query(
      'UPDATE accounts SET balance = balance - $1, available = GREATEST(available - $1, 0), updated_at = NOW() WHERE id = $2',
      [value, account.id]
    );

    const label = description.trim();
    const cat = category?.trim() || 'Debit';
    const { rows: debitTxRows } = await client.query(
      `INSERT INTO transactions (account_id, name, category, amount, status, initiated_by, tx_type, admin_reason, occurred_at)
       VALUES ($1, $2, $3, $4, 'completed', 'admin', 'adjustment', $5, NOW()) RETURNING id`,
      [account.id, label, cat, -value, reason.trim()]
    );
    await client.query(
      `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
       VALUES ($1, 'Account debit', $2, 'payment', 'transaction', $3)`,
      [account.user_id, `${value.toFixed(2)} has been debited from your ${account.name}.`, debitTxRows[0].id]
    );

    await client.query('COMMIT');

    sendAdminTransactionEmail({
      to: account.user_email,
      name: account.user_name,
      type: cat,
      amount: -value,
      description: label,
      accountName: account.name,
    }).catch((e) => console.error('[email] admin debit:', e.message));

    const { rows: updated } = await pool.query('SELECT * FROM accounts WHERE id = $1', [account.id]);
    return res.json({ account: { id: updated[0].id, balance: Number(updated[0].balance), available: Number(updated[0].available) } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin debit] failed:', err.message);
    return res.status(500).json({ error: 'Debit failed. Please try again.' });
  } finally {
    client.release();
  }
});

// ─── POST /api/admin/transfer — transfer between any two accounts ─────────────

router.post('/transfer', async (req, res) => {
  const { fromAccountId, toAccountId, amount, description } = req.body ?? {};
  const value = Number(amount);

  if (!fromAccountId || !toAccountId) return res.status(400).json({ error: 'Both accounts are required.' });
  if (fromAccountId === toAccountId) return res.status(400).json({ error: 'Choose two different accounts.' });
  if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Enter a valid amount.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: accts } = await client.query(
      `SELECT a.*, u.name AS user_name, u.email AS user_email
       FROM accounts a JOIN users u ON u.id = a.user_id
       WHERE a.id = ANY($1::uuid[]) FOR UPDATE`,
      [[fromAccountId, toAccountId]]
    );
    const from = accts.find(a => a.id === fromAccountId);
    const to = accts.find(a => a.id === toAccountId);
    if (!from || !to) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Account(s) not found.' }); }

    const label = description?.trim() || `Admin transfer from ${from.name} to ${to.name}`;

    await client.query(
      'UPDATE accounts SET balance = balance - $1, available = available - $1, updated_at = NOW() WHERE id = $2',
      [value, from.id]
    );
    await client.query(
      'UPDATE accounts SET balance = balance + $1, available = available + $1, updated_at = NOW() WHERE id = $2',
      [value, to.id]
    );
    // Two separate inserts (instead of a single multi-row VALUES) so we can
    // capture each transaction's id for notification deep-linking.
    const { rows: fromTxRows } = await client.query(
      `INSERT INTO transactions (account_id, name, category, amount, status, initiated_by, occurred_at)
       VALUES ($1, $2, 'Transfer', $3, 'completed', 'admin', NOW()) RETURNING id`,
      [from.id, `${label} (out)`, -value]
    );
    const { rows: toTxRows } = await client.query(
      `INSERT INTO transactions (account_id, name, category, amount, status, initiated_by, occurred_at)
       VALUES ($1, $2, 'Transfer', $3, 'completed', 'admin', NOW()) RETURNING id`,
      [to.id, `${label} (in)`, value]
    );

    await Promise.all([
      client.query(
        `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
         VALUES ($1, 'Account transfer', $2, 'payment', 'transaction', $3)`,
        [from.user_id, `${value.toFixed(2)} transferred from your ${from.name}.`, fromTxRows[0].id]
      ),
      ...(to.user_id !== from.user_id
        ? [client.query(
            `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
             VALUES ($1, 'Account credit', $2, 'payment', 'transaction', $3)`,
            [to.user_id, `${value.toFixed(2)} credited to your ${to.name}.`, toTxRows[0].id]
          )]
        : []),
    ]);

    await client.query('COMMIT');

    // Email both parties (best-effort)
    sendAdminTransactionEmail({ to: from.user_email, name: from.user_name, type: 'Transfer', amount: -value, description: `${label} (out)`, accountName: from.name })
      .catch(e => console.error('[email] admin transfer from:', e.message));
    if (to.user_id !== from.user_id) {
      sendAdminTransactionEmail({ to: to.user_email, name: to.user_name, type: 'Transfer', amount: value, description: `${label} (in)`, accountName: to.name })
        .catch(e => console.error('[email] admin transfer to:', e.message));
    }

    const { rows: updated } = await pool.query('SELECT * FROM accounts WHERE id = ANY($1::uuid[])', [[fromAccountId, toAccountId]]);
    return res.json({
      accounts: updated.map(a => ({ id: a.id, name: a.name, balance: Number(a.balance), available: Number(a.available) })),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin transfer] failed:', err.message);
    return res.status(500).json({ error: 'Transfer failed. Please try again.' });
  } finally {
    client.release();
  }
});

// ─── PATCH /api/admin/transactions/:id/confirm — confirm a pending transaction ─

router.patch('/transactions/:id/confirm', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: txRows } = await client.query(
      `SELECT t.*, a.name AS account_name, a.user_id,
              u.name AS user_name, u.email AS user_email
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN users u ON u.id = a.user_id
       WHERE t.id = $1 AND t.status = 'pending' FOR UPDATE`,
      [req.params.id]
    );
    if (txRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending transaction not found.' });
    }
    const tx = txRows[0];
    const value = Math.abs(Number(tx.amount));
    const meta = tx.metadata ?? {};

    // Deduct from balance (available was already reduced when user submitted)
    await client.query(
      'UPDATE accounts SET balance = balance - $1, updated_at = NOW() WHERE id = $2',
      [value, tx.account_id]
    );

    // If it was a transfer, credit the destination account
    if (meta.type === 'transfer' && meta.toAccountId) {
      await client.query(
        'UPDATE accounts SET balance = balance + $1, available = available + $1, updated_at = NOW() WHERE id = $2',
        [value, meta.toAccountId]
      );
      await client.query(
        `INSERT INTO transactions (account_id, name, category, amount, status, initiated_by, occurred_at)
         VALUES ($1, $2, 'Transfer', $3, 'completed', 'user', NOW())`,
        [meta.toAccountId, `Transfer from ${meta.fromAccountName || tx.account_name}`, value]
      );
    }

    // Mark original transaction completed
    await client.query(
      `UPDATE transactions SET status = 'completed', occurred_at = NOW() WHERE id = $1`,
      [tx.id]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
       VALUES ($1, 'Transaction completed', $2, 'payment', 'transaction', $3)`,
      [tx.user_id, `Your ${tx.category.toLowerCase()} of ${value.toFixed(2)} has been completed.`, tx.id]
    );

    await client.query('COMMIT');

    sendTransactionConfirmedEmail({
      to: tx.user_email,
      name: tx.user_name,
      type: tx.category,
      amount: value,
      description: tx.name,
      accountName: tx.account_name,
    }).catch(e => console.error('[email] confirm tx:', e.message));

    return res.json({ id: tx.id, status: 'completed' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin confirm tx] failed:', err.message);
    return res.status(500).json({ error: 'Failed to confirm transaction.' });
  } finally {
    client.release();
  }
});

// ─── PATCH /api/admin/transactions/:id/reject — reject a pending transaction ──

router.patch('/transactions/:id/reject', async (req, res) => {
  const { reason } = req.body ?? {};

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: txRows } = await client.query(
      `SELECT t.*, a.name AS account_name, a.user_id,
              u.name AS user_name, u.email AS user_email
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN users u ON u.id = a.user_id
       WHERE t.id = $1 AND t.status = 'pending' FOR UPDATE`,
      [req.params.id]
    );
    if (txRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending transaction not found.' });
    }
    const tx = txRows[0];
    const value = Math.abs(Number(tx.amount));

    // Restore the held available balance
    await client.query(
      'UPDATE accounts SET available = available + $1, updated_at = NOW() WHERE id = $2',
      [value, tx.account_id]
    );

    // Mark transaction as failed
    await client.query(
      `UPDATE transactions SET status = 'failed' WHERE id = $1`,
      [tx.id]
    );

    const notifBody = reason?.trim()
      ? `Your ${tx.category.toLowerCase()} of $${value.toFixed(2)} could not be completed: ${reason.trim()}`
      : `Your ${tx.category.toLowerCase()} of $${value.toFixed(2)} could not be completed. Any held funds have been returned.`;

    await client.query(
      `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
       VALUES ($1, 'Transaction unsuccessful', $2, 'payment', 'transaction', $3)`,
      [tx.user_id, notifBody, tx.id]
    );

    await client.query('COMMIT');

    sendTransactionRejectedEmail({
      to: tx.user_email,
      name: tx.user_name,
      type: tx.category,
      amount: value,
      description: tx.name,
      reason: reason?.trim() || null,
    }).catch(e => console.error('[email] reject tx:', e.message));

    return res.json({ id: tx.id, status: 'failed' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin reject tx] failed:', err.message);
    return res.status(500).json({ error: 'Failed to reject transaction.' });
  } finally {
    client.release();
  }
});

// ─── GET /api/admin/settings — site-wide settings ─────────────────────────────

router.get('/settings', async (req, res) => {
  const { rows } = await pool.query(`SELECT key, value FROM site_settings`);
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  return res.json({ settings });
});

// ─── PATCH /api/admin/settings — update the WhatsApp contact number ───────────

router.patch('/settings/whatsapp', async (req, res) => {
  const { whatsappNumber } = req.body ?? {};
  if (typeof whatsappNumber !== 'string') {
    return res.status(400).json({ error: 'whatsappNumber must be a string.' });
  }

  // Accept an optional leading '+', otherwise digits only (E.164-ish); empty string clears it.
  const trimmed = whatsappNumber.trim();
  if (trimmed && !/^\+?[0-9]{6,15}$/.test(trimmed)) {
    return res.status(400).json({ error: 'Enter a valid phone number with country code, digits only (e.g. +15551234567).' });
  }

  await pool.query(
    `INSERT INTO site_settings (key, value, updated_at) VALUES ('whatsapp_number', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [trimmed]
  );

  return res.json({ whatsappNumber: trimmed });
});

module.exports = router;
