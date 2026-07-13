const jwt = require('jsonwebtoken');

const ACCESS_TTL  = '15m';
const REFRESH_TTL = '7d';
const MFA_TTL     = '5m';

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

function signMfa(payload) {
  return jwt.sign(payload, process.env.JWT_MFA_SECRET, { expiresIn: MFA_TTL });
}

function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function verifyMfa(token) {
  return jwt.verify(token, process.env.JWT_MFA_SECRET);
}

function refreshExpiresAt(ttlMs = 7 * 24 * 60 * 60 * 1000) {
  return new Date(Date.now() + ttlMs);
}

module.exports = { signAccess, signRefresh, signMfa, verifyAccess, verifyRefresh, verifyMfa, refreshExpiresAt };
