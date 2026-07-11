
  # Design System for Banking Ecosystem

  This is a code bundle for Design System for Banking Ecosystem. The original project is available at https://www.figma.com/design/jD8gFP3THkjr4wCfwKyotX/Design-System-for-Banking-Ecosystem.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Cloudflare D1 waitlist storage

  This site supports persisting waitlist submissions with Cloudflare D1 through Cloudflare Pages Functions.

  ### 1) Create and bind the D1 database

  ```bash
  npx wrangler d1 create mevrelbank-db
  ```

  Copy the returned `database_id` and set it in `wrangler.toml` (`database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"`).

  In Cloudflare Pages project settings, add a D1 binding:
  - Binding name: `DB`
  - Database: `mevrelbank-db`

  ### 2) Apply migration

  From this folder, run:

  ```bash
  npx wrangler d1 execute mevrelbank-db --file=migrations/0001_waitlist.sql
  ```

  ### 3) API endpoint

  Waitlist submissions are handled by Pages Functions at:
  - `POST /api/waitlist`

  The endpoint validates and stores:
  - `name`
  - `email`
  - `accountType` (`personal` or `business`)
  - `message` (optional)

  ### 4) Frontend behavior

  `/waitlist` submits directly to `/api/waitlist` and shows inline success/error states in the existing UI.
  
  ## Changelog

  ### 2026-07-08 — Copilot Coding Agent — Initial website scaffold (S-03)
  React Router v7 added; `/` → HomePage, `/ds` → design system demo; brand PNGs wired.

  ### 2026-07-09 — Copilot Coding Agent — Phase 1 inner pages (S-05)
  7 routed inner pages added (About, Products, Contact, FAQs, Security, Careers, Blog). Shared `PageShell` component.

  ### 2026-07-09 — Copilot Coding Agent — Homepage sections + integrity pass (S-04, S-06)
  `CoreSections.tsx` and `BusinessModel.tsx` added. Unverifiable regulatory claims removed. All nav links resolve.

  ### 2026-07-10 — Copilot Coding Agent — Phase 1 close-out: waitlist + SEO (S-08)
  `/waitlist` route added with `WaitlistPage.tsx` (mailto flow). `PageMeta` component adds per-route SEO.

  ### 2026-07-10 — Copilot Coding Agent — Phase 2 auth pages (S-09)
  `AuthShell` + 6 auth routes scaffolded: `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/mfa`.

  ### 2026-07-10 — Copilot Coding Agent — Cloudflare D1 waitlist backend (S-10)
  `wrangler.toml`, `migrations/0001_waitlist.sql`, and `functions/api/waitlist.ts` added. `/waitlist` now submits to `POST /api/waitlist` stored in D1.

  ### 2026-07-11 — Replit Agent — Phase 2 auth wiring + dashboard (S-12)
  Added `AuthContext` (localStorage-backed mock auth: register/login/verifyOTP/verifyMFA/logout) and `ProtectedRoute`/`PublicOnlyRoute` guards. `LoginPage`, `RegisterPage`, `VerifyEmailPage`, `MFAPage` now call real context methods instead of mock timeouts. Extracted `BankingPortalView` out of the `/ds` design-system demo into a shared component and added a real, protected `/dashboard` route (`DashboardPage`) using it. No backend yet — see `mevrelbank/roadmap.md` Phase 2 backend items.

  ### 2026-07-11 — Replit Agent — Phase 3 customer banking scaffold (S-13)
  Split the dashboard UI into a reusable `DashboardShell` (sidebar/top bar, real `NavLink` routing) + `DashboardOverview` (dashboard home content), replacing the old combined `BankingPortalView`. Added a `DashboardLayout` layout route and six new protected pages sharing that shell: `AccountsPage`, `TransactionsPage`, `StatementsPage`, `BeneficiariesPage`, `ProfilePage`, `NotificationsPage`, all under `/dashboard/*`. All content is mock data (`shared/mockBankingData.ts`); no action that would move money or edit account state is wired to a real backend yet.
