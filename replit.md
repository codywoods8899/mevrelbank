# Project Overview

This repository contains two projects:

## 1. AICG — AI Context Gateway (`aicg/`)

A secure, read-only Node.js/Express intelligence gateway that gives an authorized AI session autonomous access to a GitHub repository (search, read files, navigate folders, inspect the tree). It never modifies the repository.

### Stack
- Node.js 20 / Express 5
- `@octokit/rest` for GitHub API access
- `bcrypt`, `uuid`, `dotenv`

### Required Secrets (Replit Secrets)
| Secret | Purpose |
|---|---|
| `CHAT_GPT_READONLY_PAT` | GitHub personal access token (read-only scope) |
| `SESSION_SECRET` | Authorization credential — present this to `POST /authorize` |

### Run
⏸ **AICG is paused.** The "Start application" workflow now prints a notice instead of starting the server. See `aicg/README.md` for context. Do not re-enable it without deliberate human intent.

### Session Flow
1. `POST /authorize` with `{ "token": "<SESSION_SECRET>" }` → returns `{ "sessionId": "..." }`
2. All subsequent requests include header `X-Session-ID: <sessionId>`
3. `POST /invalidate` to terminate the session

Only **one** active session exists at any time. A new `/authorize` call invalidates the previous session.

### Endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | — | Service identity |
| GET | `/health` | — | Liveness probe |
| POST | `/authorize` | token | Exchange token for session ID |
| POST | `/invalidate` | session | Terminate active session |
| GET | `/tree` | session | Full repository tree (blocked paths stripped) |
| GET | `/folder?path=<path>` | session | List folder contents |
| GET | `/file?path=<path>` | session | Read and decode a file |
| GET | `/search?q=<query>&mode=<filename\|code\|both>` | session | Search repository |

### Blocked Paths
`.github/`, `.env*`, `secrets/` — always returns 403 regardless of session.

---

## 2. MevrelBank (`mevrelbank/`)

A digital banking platform currently in **Phase 5 — Sessions and administration** (with Phase 3 banking and Phase 4 ledger payments implemented).

### Status
- ✅ Brand architecture & logo system complete
- ✅ Design system / color system / typography complete
- ✅ Public website complete (9 routed pages, SEO, live at mevrelbank.com)
- ✅ Auth page UI complete (login, register, verify-email, forgot/reset password, MFA)
- ✅ Auth flow wired end-to-end against the backend: register → email verification → login → optional TOTP MFA → dashboard
- ✅ Full customer banking frontend: `/dashboard`, `/dashboard/accounts`, `/dashboard/transactions`, `/dashboard/statements`, `/dashboard/beneficiaries`, `/dashboard/profile`, `/dashboard/notifications` — shared sidebar layout and real API data
- ✅ Waitlist form with Cloudflare D1 backend (via Pages Functions)
- ✅ Phase 2 backend built and running in this Replit environment: JWT auth, Resend email, TOTP MFA, Neon PostgreSQL — frontend auth talks to the real backend here (see `mevrelbank/backend/`)
- ✅ Phase 3 banking data wired to Neon: `accounts`, `transactions`, `statements`, `beneficiaries`, `notifications` tables served via `/api/banking/*` routes and consumed by the dashboard pages (`src/app/website/shared/bankingApi.ts`) — mock data removed. New users receive Current + Savings accounts on email verification.
- ✅ Phase 3 complete: Profile edit (name/phone/address via `PATCH /api/user/me`), lazy monthly statement PDF generation (`pdfkit`, streamed via an auth-protected file route), and client-side Transaction History CSV export.
- ✅ Phase 4 ledger payments: `POST /api/banking/transfer` and `POST /api/banking/pay` create pending, admin-reviewable ledger transactions with held funds and notifications. **These do not reach any external bank** — MevrelBank has no licensed payment-rail/BaaS partner connected yet.
- ✅ Phase 5 sessions and administration: refresh tokens use httpOnly cookies, customer/admin access is separated, and the admin panel supports customer management, account/transaction controls, settings, and mailbox operations.
- ✅ Phase 5: cookie-based sessions — refresh tokens now live in httpOnly server cookies instead of `localStorage`, fixing the bug where reloading the dashboard forced re-login; login has a "Stay signed in" option (30-day session vs. default browser-session). Added a separate `/admin/*` panel restricted to the `support@mevrelbank.com` account (`role = 'admin'` in `users`, gated by `requireAdmin` + exact email match) with its own cookie namespace, KPI overview, searchable customer directory, customer detail view, and a suspend/reactivate toggle. Admin password is set by the account owner via the existing reset-password email flow, never known by the agent.
- ⬜ Phase 4+ (planned): local transfers to other MevrelBank customers, scheduled transfers, bill categories (airtime/data/QR), a real external settlement rail, cards

### Hosting
- Frontend: Cloudflare Pages (live at mevrelbank.com) — in this Replit workspace it runs via Vite dev server instead
- Backend: Render (free tier, web service) — in this Replit workspace it runs as the **MevrelBank Backend** workflow on port 3001; see `render.yaml` at the project root for the deployment config
- Database: Neon PostgreSQL (used by the Phase 2 backend here) + Cloudflare D1 (waitlist_submissions, production-only)
- Storage: Cloudflare R2 (planned)

See `mevrelbank/roadmap.md` for the full phased plan.

### Run (this Replit project)
Three independent workflows:
- **Start application** → `cd aicg && node server.js` (AICG gateway, port 3000)
- **MevrelBank Backend** → `cd mevrelbank/backend && node server.js` (port 3001; requires Neon `DATABASE_URL`, `RESEND_API_KEY`, and JWT secrets from Replit Secrets)
- **MevrelBank Dev (verify)** → runs the frontend at `mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/` via `npx vite --port 5173 --host 0.0.0.0`; proxies `/api/*` to the backend on port 3001

All three run independently — the AICG gateway is unrelated to the MevrelBank app. Dependencies (`node_modules`) for `aicg/`, `mevrelbank/backend/`, and the frontend were installed via `npm install` in each directory.

---

## User Preferences

_None recorded yet._
