const express = require('express');
const pool = require('../db/pool');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, accountType: u.account_type, totpEnabled: u.totp_enabled };
}

// ─── GET /api/user/me ──────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
  if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: publicUser(rows[0]) });
});

// ─── PATCH /api/user/me ────────────────────────────────────────────────────────

router.patch('/me', requireAuth, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });

  const { rows } = await pool.query(
    'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [name.trim(), req.user.sub]
  );

  if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: publicUser(rows[0]) });
});

module.exports = router;
