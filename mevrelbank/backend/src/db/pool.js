const { Pool } = require('pg');

// node-postgres does not support channel_binding — strip it from the URL
const rawUrl = process.env.DATABASE_URL ?? '';
const connectionString = rawUrl.replace(/[&?]channel_binding=[^&]*/g, '').replace(/\?&/, '?');

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

module.exports = pool;
