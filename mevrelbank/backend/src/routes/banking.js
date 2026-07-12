const express = require('express');
const pool = require('../db/pool');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

// ─── Helpers ────────────────────────────────────────────────────────────────

function publicAccount(a) {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    sortCode: a.sort_code,
    accountNumber: a.account_number,
    balance: Number(a.balance),
    available: Number(a.available),
  };
}

function publicTransaction(t) {
  return {
    id: t.id,
    accountId: t.account_id,
    account: t.account_name,
    name: t.name,
    category: t.category,
    amount: Number(t.amount),
    status: t.status,
    date: t.occurred_at,
  };
}

function publicStatement(s) {
  return {
    id: s.id,
    accountId: s.account_id,
    account: s.account_name,
    period: s.period,
    generated: s.generated_at,
    fileUrl: s.file_url,
  };
}

function publicBeneficiary(b) {
  return {
    id: b.id,
    name: b.name,
    nickname: b.nickname,
    sortCode: b.sort_code,
    accountNumber: b.account_number,
    lastPaid: b.last_paid_at,
  };
}

function publicNotification(n) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    kind: n.kind,
    read: n.read,
    time: n.created_at,
  };
}

// ─── GET /api/banking/accounts ───────────────────────────────────────────────

router.get('/accounts', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC',
    [req.user.sub]
  );
  return res.json({ accounts: rows.map(publicAccount) });
});

// ─── GET /api/banking/transactions ───────────────────────────────────────────

router.get('/transactions', async (req, res) => {
  const { accountId, limit } = req.query;
  const cap = Math.min(parseInt(limit, 10) || 100, 200);

  const params = [req.user.sub];
  let where = 'a.user_id = $1';
  if (accountId) {
    params.push(accountId);
    where += ` AND t.account_id = $${params.length}`;
  }
  params.push(cap);

  const { rows } = await pool.query(
    `SELECT t.*, a.name AS account_name
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     WHERE ${where}
     ORDER BY t.occurred_at DESC
     LIMIT $${params.length}`,
    params
  );
  return res.json({ transactions: rows.map(publicTransaction) });
});

// ─── GET /api/banking/statements ─────────────────────────────────────────────

router.get('/statements', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, a.name AS account_name
     FROM statements s
     JOIN accounts a ON a.id = s.account_id
     WHERE a.user_id = $1
     ORDER BY s.generated_at DESC`,
    [req.user.sub]
  );
  return res.json({ statements: rows.map(publicStatement) });
});

// ─── GET /api/banking/beneficiaries ──────────────────────────────────────────

router.get('/beneficiaries', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM beneficiaries WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.sub]
  );
  return res.json({ beneficiaries: rows.map(publicBeneficiary) });
});

// ─── POST /api/banking/beneficiaries ─────────────────────────────────────────

router.post('/beneficiaries', async (req, res) => {
  const { name, nickname, sortCode, accountNumber } = req.body ?? {};
  if (!name?.trim() || !sortCode?.trim() || !accountNumber?.trim()) {
    return res.status(400).json({ error: 'Name, sort code, and account number are required.' });
  }
  if (!/^\d{2}-?\d{2}-?\d{2}$/.test(sortCode.trim())) {
    return res.status(400).json({ error: 'Enter a valid 6-digit sort code.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO beneficiaries (user_id, name, nickname, sort_code, account_number)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.sub, name.trim(), nickname?.trim() || null, sortCode.trim(), accountNumber.trim()]
  );
  return res.status(201).json({ beneficiary: publicBeneficiary(rows[0]) });
});

// ─── DELETE /api/banking/beneficiaries/:id ───────────────────────────────────

router.delete('/beneficiaries/:id', async (req, res) => {
  const { rows } = await pool.query(
    'DELETE FROM beneficiaries WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.sub]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Beneficiary not found.' });
  return res.json({ message: 'Beneficiary removed.' });
});

// ─── GET /api/banking/notifications ──────────────────────────────────────────

router.get('/notifications', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
    [req.user.sub]
  );
  return res.json({ notifications: rows.map(publicNotification) });
});

// ─── PATCH /api/banking/notifications/:id/read ───────────────────────────────

router.patch('/notifications/:id/read', async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [req.params.id, req.user.sub]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Notification not found.' });
  return res.json({ notification: publicNotification(rows[0]) });
});

module.exports = router;
