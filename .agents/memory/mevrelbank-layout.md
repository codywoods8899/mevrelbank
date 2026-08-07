---
name: MevrelBank repo layout
description: Where the real MevrelBank frontend lives and the current governance doc set.
---

The real MevrelBank frontend is nested deep under
`mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/`
(Vite+React+TS+Tailwind, own `package.json`/`node_modules`, no `tsconfig.json` so `vite build` does not type-check).

The retired AICG gateway is preserved only in `archives/aicg-retired-2026-08-07.zip`; it is not an active project,
workflow, deployment command, or source directory.

**Governance:** `.github/copilot-instructions.md` mandates every session touching code append an entry to
`docs/session-log.md` (strict index + detail-block format), update `mevrelbank/roadmap.md` checkboxes when phase
items complete, update `replit.md` status bullets, and add a dated changelog entry to the nested app's own
`README.md`. Read that file before doing any MevrelBank work spanning more than a trivial fix.

**Why:** the doc set was authored for a GitHub Copilot Agent / PR-based workflow; this environment doesn't create PRs,
so log entries use `Branch: (current)` and `PR: —` instead.
