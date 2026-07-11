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
- [x] Client-side auth flow wired end-to-end (register → verify-email → login → MFA → session), backed by `localStorage` only — no backend yet
- [x] Protected route wrapper (redirect unauthenticated users away from `/dashboard`; redirect authenticated users away from `/login`/`/register`)
- [x] Backend auth API (Railway / Node.js) — Node.js/Express on Replit dev (port 3001), deploys to Railway
- [x] JWT strategy (short-lived access token + refresh token) — access 15min, refresh 7d, MFA temp 5min
- [x] Email service integration (verification + reset emails) — Resend via noreply@mevrelbank.com
- [x] MFA TOTP provisioning (QR code setup flow) — otplib + qrcode, setup in /dashboard/profile

---

## Phase 3 — Customer Banking

- [x] Dashboard (`/dashboard`) — sidebar nav, account summary cards, balance trend chart, recent transactions; mock data, gated behind the mock auth session; real data pending Phase 2 backend
- [x] Accounts (`/dashboard/accounts`) — current + savings account cards, cross-account activity feed; mock data
- [x] Transaction History (`/dashboard/transactions`) — filterable by account, CSV export button (not yet wired to a real export); mock data
- [x] Statements (`/dashboard/statements`) — list of generated statement periods with download action (not yet wired to a real file); mock data
- [x] Beneficiaries (`/dashboard/beneficiaries`) — saved payee list with "Pay" / "New Payee" actions (UI only, no real transfer execution); mock data
- [x] Profile (`/dashboard/profile`) — personal details + security status summary (edit actions are UI only pending Phase 2 backend); mock data
- [x] Notifications (`/dashboard/notifications`) — security/payment/info alert feed; mock data

All Phase 3 pages above are frontend scaffolds sharing one `DashboardShell` layout (sidebar + top bar) with real routing; every action that would mutate real money or account state (pay, export, download, edit) is UI-only until the Phase 2 backend and corresponding banking APIs exist.

---

## Phase 4 — Payments

- Internal Transfers
- Local Transfers
- Scheduled Transfers
- Bill Payments
- Airtime
- Data Purchase
- QR Payments

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
| Customer Banking | ⬜ |
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
- Neon PostgreSQL (planned for Phase 2+ backend — auth, customer data)

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
