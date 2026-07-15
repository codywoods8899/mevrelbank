import { Hono }            from 'hono';
import { cors }            from 'hono/cors';
import { createSession, validateSession, invalidateSession, getSessionMeta } from './session.js';
import { getFilteredTree, isBlocked } from './tree.js';
import { readAllowed }     from './read.js';
import { search }          from './search.js';

const app = new Hono();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));

// ─── Session middleware ────────────────────────────────────────────────────────
async function requireSession(c, next) {
  const sessionId = c.req.header('x-session-id');
  if (!sessionId) {
    return c.json({ error: 'Unauthorized', detail: 'Missing X-Session-ID header' }, 401);
  }
  const result = await validateSession(c.env.SESSIONS, sessionId);
  if (!result.valid) {
    return c.json({ error: 'Unauthorized', detail: result.reason }, 401);
  }
  c.set('sessionId', sessionId);
  await next();
}

// ─── Identity ─────────────────────────────────────────────────────────────────
app.get('/', c => c.json({
  service: 'AI Context Gateway',
  version: '0.1.0',
  status:  'running',
}));

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', async c => {
  const session = await getSessionMeta(c.env.SESSIONS);
  return c.json({
    status:        'ok',
    service:       'AI Context Gateway',
    version:       '0.1.0',
    timestamp:     new Date().toISOString(),
    activeSession: session !== null,
  });
});

// ─── Authorize ────────────────────────────────────────────────────────────────
app.post('/authorize', async c => {
  const body = await c.req.json().catch(() => ({}));
  const { token } = body;

  if (!token) {
    return c.json({ error: 'missing_token' }, 400);
  }

  if (!c.env.SESSION_SECRET) {
    return c.json({ error: 'server_misconfigured' }, 503);
  }

  // Constant-time comparison
  const a = new TextEncoder().encode(token);
  const b = new TextEncoder().encode(c.env.SESSION_SECRET);
  let match = a.length === b.length;
  if (match) {
    const buf = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) buf[i] = a[i] ^ b[i];
    match = buf.every(v => v === 0);
  }

  if (!match) {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const sessionId = await createSession(c.env.SESSIONS);
  return c.json({ sessionId });
});

// ─── Invalidate ───────────────────────────────────────────────────────────────
app.post('/invalidate', requireSession, async c => {
  await invalidateSession(c.env.SESSIONS, c.get('sessionId'));
  return c.json({ invalidated: true });
});

// ─── Tree ─────────────────────────────────────────────────────────────────────
app.get('/tree', requireSession, async c => {
  try {
    const tree = await getFilteredTree(c.env);
    return c.json({ total: tree.length, tree });
  } catch (err) {
    return c.json({ error: err.message }, err.status || 500);
  }
});

// ─── Read ─────────────────────────────────────────────────────────────────────
app.get('/read', requireSession, async c => {
  const filePath = c.req.query('path');
  try {
    const file = await readAllowed(filePath, c.env);
    return c.json(file);
  } catch (err) {
    return c.json({ error: err.message }, err.status || 500);
  }
});

// ─── Search ───────────────────────────────────────────────────────────────────
app.get('/search', requireSession, async c => {
  const q    = c.req.query('q');
  const mode = c.req.query('mode') || 'both';
  try {
    const results = await search(q, mode, c.env);
    return c.json(results);
  } catch (err) {
    return c.json({ error: err.message }, err.status || 500);
  }
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.notFound(c => c.json({ error: 'Not found' }, 404));

export default app;
