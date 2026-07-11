---
name: MevrelBank repo layout
description: Where the real MevrelBank frontend app lives inside the repo, since the top-level folders are misleading.
---

The repo root (`github.com/codywoods8899/mevrelbank`) contains two independent projects, both documented in `replit.md`:

- `aicg/` — a Node/Express gateway app, unrelated to MevrelBank branding/UI.
- `mevrelbank/` — brand assets, design-system docs, and roadmap files at the top level, but **no runnable app code there**.

The actual runnable MevrelBank frontend (Vite + React + TS + Tailwind + react-router, with its own `package.json`/`node_modules`) lives nested at:

`mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/`

**Why:** the nesting is easy to miss — a request to "work on MevrelBank" can look like it has no matching code if you only check the top-level `mevrelbank/` folder.

**How to apply:** always `cd` into that nested directory before running `vite`, `npm`, or build commands for this app — commands run from the repo root or from `mevrelbank/` will fail or silently affect the wrong project. A workflow named `MevrelBank Dev (verify)` already runs `npx vite --port 5173 --host 0.0.0.0` from inside this nested directory.

Key structure inside that nested app:
- `src/main.tsx` — router setup (`createBrowserRouter`), wraps the app in providers.
- `src/app/App.tsx` — a large design-system demo/preview page routed at `/ds`; not the real customer-facing site.
- `src/app/website/pages/` — the real public site + auth pages (Login/Register/VerifyEmail/MFA/Dashboard/etc.), barrel-exported via `pages/index.tsx`.
- `src/app/website/components/` — shared, reusable UI extracted for both the `/ds` demo and the real pages (e.g. `BankingPortalView`).
- `src/app/website/shared/` — small shared primitives (`Btn`, `Logo`, etc.) used across both the demo and real pages.
- `src/app/context/` — React context providers (e.g. `AuthContext`).

No `tsconfig.json` exists in this nested project, so `vite build` does not run a separate type-check step — a successful `vite build` (esbuild transform) does not guarantee full TypeScript soundness. Read files carefully instead of relying on the build to catch type errors.
