import { createSession, invalidateAll } from './session.js';

/**
 * Constant-time string comparison — prevents timing-based token enumeration.
 * Uses XOR over encoded bytes; same length required for constant time.
 */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc  = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

/**
 * Validate the supplied token and, on success, create a new KV-backed session.
 * Any previously active session is unconditionally invalidated first.
 */
export async function authorize(token, kv, config) {
  if (!token) return { ok: false, reason: 'missing_token' };

  if (!config.auth.secret) {
    return { ok: false, reason: 'server_misconfigured', serverError: true };
  }

  if (!safeEqual(token, config.auth.secret)) {
    return { ok: false, reason: 'invalid_token' };
  }

  await invalidateAll(kv);
  const sessionId = await createSession(kv, config.session.ttlMs);
  return { ok: true, sessionId };
}
