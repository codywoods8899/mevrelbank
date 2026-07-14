const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// ─── GET /api/settings/public — read-only, no auth ───────────────────────────
// Used by the floating WhatsApp widget on every page (public site + dashboard).

router.get('/public', async (req, res) => {
  const { rows } = await pool.query(`SELECT value FROM site_settings WHERE key = 'whatsapp_number'`);
  res.json({ whatsappNumber: rows[0]?.value ?? '' });
});

module.exports = router;
