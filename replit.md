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
| `G_TOKEN` | GitHub personal access token (read-only scope) |
| `SESSION_SECRET` | Authorization credential — present this to `POST /authorize` |

### Run
Workflow: **Start application** → `cd aicg && node server.js` (port 3000)

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

A digital banking platform currently in **Phase 2 — Authentication** (frontend auth pages complete; backend integration pending).

### Status
- ✅ Brand architecture & logo system complete
- ✅ Design system / color system / typography complete
- ✅ Public website complete (9 routed pages, SEO, live at mevrelbank.com)
- ✅ Auth page UI complete (login, register, verify-email, forgot/reset password, MFA)
- ✅ Auth flow wired end-to-end (client-side only — `localStorage`-backed register/login/verify/MFA, no real backend yet)
- ✅ Full customer banking frontend scaffold: `/dashboard`, `/dashboard/accounts`, `/dashboard/transactions`, `/dashboard/statements`, `/dashboard/beneficiaries`, `/dashboard/profile`, `/dashboard/notifications` — shared sidebar layout
- ✅ Waitlist form with Cloudflare D1 backend (via Pages Functions)
- ✅ Phase 2 backend built and running in this Replit environment: JWT auth, Resend email, TOTP MFA, Neon PostgreSQL — frontend auth now talks to a real backend here (see `mevrelbank/backend/`)
- ✅ Phase 3 banking data wired to Neon: `accounts`, `transactions`, `statements`, `beneficiaries`, `notifications` tables (see `mevrelbank/backend/src/db/schema.sql`) served via `/api/banking/*` routes and consumed by the dashboard pages (`src/app/website/shared/bankingApi.ts`) — mock data removed. New users get two zero-balance accounts (Current + Savings) seeded on email verification.
- ✅ Phase 3 complete: Profile edit (name/phone/address via `PATCH /api/user/me`), lazy monthly statement PDF generation (`pdfkit`, streamed via an auth-protected file route), and client-side Transaction History CSV export.
- ✅ Phase 4 started: real internal-ledger money movement — `POST /api/banking/transfer` (between a user's own accounts) and `POST /api/banking/pay` (to a saved beneficiary) both make atomic, real balance changes and write real transaction rows in Neon. **These do not reach any external bank** — MevrelBank has no licensed payment-rail/BaaS partner connected yet, so "Pay" only ever moves money within our own database. Wiring an external settlement rail needs a human business/compliance decision and is not something to build unattended.
- ✅ Phase 5: cookie-based sessions — refresh tokens now live in httpOnly server cookies instead of `localStorage`, fixing the bug where reloading the dashboard forced re-login; login has a "Stay signed in" option (30-day session vs. default browser-session). Added a separate `/admin/*` panel restricted to the `support@mevrelbank.com` account (`role = 'admin'` in `users`, gated by `requireAdmin` + exact email match) with its own cookie namespace, KPI overview, searchable customer directory, customer detail view, and a suspend/reactivate toggle. Admin password is set by the account owner via the existing reset-password email flow, never known by the agent.
- ⬜ Phase 4+ (planned): local transfers to other MevrelBank customers, scheduled transfers, bill categories (airtime/data/QR), a real external settlement rail, cards

### Hosting
- Frontend: Cloudflare Pages (live at mevrelbank.com) — in this Replit workspace it runs via Vite dev server instead
- Backend: Railway (planned for production) — in this Replit workspace it runs as the **MevrelBank Backend** workflow on port 3001
- Database: Neon PostgreSQL (used by the Phase 2 backend here) + Cloudflare D1 (waitlist_submissions, production-only)
- Storage: Cloudflare R2 (planned)

See `mevrelbank/roadmap.md` for the full phased plan.

### Run (this Replit project)
Three independent workflows:
- **Start application** → `cd aicg && node server.js` (AICG gateway, port 3000)
- **MevrelBank Backend** → `cd mevrelbank/backend && node server.js` (port 3001; requires Neon `DATABASE_URL`, Resend key, JWT secret — already configured)
- **MevrelBank Dev (verify)** → runs the frontend at `mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/` via `npx vite --port 5173 --host 0.0.0.0`; proxies `/api/*` to the backend on port 3001

All three run independently — the AICG gateway is unrelated to the MevrelBank app. Dependencies (`node_modules`) for `aicg/`, `mevrelbank/backend/`, and the frontend were installed via `npm install` in each directory.

---

## User Preferences

_None recorded yet._
