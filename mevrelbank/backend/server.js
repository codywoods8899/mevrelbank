require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes    = require('./src/routes/auth');
const mfaRoutes     = require('./src/routes/mfa');
const userRoutes    = require('./src/routes/user');
const bankingRoutes = require('./src/routes/banking');

const app  = express();
const PORT = process.env.PORT ?? process.env.BACKEND_PORT ?? 3001;

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

app.use(helmet());

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

app.options('/{*splat}', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '16kb' }));

console.log('[cors] allowed origins:', allowedOrigins.length ? allowedOrigins : '(all — CORS_ORIGIN not set)');

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'mevrelbank-backend', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth',    authRoutes);
app.use('/api/mfa',     mfaRoutes);
app.use('/api/user',    userRoutes);
app.use('/api/banking', bankingRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const pool = require('./src/db/pool');

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`MevrelBank Backend running on port ${PORT}`);
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Connected to Neon successfully.');
  } catch (err) {
    console.error('[DB] Connection failed:', err?.message || String(err));
  }
});
