// Generates real, unique 12-digit US-style account numbers (US banks have no
// single mandated length, but 10-12 digits is the common convention).
// Previously the app stored a masked placeholder (e.g. "•••• 4821") as the
// account_number itself, so customers could never see their own full number.
// This generates an actual number and checks the DB for collisions.

const pool = require('../db/pool');

const ACCOUNT_NUMBER_LENGTH = 12;

function randomDigits(length) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 10);
  }
  return out;
}

async function generateAccountNumber() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = randomDigits(ACCOUNT_NUMBER_LENGTH);
    const { rows } = await pool.query(
      'SELECT 1 FROM accounts WHERE account_number = $1 LIMIT 1',
      [candidate]
    );
    if (rows.length === 0) return candidate;
  }
  throw new Error('Could not generate a unique account number after 10 attempts.');
}

module.exports = { generateAccountNumber };
