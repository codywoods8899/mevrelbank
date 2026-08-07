const { authenticator } = require('otplib');
const QRCode = require('qrcode');

authenticator.options = { window: 1 };

function generateSecret() {
  return authenticator.generateSecret(20);
}

function generateOtpauthUrl(email, secret) {
  return authenticator.keyuri(email, 'MevrelBank', secret);
}

async function generateQRCode(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl, {
    width: 240,
    margin: 2,
    color: { dark: '#0B3270', light: '#ffffff' },
  });
}

function verifyToken(token, secret) {
  try {
    return authenticator.check(token, secret);
  } catch {
    return false;
  }
}

module.exports = { generateSecret, generateOtpauthUrl, generateQRCode, verifyToken };
