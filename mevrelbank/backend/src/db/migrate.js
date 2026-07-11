require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('[migrate] Running schema migration...');
  try {
    await pool.query(sql);
    console.log('[migrate] Done.');
  } catch (err) {
    console.error('[migrate] Failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
