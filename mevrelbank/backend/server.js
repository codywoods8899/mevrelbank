require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./src/routes/auth');
const mfaRoutes  = require('./src/routes/mfa');
const userRoutes = require('./src/routes/user');

const app  = express();
const PORT = process.env.PORT ?? process.env.BACKEND_PORT ?? 3001;

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '16kb' }));

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'mevrelbank-backend', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/mfa',  mfaRoutes);
app.use('/api/user', userRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MevrelBank Backend running on port ${PORT}`);
});
