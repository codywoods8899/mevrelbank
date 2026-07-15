/**
 * KV-backed session management.
 *
 * Two KV keys:
 *   "active"          → current session ID (string)
 *   "meta:{sessionId}" → JSON session metadata
 *
 * Only one active session exists at any time.
 * KV TTL handles expiry automatically; we also check expiresAt on read.
 */

const SESSION_TTL_MS  = 86_400_000; // 24 hours
const SESSION_TTL_SEC = SESSION_TTL_MS / 1000;

/**
 * Create a new session, invalidating any previous one.
 * @param {KVNamespace} kv
 * @returns {string} new session ID
 */
export async function createSession(kv) {
  // Invalidate any existing session first
  const oldId = await kv.get('active');
  if (oldId) await kv.delete(`meta:${oldId}`);

  const sessionId = crypto.randomUUID();
  const now       = Date.now();
  const meta      = {
    id:           sessionId,
    createdAt:    now,
    lastActivity: now,
    expiresAt:    now + SESSION_TTL_MS,
  };

  await Promise.all([
    kv.put('active', sessionId,              { expirationTtl: SESSION_TTL_SEC }),
    kv.put(`meta:${sessionId}`, JSON.stringify(meta), { expirationTtl: SESSION_TTL_SEC }),
  ]);

  return sessionId;
}

/**
 * Validate a session ID.
 * @param {KVNamespace} kv
 * @param {string} sessionId
 * @returns {{ valid: boolean, reason?: string }}
 */
export async function validateSession(kv, sessionId) {
  if (!sessionId) return { valid: false, reason: 'missing_session_id' };

  const [activeId, raw] = await Promise.all([
    kv.get('active'),
    kv.get(`meta:${sessionId}`),
  ]);

  if (!activeId || !raw)            return { valid: false, reason: 'no_active_session' };
  if (activeId !== sessionId)       return { valid: false, reason: 'invalid_session_id' };

  const meta = JSON.parse(raw);
  if (Date.now() > meta.expiresAt) {
    await invalidateSession(kv, sessionId);
    return { valid: false, reason: 'session_expired' };
  }

  // Refresh lastActivity
  meta.lastActivity = Date.now();
  await kv.put(`meta:${sessionId}`, JSON.stringify(meta), { expirationTtl: SESSION_TTL_SEC });

  return { valid: true };
}

/**
 * Terminate the active session.
 * @param {KVNamespace} kv
 * @param {string} sessionId
 */
export async function invalidateSession(kv, sessionId) {
  await Promise.all([
    kv.delete('active'),
    sessionId ? kv.delete(`meta:${sessionId}`) : Promise.resolve(),
  ]);
}

/**
 * Return session metadata for health checks (no sensitive data).
 * @param {KVNamespace} kv
 * @returns {object|null}
 */
export async function getSessionMeta(kv) {
  const activeId = await kv.get('active');
  if (!activeId) return null;
  const raw = await kv.get(`meta:${activeId}`);
  return raw ? JSON.parse(raw) : null;
}
