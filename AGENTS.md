# MevrelBank — Agent Onboarding

> **Read this entire document before making any changes, additions, or plans.**  
> It tells you what this project is, how it is structured, what decisions have been locked in, what standards apply, and what the current state of each part is.

---

## What This Repository Is

This repository is the complete engineering home for **MevrelBank** — a digital banking platform — plus two supporting services: the **AICG** (AI Context Gateway) and a **GitHub → Dropbox Sync** utility.

The product being actively built is MevrelBank. The AICG and sync system are operational utilities; do not refactor them unless explicitly asked.

---

## Repository Layout

```
/
├── mevrelbank/                     ← Banking platform
│   ├── brand/                      ← Logo assets, brand files (read-only reference)
│   ├── design-systems/
│   │   └── agents/figma/
│   │       └── Figma Design System For Banking Ecosystem v0.1.0/
│   │           ├── src/            ← React frontend (the actual app)
│   │           ├── vite.config.ts  ← Vite config (has /api proxy to backend)
│   │           └── package.json
│   ├── backend/                    ← Node.js/Express API (Phase 2 auth backend)
│   │   ├── server.js
│   │   ├── src/db/                 ← Neon PostgreSQL pool + schema + migrate
│   │   ├── src/routes/             ← auth.js, mfa.js, user.js
│   │   ├── src/services/           ← email.js (Resend), totp.js (otplib)
│   │   ├── src/middleware/         ← requireAuth.js, rateLimiter.js
│   │   └── src/utils/              ← jwt.js, otp.js
│   └── roadmap.md                  ← Living roadmap — read before planning new work
├── aicg/                           ← AI Context Gateway (separate service, port 3000)
├── docs/                           ← Dropbox sync system documentation
├── .github/scripts/                ← Dropbox sync scripts
└── AGENTS.md                       ← You are here
```

> **The frontend source** is deep inside `mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/src/`. This is the real app, not a design file. All React components, pages, and context live there.

---

## Tech Stack

### Frontend
- **React 18** + **Vite 6** + **TypeScript**
- **React Router v7** — client-side routing
- **Tailwind CSS v4** — all styling
- **Radix UI** + **shadcn/ui** — accessible primitive components (in `src/app/components/ui/`)
- **Lucide React** — icons
- **Recharts** — charts
- **Framer Motion** (`motion`) — animations
- **Resend** is never called from the frontend — always call the backend

### Backend (`mevrelbank/backend/`)
- **Node.js 20** + **Express 5**
- **Neon PostgreSQL** — via `DATABASE_URL` secret (pg pool)
- **JWT** — `jsonwebtoken` — access token (15 min) + refresh token (7 days)
- **bcryptjs** — password hashing (rounds: 12)
- **Resend** — transactional email via `RESEND_API_KEY` secret
- **otplib** — TOTP (RFC 6238) for authenticator-app MFA
- **qrcode** — QR generation for TOTP setup
- **express-rate-limit** — rate limiting on auth endpoints

### Hosting (planned production)
- **Frontend**: Cloudflare Pages → `https://mevrelbank.com`
- **Backend**: Railway (Node.js) — `mevrelbank/backend/Dockerfile` is the production image; `railway.json` selects DOCKERFILE builder
- **Database**: Neon PostgreSQL
- **Email**: Resend via `noreply@mevrelbank.com`

---

## Workflows (Replit Dev)

| Workflow | Command | Port |
|---|---|---|
| `MevrelBank Dev (verify)` | `cd mevrelbank/design-systems/.../v0.1.0 && npx vite --port 5173 --host 0.0.0.0` | 5173 |
| `MevrelBank Backend` | `cd mevrelbank/backend && node server.js` | 3001 |
| `Start application` | `cd aicg && node server.js` | 3000 |

The Vite dev server proxies `/api/*` → `http://localhost:3001` (see `vite.config.ts`). Frontend code should always use relative `/api/...` paths — never hardcode the port directly.

---

## Email Addresses

| Address | Provider | Purpose |
|---|---|---|
| `noreply@mevrelbank.com` | Resend | All automated transactional email (OTPs, resets, alerts) |
| `hello@mevrelbank.com` | SpaceMail | General enquiries, contact form |
| `support@mevrelbank.com` | SpaceMail | Customer support |
| `security@mevrelbank.com` | SpaceMail | Security team, fraud reports |
| `compliance@mevrelbank.com` | SpaceMail | Legal & regulatory |
| `careers@mevrelbank.com` | SpaceMail | Job applications |

Never add new email addresses without explicit instruction — the SpaceMail account has a hard limit of 5 mailboxes. The 6th (noreply) is on Resend and has no mailbox.

---

## Authentication Flow (Phase 2 — Current)

```
Register → Email OTP verification → Login → [TOTP MFA if enabled] → Dashboard
```

**Key rules:**
1. TOTP MFA is optional — users without it set up go straight to dashboard after login
2. SMS fallback sends an email OTP instead (no Twilio in Phase 2)
3. Password reset uses a 6-digit code sent to email (not a magic link)
4. Access token lives in React memory only — never `localStorage`
5. Refresh token lives in `localStorage` under key `mb.refreshToken`
6. Never expose `DATABASE_URL`, `JWT_SECRET`, or any credential to the frontend

**API prefix:** All backend endpoints are at `/api/...`

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | — | Register new user, sends verification email |
| `/api/auth/verify-email` | POST | — | Confirm 6-digit OTP |
| `/api/auth/resend-otp` | POST | — | Resend OTP (rate-limited: 3/min) |
| `/api/auth/login` | POST | — | Login, returns tokens or MFA temp token |
| `/api/auth/refresh` | POST | — | Exchange refresh token for new access token |
| `/api/auth/logout` | POST | Bearer | Revoke refresh token |
| `/api/auth/forgot-password` | POST | — | Send reset OTP to email |
| `/api/auth/reset-password` | POST | — | Confirm code + set new password |
| `/api/mfa/verify` | POST | — | Verify TOTP code, complete login |
| `/api/mfa/send-email-code` | POST | — | Send email OTP as MFA fallback |
| `/api/mfa/setup` | GET | Bearer | Get TOTP secret + QR code |
| `/api/mfa/enable` | POST | Bearer | Confirm TOTP and enable |
| `/api/mfa/disable` | POST | Bearer | Disable TOTP (requires valid code) |
| `/api/user/me` | GET | Bearer | Get current user profile |
| `/api/user/me` | PATCH | Bearer | Update user name |
| `/api/health` | GET | — | Backend health check |

---

## Database Schema

Three tables in Neon PostgreSQL. Run `node src/db/migrate.js` from `mevrelbank/backend/` to apply.

- `users` — id, name, email, password_hash, account_type, email_verified, totp_enabled, totp_secret
- `otp_codes` — user_id, code, type (email_verification | password_reset | mfa_email), expires_at, used
- `refresh_tokens` — user_id, token_hash (SHA-256 of raw token), expires_at, revoked

---

## Design System & Brand Standards

- **Primary colour**: `#0B3270` (navy blue)
- **Background**: `#F4F6FA`
- **Text primary**: `#0D1829`
- **Text secondary**: `#5E6E8E`
- **Text muted**: `#9AAABF`, `#8A9BBE`
- **Accent/Error**: `#C52B2B`
- **Success**: `#16A34A`
- **Primary font**: `Figtree` (headings, brand) — `sans-serif` fallback
- **Body font**: system sans-serif / Tailwind default
- **Border radius**: `rounded-[10px]` to `rounded-[16px]` for cards, `rounded-[12px]` for inputs
- **Shadow / borders**: `border-[rgba(11,50,112,0.07)]` — always soft blue-tinted borders, never grey

**Never use** generic Bootstrap/Tailwind button colours. Use the custom brand colours. The `Btn` component (`src/app/website/shared/Btn.tsx`) is the standard button — use it.

---

## Coding Standards

1. **TypeScript everywhere** in the frontend. Backend uses plain JS (CommonJS `require`).
2. **No inline secrets** — all credentials come from environment secrets. Use `process.env.*` in backend.
3. **No direct DB calls from frontend** — the frontend only calls `/api/*` endpoints.
4. **No Supabase, Firebase, Clerk, PlanetScale, or similar** — the stack is locked (Neon + Railway + Resend).
5. **Keep components small** — if a page exceeds ~250 lines, split logic into sub-components.
6. **Relative imports** — use `@/` alias (mapped to `src/`) in the frontend.
7. **Rate-limit all auth endpoints** — never add unauthenticated mutation routes without rate limiting.
8. **Accessible HTML** — `aria-label`, `role`, keyboard navigation for all interactive elements.
9. **Always update `mevrelbank/roadmap.md`** when a phase item is completed.

---

## Secrets Reference

| Secret | Where Used |
|---|---|
| `DATABASE_URL` | Backend — Neon PostgreSQL connection string |
| `JWT_SECRET` | Backend — sign/verify access tokens |
| `JWT_REFRESH_SECRET` | Backend — sign/verify refresh tokens |
| `JWT_MFA_SECRET` | Backend — sign/verify MFA temp tokens |
| `RESEND_API_KEY` | Backend — Resend email SDK |
| `HELLO_EMAIL_PASSWORD` | SpaceMail — hello@ inbox |
| `SUPPORT_EMAIL_PASSWORD` | SpaceMail — support@ inbox |
| `SECURITY_EMAIL_PASSWORD` | SpaceMail — security@ inbox |
| `COMPLIANCE_EMAIL_PASSWORD` | SpaceMail — compliance@ inbox |
| `CAREERS_EMAIL_PASSWORD` | SpaceMail — careers@ inbox |
| `SPACEMAIL_SMTP_HOST` | SpaceMail SMTP config |
| `SPACEMAIL_SMTP_PORT` | SpaceMail SMTP config |
| `SESSION_SECRET` | AICG service only |
| `G_TOKEN` | AICG service only — GitHub read token |

**Never read secret values** from code execution or logs. Use `viewEnvVars({ type: "secret" })` to check existence only.

---

## Current Phase Status

| Phase | Status |
|---|---|
| 0 — Foundation | ✅ Complete |
| 1 — Public Website | ✅ Complete (9 pages, SEO, routing) |
| 2 — Auth Backend | ✅ Complete — backend live on Railway, wired to Cloudflare Pages |
| 3 — Customer Banking | 🟡 Frontend scaffolded with mock data, awaiting real APIs |
| 4–11 | ⬜ Planned — see roadmap.md |

---

## Production Deployment Log

A record of hard-won lessons from the first production deployment. Read this before touching anything deployment-related.

### Railway (Backend)

**Root directory must be `mevrelbank/backend/`** — set this in Railway service Settings → Source. Without it Railway reads the wrong `package.json`.

**Port binding** — Railway injects its own `PORT` env var and expects the server to bind to it. The server reads `process.env.PORT ?? process.env.BACKEND_PORT ?? 3001`. Never hardcode a port. Do not set `PORT` manually in Railway Variables — Railway controls it.

**`package-lock.json` must not be committed** — Replit generates lockfiles using an internal proxy (`package-firewall.replit.local`). Railway cannot reach that URL so `npm ci` silently fails and `node_modules` is empty. The lockfile is gitignored. Railway runs `npm install` fresh on each build using `.npmrc` (which pins `registry=https://registry.npmjs.org`).

**Dockerfile is the build method** — `railway.json` sets `"builder": "DOCKERFILE"`. Railway builds from `mevrelbank/backend/Dockerfile`. The image runs as a non-root user (`mevrel`) on Alpine Node 20.

**Express 5 wildcard syntax** — Express 5 breaks the old `app.options('*', ...)` pattern. Use `app.options('/{*splat}', cors(corsOptions))` for CORS preflight handling.

**Resend must be initialised lazily** — `new Resend(key)` throws immediately at import time if `RESEND_API_KEY` is missing, crashing the server before it binds. The email service uses `getClient()` which instantiates on first use.

**DB errors need their own try/catch** — Express 5 catches unhandled async errors but the generic handler swallows the message. Wrap DB operations in explicit try/catch and return `res.status(500).json({ error: err.message })` so the real error is visible during debugging.

### Railway Environment Variables (all required)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Full Neon pooled connection string — click "Show password" in Neon before copying |
| `JWT_SECRET` | Generate with `openssl rand -hex 64` — do NOT reuse the Replit value |
| `JWT_REFRESH_SECRET` | Same — fresh value for production |
| `JWT_MFA_SECRET` | Same — fresh value for production |
| `RESEND_API_KEY` | From resend.com → API Keys |
| `CORS_ORIGIN` | `https://mevrelbank.com` |
| `NOREPLY_EMAIL` | `noreply@mevrelbank.com` |
| `NODE_ENV` | `production` |

Railway injects `PORT` automatically — do not add it.

### Neon (Database)

**Use the pooled connection string** — in Neon dashboard, enable "Connection pooling" toggle before copying the URL. The pooler endpoint contains `-pooler` in the hostname.

**Strip `channel_binding=require` from the URL** — Neon now appends `&channel_binding=require` to connection strings but node-postgres (`pg`) does not support this parameter and silently fails with an empty error message. `pool.js` strips it automatically via regex before passing the URL to `new Pool()`.

**Run migration after first deploy** — from Railway Console tab or from Replit dev environment (which shares the same `DATABASE_URL`): `cd mevrelbank/backend && node src/db/migrate.js`

### Cloudflare Pages (Frontend)

**`VITE_API_BASE_URL` must include `https://`** — setting it to `mevrelbank-production.up.railway.app` (no protocol) makes the browser treat it as a relative path. Must be `https://mevrelbank-production.up.railway.app`.

**Add as Text variable, not Secret** — it's baked into the JS bundle at build time and is publicly visible in the source. Secrets are for server-side Pages Functions only.

**A redeploy is required after adding env vars** — Cloudflare Pages does not hot-apply env vars. Trigger a fresh build via Deployments → Retry deployment, or push a new commit.

**Build settings:**
- Root directory: `/`
- Build command: `npm --prefix "mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0" install && npm --prefix "mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0" run build`
- Output directory: `mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/dist`

---

## What To Do Before Any New Work

1. Read `mevrelbank/roadmap.md` for priorities and locked decisions.
2. Read the relevant route/component files before touching them.
3. Check `AGENTS.md` (this file) for design, stack, and standards constraints.
4. Do not invent new dependencies — check what's already in `package.json` first.
5. Do not add new email addresses, database tables, or API routes without understanding how they fit the existing architecture.
6. After completing a roadmap item, mark it `[x]` in `roadmap.md`.
