const KV_KEY = 'active_session';

export async function createSession(kv, ttlMs) {
  const id  = crypto.randomUUID();
  const now = Date.now();
  const session = { id, createdAt: now, lastActivity: now, expiresAt: now + ttlMs };
  await kv.put(KV_KEY, JSON.stringify(session), {
    expirationTtl: Math.ceil(ttlMs / 1000),
  });
  return id;
}

export async function getSession(kv) {
  const raw = await kv.get(KV_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function validateSession(kv, sessionId) {
  const session = await getSession(kv);
  if (!session)                    return { valid: false, reason: 'no_active_session' };
  if (session.id !== sessionId)    return { valid: false, reason: 'invalid_session_id' };
  if (Date.now() > session.expiresAt) {
    await kv.delete(KV_KEY);
    return { valid: false, reason: 'session_expired' };
  }
  // Refresh last-activity
  session.lastActivity = Date.now();
  const remainingSec = Math.ceil((session.expiresAt - Date.now()) / 1000);
  await kv.put(KV_KEY, JSON.stringify(session), { expirationTtl: remainingSec });
  return { valid: true };
}

export async function invalidateAll(kv) {
  await kv.delete(KV_KEY);
}
