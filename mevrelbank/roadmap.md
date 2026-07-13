# MevrelBank Roadmap

> **Status:** Active Development
>
> This document is the living roadmap for MevrelBank. It defines the project's vision, current mission, major milestones, completed work, and future direction. It is updated whenever a significant architectural, design, or engineering milestone is achieved.

---

# Vision

Build MevrelBank into a secure, modern, scalable digital banking ecosystem that delivers a premium banking experience across web, mobile, and future digital channels.

---

# Current Mission

## Phase 0 — Foundation

### Completed

- [x] Repository created
- [x] Brand architecture established
- [x] Logo system completed
- [x] Initial hosting strategy decided
- [x] Initial project structure defined
- [x] Design System (foundations, components, product screens)
- [x] Color System
- [x] Typography System
- [x] UI Foundations

---

## Phase 1 — Public Website

### Completed

- [x] Homepage scaffolded as standalone React app with routing
- [x] Navbar — responsive, accessible, sticky
- [x] Hero — brand voice, regulatory badge, stats
- [x] Trust bar — FSCS, FCA, ISO 27001 signals
- [x] Features — six product value pillars
- [x] App Preview — static dashboard mockup embedded in browser frame
- [x] CTA — open account conversion section
- [x] Footer — columns, legal, brand mark
- [x] Brand PNG logos in use (from `brand/logo/web/`)
- [x] Favicon wired up
- [x] React Router: `/` → homepage, `/ds` → design system demo
- [x] About page
- [x] Products & Services page
- [x] Contact page
- [x] FAQs page
- [x] Careers page
- [x] Blog / News
- [x] Security Center
- [x] Waitlist / lead capture page (`/waitlist`)
- [x] Per-route SEO (`<title>` + `<meta description>`)
- [x] Mobile nav (hamburger drawer)

---

## Phase 2 — Authentication

### In Progress

- [x] Auth page shell (`AuthShell`) — centered card layout, logo bar, minimal footer
- [x] Login page (`/login`) — email + password, show/hide toggle, error state, forgot/register links
- [x] Registration page (`/register`) — name, email, password strength, account type, T&C acceptance
- [x] Email Verification page (`/verify-email`) — 6-digit OTP grid, paste support, resend countdown
- [x] Forgot Password page (`/forgot-password`) — email input, success/inbox state
- [x] Reset Password page (`/reset-password`) — new password form, strength indicator, success state
- [x] MFA page (`/mfa`) — TOTP input, SMS fallback toggle, resend countdown
- [x] Client-side auth flow wired end-to-end (register → verify-email → login → MFA → session) — now backed by real Railway backend + Neon PostgreSQL
- [x] Protected route wrapper (redirect unauthenticated users away from `/dashboard`; redirect authenticated users away from `/login`/`/register`)
- [x] Backend auth API (Railway / Node.js) — Node.js/Express on Replit dev (port 3001), deploys to Railway
- [x] JWT strategy (short-lived access token + refresh token) — access 15min, refresh 7d, MFA temp 5min
- [x] Email service integration (verification + reset emails) — Resend via noreply@mevrelbank.com
- [x] MFA TOTP provisioning (QR code setup flow) — otplib + qrcode, setup in /dashboard/profile

---

## Phase 3 — Customer Banking

### In Progress

- [x] Neon banking schema (`accounts`, `transactions`, `statements`, `beneficiaries`, `notifications`) + `/api/banking/*` REST routes, auth-scoped per user
- [x] New customers get two real zero-balance accounts (Current + Savings) auto-created on email verification, plus a welcome notification
- [x] Dashboard (`/dashboard`) — account summary cards + recent transactions now read from the real backend (balance-trend chart removed — no historical data source yet)
- [x] Accounts (`/dashboard/accounts`) — real account cards + cross-account activity feed from the database
- [x] Transaction History (`/dashboard/transactions`) — real transactions, filterable by account; CSV export button still UI-only
- [x] Statements (`/dashboard/statements`) — reads real `statements` rows; "Download" is disabled until PDF generation exists (table has no rows yet — nothing generates statements)
- [x] Beneficiaries (`/dashboard/beneficiaries`) — add/list/delete real payees; "Pay" is intentionally disabled — no transfer/payment rails yet (that's Phase 4)
- [x] Notifications (`/dashboard/notifications`) — real notifications, mark-as-read wired to the backend
- [x] Profile (`/dashboard/profile`) — "Edit details" now a real modal (name/phone/address), backed by `PATCH /api/user/me`; avatar and richer security-status widgets still future work
- [x] Statement generation — lazily generated on `GET /api/banking/statements`: the previous calendar month is rendered to a real PDF (`pdfkit`) per account (if missing) with opening/closing balances computed from the ledger, streamed back via an auth-protected `GET /api/banking/statements/:id/file` route. There's no cron in this environment, so "monthly" means "next time anyone opens Statements after month-end," not a scheduled job — acceptable for now, worth revisiting if exact-date generation matters later.
- [x] CSV export for Transaction History — client-side export of the currently filtered transaction list, no backend change needed

Every dashboard page shares one `DashboardShell` layout (sidebar + top bar) with real routing and now talks to the real backend. Transaction seeding is naturally handled by Phase 4 below (transfers/payments now create real transaction rows); no synthetic data is seeded.

---

## Phase 4 — Payments

### In Progress

- [x] Internal Transfers — `POST /api/banking/transfer` moves real money between a signed-in user's own accounts inside our ledger (row-locked, atomic, generates a paired debit/credit transaction + notification). Wired into `/dashboard/accounts` via a "Transfer" button/modal.
- [x] Bill Payments (to saved beneficiaries) — `POST /api/banking/pay` debits the chosen account and records a payment transaction. Wired into `/dashboard/beneficiaries`'s "Pay" button (previously disabled).
  - **Important caveat:** this is a real balance change *within MevrelBank's own database only*. MevrelBank has no licensed Banking-as-a-Service / payment-rail partner yet, so a "payment" to a beneficiary does not reach an external bank — the beneficiary's real-world account balance is unaffected. This was an explicit, autonomous scope decision: implementing genuine Faster Payments/BACS settlement requires business/legal/compliance onboarding with a BaaS provider that can't be done unattended. Treat current payments as an internal ledger feature, not a live money-transmission feature, until a real settlement rail is integrated.
- [ ] Local Transfers (to other MevrelBank customers by account number) — not yet built
- [ ] Scheduled Transfers
- [ ] Airtime
- [ ] Data Purchase
- [ ] QR Payments
- [ ] Real external settlement rail (Faster Payments/BACS via a licensed BaaS partner) — required before "Pay" can move real money outside MevrelBank; needs a human to select and contract a provider

---

## Phase 5 — Cards

- Debit Cards
- Virtual Cards
- Card Controls
- Freeze / Unfreeze
- PIN Management

---

## Phase 6 — Savings & Investments

- Savings Accounts
- Fixed Deposits
- Investment Products

---

## Phase 7 — Loans

- Loan Application
- Loan Dashboard
- Repayment
- Eligibility Engine

---

## Phase 8 — Business Banking

- Business Accounts
- Bulk Transfers
- Payroll
- Corporate Users

---

## Phase 9 — Administration

- Admin Portal
- Staff Portal
- Customer Management
- Role Management
- Audit Logs
- Reports

---

## Phase 10 — Security

- Fraud Detection
- Device Management
- Session Management
- Risk Monitoring
- Security Center

---

## Phase 11 — Production

- Monitoring
- Analytics
- Backups
- Disaster Recovery
- Performance Optimization

---

# Milestones

| Milestone | Status |
|-----------|--------|
| Repository Created | ✅ |
| Brand Identity Started | ✅ |
| Logo System Completed | ✅ |
| Design System | ✅ |
| Public Website (homepage) | ✅ |
| Customer Banking | ✅ |
| Internal Payments (ledger-only) | ✅ |
| External Settlement Rail | ⬜ |
| Production Launch | ⬜ |

---

# Decisions Log

## Hosting

Frontend
- Cloudflare Pages

Backend
- Railway

Database
- Cloudflare D1 (SQLite at the edge via Pages Functions — active, `waitlist_submissions`)
- Neon PostgreSQL — active, backing Phase 2 auth (`users` incl. `phone`/`address`, `otp_codes`, `refresh_tokens`) and Phase 3/4 banking data (`accounts`, `transactions`, `statements` incl. balances, `beneficiaries`, `notifications`). Account balances are a denormalized running total kept in sync by every transaction-writing endpoint (transfer, pay); statement opening/closing balances are derived from summing `transactions` up to a point in time, so the ledger is internally self-consistent.

Payments
- No external payment/settlement rail is connected. Internal transfers and beneficiary payments are real ledger operations inside our own Neon database, not real money movement to other banks. This was a deliberate scope decision — see Phase 4 notes — since selecting and contracting a licensed Banking-as-a-Service provider requires human/business decisions that can't be made autonomously.

Statement generation
- No cron/scheduler exists in this environment. Statements for the prior calendar month are generated lazily the next time `GET /api/banking/statements` is called for a user, and cached (one row per account+period) so they're not regenerated. Revisit if a real scheduled job is needed later.

Storage
- Cloudflare R2

Repository
- GitHub

## Website Architecture

- React + Vite (Tailwind CSS v4)
- React Router v7 for client-side routing
- `/` → Public website homepage
- `/ds` → Design system & product demo reference
- Brand logo PNGs served from `public/brand/`
- Website components under `src/app/website/`

---

# Future Scope

Items added here become part of future planning before being assigned to a phase.

- Mobile Banking
- iOS App
- Android App
- Open Banking APIs
- AI Assistant
- Merchant Services
- POS Integration
- International Transfers
- Multi-Currency Accounts
- Wealth Management
- Insurance Products

---

# Notes

This roadmap is a living document.

New ideas should **not** be inserted directly into development. Instead, they should first be recorded here, reviewed, prioritized, and then assigned to the appropriate project phase.

Completed milestones should be checked off as they are delivered, ensuring this document always reflects the current state of the MevrelBank project.
