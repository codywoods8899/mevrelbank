/**
 * requireActiveCustomer
 *
 * Must be chained AFTER requireAuth.
 *
 * Loads the current user from the database and verifies:
 *   - user exists
 *   - role = 'customer'
 *   - is_active = true
 *   - archived_at IS NULL
 *
 * Returns HTTP 403 on any failure so suspended or archived customers
 * cannot reach any banking operation.
 */

const pool = require('../db/pool');

async function requireActiveCustomer(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, role, is_active, archived_at FROM users WHERE id = $1',
      [req.user.sub],
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Account not found.' });
    }

    const user = rows[0];

    if (user.role !== 'customer') {
      return res.status(403).json({ error: 'Access restricted to customer accounts.' });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Your account has been suspended. Please contact support for assistance.',
      });
    }

    if (user.archived_at !== null) {
      return res.status(403).json({
        error: 'Your account has been archived. Please contact support for assistance.',
      });
    }

    next();
  } catch (err) {
    console.error('[requireActiveCustomer]', err.message);
    return res.status(500).json({ error: 'Could not verify account status.' });
  }
}

module.exports = requireActiveCustomer;
