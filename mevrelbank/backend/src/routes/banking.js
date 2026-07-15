const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');
const requireAuth = require('../middleware/requireAuth');
const { generateAccountNumber } = require('../lib/accountNumber');
const { ensureStatementsForUser } = require('../lib/generateStatements');
const { STORAGE_DIR } = require('../lib/statementPdf');
const {
  sendTransactionSubmittedEmail,
} = require('../services/email');

const router = express.Router();
router.use(requireAuth);

// ─── Helpers ────────────────────────────────────────────────────────────────

function publicAccount(a) {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    routingNumber: a.routing_number,
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
    routingNumber: b.routing_number,
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
    entityType: n.entity_type ?? null,
    entityId: n.entity_id ?? null,
    metadata: n.metadata ?? null,
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

// ─── POST /api/banking/accounts — open a new account ─────────────────────────
// Customers can open additional Current or Savings accounts from the dashboard.
// Each account gets the bank's fixed routing number + a fresh account number.

router.post('/accounts', async (req, res) => {
  const { type, name } = req.body ?? {};

  const VALID_TYPES = ['Current Account', 'Savings Account'];
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Account type must be "Current Account" or "Savings Account".' });
  }

  // Enforce a sensible cap so one customer can't create hundreds of accounts
  const { rows: existing } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM accounts WHERE user_id = $1',
    [req.user.sub]
  );
  if (existing[0].count >= 10) {
    return res.status(400).json({ error: 'You can hold a maximum of 10 accounts.' });
  }

  const ROUTING_NUMBER = '071001245';
  const accountNumber = await generateAccountNumber();

  // Default names: first account of type = base name, extras get a number suffix
  const { rows: sameType } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM accounts WHERE user_id = $1 AND type = $2',
    [req.user.sub, type]
  );
  const defaultName = name?.trim() ||
    (sameType[0].count === 0 ? type : `${type} ${sameType[0].count + 1}`);

  const { rows } = await pool.query(
    `INSERT INTO accounts (user_id, name, type, routing_number, account_number, balance, available)
     VALUES ($1, $2, $3, $4, $5, 0, 0) RETURNING *`,
    [req.user.sub, defaultName, type, ROUTING_NUMBER, accountNumber]
  );

  await pool.query(
    `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
     VALUES ($1, 'New account opened', $2, 'info', 'account', $3)`,
    [req.user.sub, `Your new ${defaultName} is ready to use.`, rows[0].id]
  );

  return res.status(201).json({ account: publicAccount(rows[0]) });
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
  try {
    await ensureStatementsForUser(req.user.sub);
  } catch (err) {
    console.error('[statements] generation failed:', err.message);
  }

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

// ─── GET /api/banking/statements/:id/file ────────────────────────────────────

router.get('/statements/:id/file', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.id FROM statements s
     JOIN accounts a ON a.id = s.account_id
     WHERE s.id = $1 AND a.user_id = $2`,
    [req.params.id, req.user.sub]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Statement not found.' });

  const filePath = path.join(STORAGE_DIR, `${rows[0].id}.pdf`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Statement file not available.' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="statement-${rows[0].id}.pdf"`);
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error('[statements] file stream failed:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Statement file could not be read.' });
    else res.destroy();
  });
  stream.pipe(res);
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
  const { name, nickname, routingNumber, accountNumber } = req.body ?? {};
  if (!name?.trim() || !routingNumber?.trim() || !accountNumber?.trim()) {
    return res.status(400).json({ error: 'Name, routing number, and account number are required.' });
  }
  if (!/^\d{9}$/.test(routingNumber.trim())) {
    return res.status(400).json({ error: 'Enter a valid 9-digit routing number.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO beneficiaries (user_id, name, nickname, routing_number, account_number)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.sub, name.trim(), nickname?.trim() || null, routingNumber.trim(), accountNumber.trim()]
  );

  await pool.query(
    `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
     VALUES ($1, 'Beneficiary added', $2, 'info', 'beneficiary', $3)`,
    [req.user.sub, `${name.trim()} has been added to your payees.`, rows[0].id]
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

// ─── POST /api/banking/transfer ──────────────────────────────────────────────
// Submits an internal transfer request. Funds are held (available reduced) and
// a pending transaction is created. Admin confirms or rejects on their panel.

router.post('/transfer', async (req, res) => {
  const { fromAccountId, toAccountId, amount, note } = req.body ?? {};
  const value = Number(amount);

  if (!fromAccountId || !toAccountId) return res.status(400).json({ error: 'Both accounts are required.' });
  if (fromAccountId === toAccountId) return res.status(400).json({ error: 'Choose two different accounts.' });
  if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Enter a valid amount.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: accts } = await client.query(
      'SELECT * FROM accounts WHERE id = ANY($1::uuid[]) AND user_id = $2 FOR UPDATE',
      [[fromAccountId, toAccountId], req.user.sub]
    );
    const from = accts.find((a) => a.id === fromAccountId);
    const to = accts.find((a) => a.id === toAccountId);
    if (!from || !to) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Account not found.' });
    }
    if (Number(from.available) < value) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient available balance.' });
    }

    // Hold the funds — reduce available but not balance
    await client.query(
      'UPDATE accounts SET available = available - $1, updated_at = NOW() WHERE id = $2',
      [value, from.id]
    );

    const label = note?.trim() || `Transfer to ${to.name}`;
    const metadata = { type: 'transfer', toAccountId: to.id, toAccountName: to.name, fromAccountName: from.name, note: label };

    const { rows: txRows } = await client.query(
      `INSERT INTO transactions (account_id, name, category, amount, status, initiated_by, metadata, occurred_at)
       VALUES ($1, $2, 'Transfer', $3, 'pending', 'user', $4, NOW()) RETURNING *`,
      [from.id, label, -value, JSON.stringify(metadata)]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
       VALUES ($1, 'Transfer submitted', $2, 'payment', 'transaction', $3)`,
      [req.user.sub, `Your transfer of ${value.toFixed(2)} to ${to.name} is being processed.`, txRows[0].id]
    );

    await client.query('COMMIT');

    // Send submitted email (best-effort)
    const { rows: userRows } = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.user.sub]);
    if (userRows.length > 0) {
      sendTransactionSubmittedEmail({
        to: userRows[0].email,
        name: userRows[0].name,
        type: 'Transfer',
        amount: value,
        description: label,
        accountName: from.name,
      }).catch((e) => console.error('[email] transfer submitted:', e.message));
    }

    const { rows: updated } = await pool.query(
      'SELECT * FROM accounts WHERE id = ANY($1::uuid[])',
      [[fromAccountId, toAccountId]]
    );
    return res.json({
      accounts: updated.map(publicAccount),
      transaction: publicTransaction({ ...txRows[0], account_name: from.name }),
      status: 'pending',
      message: 'Transfer submitted and is being processed.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[transfer] failed:', err.message);
    return res.status(500).json({ error: 'Transfer failed. Please try again.' });
  } finally {
    client.release();
  }
});

// ─── POST /api/banking/pay ────────────────────────────────────────────────────
// Submits a payment to a beneficiary. Funds are held and a pending transaction
// is created. Admin confirms or rejects on their panel.

router.post('/pay', async (req, res) => {
  const { accountId, beneficiaryId, amount, reference } = req.body ?? {};
  const value = Number(amount);

  if (!accountId || !beneficiaryId) return res.status(400).json({ error: 'Account and payee are required.' });
  if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Enter a valid amount.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: acctRows } = await client.query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [accountId, req.user.sub]
    );
    if (acctRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Account not found.' });
    }
    const account = acctRows[0];
    if (Number(account.available) < value) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient available balance.' });
    }

    const { rows: benRows } = await client.query(
      'SELECT * FROM beneficiaries WHERE id = $1 AND user_id = $2',
      [beneficiaryId, req.user.sub]
    );
    if (benRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payee not found.' });
    }
    const beneficiary = benRows[0];

    // Hold the funds — reduce available but not balance
    await client.query(
      'UPDATE accounts SET available = available - $1, updated_at = NOW() WHERE id = $2',
      [value, account.id]
    );

    const label = reference?.trim() || beneficiary.nickname || beneficiary.name;
    const metadata = {
      type: 'pay',
      beneficiaryId: beneficiary.id,
      beneficiaryName: beneficiary.nickname || beneficiary.name,
      reference: label,
      routingNumber: beneficiary.routing_number,
      accountNumber: beneficiary.account_number,
    };

    const { rows: txRows } = await client.query(
      `INSERT INTO transactions (account_id, name, category, amount, status, initiated_by, metadata, occurred_at)
       VALUES ($1, $2, 'Payment', $3, 'pending', 'user', $4, NOW()) RETURNING *`,
      [account.id, label, -value, JSON.stringify(metadata)]
    );

    await client.query('UPDATE beneficiaries SET last_paid_at = NOW() WHERE id = $1', [beneficiary.id]);
    await client.query(
      `INSERT INTO notifications (user_id, title, body, kind, entity_type, entity_id)
       VALUES ($1, 'Payment submitted', $2, 'payment', 'transaction', $3)`,
      [req.user.sub, `Your payment of ${value.toFixed(2)} to ${beneficiary.nickname || beneficiary.name} is being processed.`, txRows[0].id]
    );

    await client.query('COMMIT');

    // Send submitted email (best-effort)
    const { rows: userRows } = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.user.sub]);
    if (userRows.length > 0) {
      sendTransactionSubmittedEmail({
        to: userRows[0].email,
        name: userRows[0].name,
        type: 'Payment',
        amount: value,
        description: label,
        accountName: account.name,
      }).catch((e) => console.error('[email] pay submitted:', e.message));
    }

    const { rows: updated } = await pool.query('SELECT * FROM accounts WHERE id = $1', [account.id]);
    return res.json({
      account: publicAccount(updated[0]),
      transaction: publicTransaction({ ...txRows[0], account_name: account.name }),
      status: 'pending',
      message: 'Payment submitted and is being processed.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[pay] failed:', err.message);
    return res.status(500).json({ error: 'Payment failed. Please try again.' });
  } finally {
    client.release();
  }
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
