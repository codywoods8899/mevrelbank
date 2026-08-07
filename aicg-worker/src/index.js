import { getConfig }        from './config.js';
import { authorize }        from './auth.js';
import { validateSession, invalidateAll, getSession } from './session.js';
import { getFilteredTree, isBlocked } from './tree.js';
import { listFolder }       from './github.js';
import { readAllowed }      from './read.js';
import { search }           from './search.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function httpStatus(err) {
  if (err.code   && err.code   >= 400) return err.code;
  if (err.status && err.status >= 400) return err.status;
  return 500;
}

async function requireSession(request, env, handler) {
  const sessionId = request.headers.get('x-session-id');
  if (!sessionId) {
    return json({ error: 'Unauthorized', detail: 'Missing X-Session-ID header' }, 401);
  }
  const result = await validateSession(env.SESSIONS, sessionId);
  if (!result.valid) {
    return json({ error: 'Unauthorized', detail: result.reason }, 401);
  }
  return handler(request, sessionId);
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

function handleRoot() {
  return json({ service: 'AI Context Gateway', version: '0.1.0', status: 'running' });
}

async function handleHealth(env) {
  const session = await getSession(env.SESSIONS);
  return json({
    status:        'ok',
    service:       'AI Context Gateway',
    version:       '0.1.0',
    timestamp:     new Date().toISOString(),
    activeSession: !!session,
  });
}

async function handleAuthorize(request, env) {
  const config = getConfig(env);
  let body = {};
  try { body = await request.json(); } catch (_) { /* empty body is fine */ }
  const { token } = body;

  const result = await authorize(token, env.SESSIONS, config);

  if (!result.ok) {
    let status = 401;
    if (result.reason === 'missing_token') status = 400;
    if (result.serverError)               status = 503;
    return json({ error: result.reason }, status);
  }

  return json({ sessionId: result.sessionId });
}

async function handleInvalidate(request, sessionId, env) {
  await invalidateAll(env.SESSIONS);
  return json({ invalidated: true });
}

async function handleTree(request, sessionId, env) {
  const config = getConfig(env);
  try {
    const tree = await getFilteredTree(config);
    return json({ total: tree.length, tree });
  } catch (err) {
    return json({ error: err.message }, httpStatus(err));
  }
}

async function handleFolder(request, sessionId, env) {
  const config     = getConfig(env);
  const url        = new URL(request.url);
  const folderPath = url.searchParams.get('path') || '';

  if (isBlocked(folderPath, config) && folderPath !== '') {
    return json({ error: 'Access denied: path is restricted' }, 403);
  }

  try {
    const items   = await listFolder(config.github.owner, config.github.repo, config.github.token, folderPath);
    const visible = items.filter(item => !isBlocked(item.path, config));
    return json({ path: folderPath || '/', total: visible.length, items: visible });
  } catch (err) {
    return json({ error: err.message }, httpStatus(err));
  }
}

async function handleFile(request, sessionId, env) {
  const config   = getConfig(env);
  const url      = new URL(request.url);
  const filePath = url.searchParams.get('path');

  try {
    const file = await readAllowed(filePath, config);
    return json(file);
  } catch (err) {
    return json({ error: err.message }, httpStatus(err));
  }
}

async function handleSearch(request, sessionId, env) {
  const config = getConfig(env);
  const url    = new URL(request.url);
  const q      = url.searchParams.get('q');
  const mode   = url.searchParams.get('mode') || 'both';

  const VALID_MODES = new Set(['filename', 'code', 'both']);
  if (!VALID_MODES.has(mode)) {
    return json({ error: `Invalid mode "${mode}". Must be one of: filename, code, both` }, 400);
  }

  try {
    const results = await search(q, mode, config);
    return json(results);
  } catch (err) {
    return json({ error: err.message }, httpStatus(err));
  }
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const method = request.method;
    const path   = url.pathname;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin':  '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
        },
      });
    }

    // Public routes
    if (method === 'GET'  && path === '/')       return handleRoot();
    if (method === 'GET'  && path === '/health') return handleHealth(env);
    if (method === 'POST' && path === '/authorize') return handleAuthorize(request, env);

    // Session-protected routes
    if (method === 'POST' && path === '/invalidate') {
      return requireSession(request, env, (req, sid) => handleInvalidate(req, sid, env));
    }
    if (method === 'GET' && path === '/tree') {
      return requireSession(request, env, (req, sid) => handleTree(req, sid, env));
    }
    if (method === 'GET' && path === '/folder') {
      return requireSession(request, env, (req, sid) => handleFolder(req, sid, env));
    }
    if (method === 'GET' && path === '/file') {
      return requireSession(request, env, (req, sid) => handleFile(req, sid, env));
    }
    if (method === 'GET' && path === '/search') {
      return requireSession(request, env, (req, sid) => handleSearch(req, sid, env));
    }

    return json({ error: 'Not found' }, 404);
  },
};
