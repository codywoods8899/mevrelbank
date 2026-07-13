---
name: MevrelBank auth sessions and admin access
description: Cookie-based refresh session pattern, remember-me TTL branching, and admin role gating for MevrelBank backend/frontend.
---

Refresh tokens are opaque `uuidv4()` values stored (hashed) in the `refresh_tokens` table, never JWTs. The `/auth/refresh`, `/admin/refresh` endpoints must validate them via DB lookup only — never `jwt.verify()` on them. That mismatch (verifying an opaque token as if it were a JWT) was the root cause of a bug where every page reload forced re-login.

**Why:** access tokens are short-lived JWTs kept in memory (never persisted); refresh tokens live only in httpOnly, server-set cookies (`mb_rt` for customers, `mb_admin_rt` for admins — separate namespaces so one browser can hold both sessions at once). "Remember me" (`remember` flag, stored per-token in DB) branches cookie/session TTL: unchecked = browser-session cookie + 1-day server expiry; checked = 30-day cookie + 30-day server expiry. Rotation on refresh must preserve the original `remember` duration.

**How to apply:** Admin access is gated by exact-match `ADMIN_EMAIL` env var (default `support@mevrelbank.com`) plus `role = 'admin'` on the shared `users` table (no separate admin table) — enforced at login and via `requireAdmin` middleware. Admin credentials are provisioned by seeding the account then sending a real password-reset email through the existing flow, never by the agent inventing/knowing the password.

In this dev workspace, the Vite frontend proxies `/api/*` to the local backend on port 3001 (see vite.config.ts), but `VITE_API_BASE_URL` env var was set to the production Railway URL — which made the dev preview silently bypass the local backend and proxy. Fix: frontend API clients must use relative `/api` (empty base) whenever `import.meta.env.DEV` is true, and only use `VITE_API_BASE_URL` in production builds where frontend/backend aren't same-origin.
