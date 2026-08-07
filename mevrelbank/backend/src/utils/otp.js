const crypto = require('crypto');

function generateOTP() {
  return String(crypto.randomInt(100000, 999999));
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function otpExpiresAt(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = { generateOTP, hashToken, otpExpiresAt };
