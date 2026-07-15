const jwt = require('jsonwebtoken');

const ACCESS_TTL   = '15m';
const REFRESH_TTL  = '7d';
const MFA_TTL      = '5m';
const CONFIRM_TTL  = '5m';

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

function signConfirm(payload) {
  return jwt.sign({ ...payload, purpose: 'destructive' }, process.env.JWT_SECRET, { expiresIn: CONFIRM_TTL });
}

function verifyConfirm(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.purpose !== 'destructive') throw new Error('Invalid token purpose.');
  return payload;
}

function refreshExpiresAt(ttlMs = 7 * 24 * 60 * 60 * 1000) {
  return new Date(Date.now() + ttlMs);
}

module.exports = { signAccess, signRefresh, signMfa, signConfirm, verifyAccess, verifyRefresh, verifyMfa, verifyConfirm, refreshExpiresAt };
