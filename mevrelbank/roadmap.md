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

### In Progress

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
- [ ] About page
- [ ] Products & Services page
- [ ] Contact page
- [ ] FAQs page
- [ ] Careers page
- [ ] Blog / News
- [ ] Security Center

---

## Phase 2 — Authentication

- Login
- Registration
- Email Verification
- OTP
- Password Reset
- Multi-Factor Authentication

---

## Phase 3 — Customer Banking

- Dashboard
- Accounts
- Transaction History
- Statements
- Beneficiaries
- Profile
- Notifications

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
| Public Website (homepage) | ⏳ |
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
- Neon PostgreSQL

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
