const isProd = process.env.NODE_ENV === 'production';

const CUSTOMER_COOKIE = 'mb_rt';
const ADMIN_COOKIE = 'mb_admin_rt';

const SHORT_TTL_MS = 24 * 60 * 60 * 1000;        // 1 day — default session (cleared on browser close via session cookie anyway)
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — "stay signed in"

function ttlMs(remember) {
  return remember ? REMEMBER_TTL_MS : SHORT_TTL_MS;
}

/** Options for the httpOnly refresh-token cookie. Omitting maxAge makes it a
 * browser session cookie (cleared when the browser fully closes) while the
 * server-side expiry still caps it at SHORT_TTL_MS as a safety net. */
function cookieOptions(remember) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api',
    ...(remember ? { maxAge: REMEMBER_TTL_MS } : {}),
  };
}

function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api',
  };
}

module.exports = { CUSTOMER_COOKIE, ADMIN_COOKIE, ttlMs, cookieOptions, clearCookieOptions };
