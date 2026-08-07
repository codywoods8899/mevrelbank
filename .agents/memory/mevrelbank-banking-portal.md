---
name: MevrelBank banking portal structure
description: Where the banking app source lives, routing pattern, and Phase 1.5 scope.
---

## Rule
All MevrelBank source code lives inside `mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/src/`. Banking portal pages are under `src/app/banking/`. Routes are defined in `src/main.tsx`.

**Why:** The project was imported from Figma and the Figma export created that deep directory. All prior sessions committed code there; do not create a parallel src tree.

## How to apply
- New banking pages go in `src/app/banking/pages/`
- New banking shared components go in `src/app/banking/components/`
- Update the barrel `src/app/banking/pages/index.tsx` and `src/main.tsx` for every new route
- Build: `cd "mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0" && npx vite build`

## Phase 1.5 scope (complete)
- AppShell (sidebar + header + Outlet), ProtectedRoute (placeholder), Dashboard, Accounts, Transactions, Transfers, Statements, Settings
- ProtectedRoute always passes in Phase 1.5 — wire to real JWT auth in Phase 2
- All data is static mock — replace with API calls in Phase 3

## Documentation rules (from .github/copilot-instructions.md)
- Every session must append to `docs/session-log.md` (S-NN format, most-recent first)
- Update `mevrelbank/roadmap.md` when phase items complete
- Update `replit.md` when project status changes
