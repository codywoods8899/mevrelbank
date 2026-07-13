const { verifyAccess } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }
  const token = header.slice(7);
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Access token expired or invalid. Please sign in again.' });
  }
}

/** Chain after requireAuth. Rejects unless the access token's role claim is 'admin'. */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = requireAuth;
module.exports.requireAdmin = requireAdmin;
