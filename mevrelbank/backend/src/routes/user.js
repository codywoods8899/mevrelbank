const express = require('express');
const pool = require('../db/pool');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    accountType: u.account_type,
    totpEnabled: u.totp_enabled,
    phone: u.phone,
    address: u.address,
    avatarUrl: u.avatar_url ?? null,
  };
}

// ─── GET /api/user/me ──────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
  if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: publicUser(rows[0]) });
});

// ─── PATCH /api/user/me ────────────────────────────────────────────────────────

router.patch('/me', requireAuth, async (req, res) => {
  const { name, phone, address, avatarUrl } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (phone !== undefined && phone !== null && phone.trim() && !/^[\d+()\-.\s]{6,30}$/.test(phone.trim())) {
    return res.status(400).json({ error: 'Enter a valid phone number.' });
  }

  // avatarUrl must be a data URL (image/*) or null/empty to clear
  if (avatarUrl !== undefined && avatarUrl !== null && avatarUrl !== '') {
    if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'avatarUrl must be a base64 image data URL.' });
    }
    // Limit to ~2 MB of base64 (roughly 2.7 MB raw)
    if (avatarUrl.length > 2_800_000) {
      return res.status(400).json({ error: 'Avatar image is too large (max ~2 MB).' });
    }
  }

  const newAvatarUrl = avatarUrl === '' ? null : (avatarUrl ?? undefined);

  const { rows } = await pool.query(
    `UPDATE users SET name = $1, phone = $2, address = $3${newAvatarUrl !== undefined ? ', avatar_url = $5' : ''}, updated_at = NOW() WHERE id = $4 RETURNING *`,
    newAvatarUrl !== undefined
      ? [name.trim(), phone?.trim() || null, address?.trim() || null, req.user.sub, newAvatarUrl]
      : [name.trim(), phone?.trim() || null, address?.trim() || null, req.user.sub]
  );

  if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: publicUser(rows[0]) });
});

module.exports = router;
