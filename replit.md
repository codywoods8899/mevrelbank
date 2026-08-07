# Project Overview

This repository contains MevrelBank, a digital banking platform currently in
Phase 5 — sessions and administration, with Phase 3 banking and Phase 4
ledger payments implemented.

## Repository layout

- `mevrelbank/` — the banking platform
- `mevrelbank/backend/` — Node.js/Express API, Neon PostgreSQL, Resend email,
  JWT access tokens, cookie sessions, TOTP MFA, banking, payments, and admin
  routes
- `mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/`
  — the React/Vite frontend
- `docs/` — historical GitHub-to-Dropbox sync documentation
- `archives/` — preserved evidence archives for retired workspace utilities

The former AI Context Gateway source was retired from this workspace on
2026-08-07. Its tracked Node and Cloudflare Worker source is preserved in
`archives/aicg-retired-2026-08-07.zip` with a SHA-256 sidecar checksum. It is
not part of the active application or any workflow.

## Active workflows

- **MevrelBank Dev (verify)** — Vite frontend on port 5173
- **MevrelBank Backend** — Express API on port 3001

The frontend proxies relative `/api/*` requests to the backend. Frontend code
must not hardcode a backend port.

## Current status

- Public MevrelBank website and auth pages are complete.
- Customer banking data is backed by Neon PostgreSQL.
- Internal ledger transfers and beneficiary payments are implemented; they do
  not connect to an external bank rail.
- Cookie-based customer and admin sessions are implemented.
- The `/admin/*` panel is restricted to the support admin account and supports
  customer management, account/transaction review, settings, and mailbox
  operations.

## Run commands

```text
cd mevrelbank/backend && node server.js
cd "mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0" && npx vite --port 5173 --host 0.0.0.0
```

## User preferences

None recorded.