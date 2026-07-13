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
    pool.query(`SELECT COUNT(*)::int AS count FROM transactions WHERE occurred_at > NOW() - INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer' AND email_verified = true`),
    pool.query(`SELECT COUNT(*)::int AS count FROM transactions WHERE status = 'pending'`),
  ]);

  return res.json({
    totalUsers: users.rows[0].count,
    verifiedUsers: verified.rows[0].count,
    totalAccounts: accounts.rows[0].count,
    totalBalance: Number(accounts.rows[0].total_balance),
    transactions30d: txns.rows[0].count,
    pendingTransactions: pending.rows[0].count,
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
      initiatedBy: t.initiated_by,
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

  const params = [];
  let where = `WHERE u.role = 'customer'`;
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(a.name) LIKE $${params.length})`;
  }

  params.push(pageSize, offset);
  const { rows } = await pool.query(
    `SELECT a.*, u.name AS user_name, u.email AS user_email
     FROM accounts a JOIN users u ON u.id = a.user_id
     ${where}
     ORDER BY u.name ASC, a.created_at ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
      sortCode: a.sort_code,
      accountNumber: a.account_number,
      balance: Number(a.balance),
      available: Number(a.available),
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
      amount: Number(t.amount),
      status: t.status,
      initiatedBy: t.initiated_by,
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
      amount: Number(t.amount),
      status: t.status,
      initiatedBy: t.initiated_by,
      metadata: t.metadata,
      date: t.occurred_at,
    })),
  });
});

// ─── POST /api/admin/accounts/:id/credit — credit any account ────────────────

router.post('/accounts/:id/credit', async (req, res) => {
  const { amount, description, category } = req.body ?? {};
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Enter a valid positive amount.' });
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required.' });

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
    await client.query(
      `INSERT INTO transactions (account_id, name, category, amount, status, initiated_by, occurred_at)
       VALUES ($1, $2, $3, $4, 'completed', 'admin', NOW())`,
      [account.id, label, cat, value]
    );
    await client.query(
      `INSERT INTO notifications (user_id, title, body, kind)
       VALUES ($1, 'Account credit', $2, 'payment')`,
      [account.user_id, `$${value.toFixed(2)} has been credited to your ${account.name}.`]
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
  const { amount, description, category, allowNegative } = req.body ?? {};
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Enter a valid positive amount.' });
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required.' });

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
    await client.query(
      `INSERT INTO transactions (account_id, name, category, amount, status, initiated_by, occurred_at)
       VALUES ($1, $2, $3, $4, 'completed', 'admin', NOW())`,
      [account.id, label, cat, -value]
    );
    await client.query(
      `INSERT INTO notifications (user_id, title, body, kind)
       VALUES ($1, 'Account debit', $2, 'payment')`,
      [account.user_id, `$${value.toFixed(2)} has been debited from your ${account.name}.`]
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
    await client.query(
      `INSERT INTO transactions (account_id, name, category, amount, status, initiated_by, occurred_at)
       VALUES ($1, $2, 'Transfer', $3, 'completed', 'admin', NOW()),
              ($4, $5, 'Transfer', $6, 'completed', 'admin', NOW())`,
      [from.id, `${label} (out)`, -value, to.id, `${label} (in)`, value]
    );

    await Promise.all([
      client.query(`INSERT INTO notifications (user_id, title, body, kind) VALUES ($1, 'Account transfer', $2, 'payment')`,
        [from.user_id, `$${value.toFixed(2)} transferred from your ${from.name}.`]),
      ...(to.user_id !== from.user_id
        ? [client.query(`INSERT INTO notifications (user_id, title, body, kind) VALUES ($1, 'Account credit', $2, 'payment')`,
            [to.user_id, `$${value.toFixed(2)} credited to your ${to.name}.`])]
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
      `INSERT INTO notifications (user_id, title, body, kind)
       VALUES ($1, 'Transaction completed', $2, 'payment')`,
      [tx.user_id, `Your ${tx.category.toLowerCase()} of $${value.toFixed(2)} has been completed.`]
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
      `INSERT INTO notifications (user_id, title, body, kind)
       VALUES ($1, 'Transaction unsuccessful', $2, 'payment')`,
      [tx.user_id, notifBody]
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

module.exports = router;
