---
name: MevrelBank mock auth pattern
description: How the client-side-only (localStorage) auth flow is faked in the MevrelBank frontend, since there is no backend yet.
---

There is no backend for the MevrelBank frontend (nested under `mevrelbank/design-systems/agents/figma/Figma Design System For Banking Ecosystem v0.1.0/`). Auth is entirely simulated client-side via `src/app/context/AuthContext.tsx`, persisted to three localStorage keys: registered users, the active session, and a single "pending" in-progress flow.

The "pending" flow record has a `stage` field (`"verify-email"` or `"mfa"`) so one record can represent either post-register email verification or post-login MFA — both flows share the same OTP-entry UI pattern.

**Why:** `login()` always transitions to an MFA-required pending state (never skips MFA) to match the existing UI, which was already built expecting login → MFA → dashboard. `register()` always requires email verification before the account is usable.

**How to apply:** if a backend auth API is added later, replace `AuthContext`'s internal localStorage read/writes with real API calls but keep the same external interface (`user`, `isAuthenticated`, `isMfaRequired`, `tempUser`, `login/register/verifyOTP/verifyMFA/logout`) so `ProtectedRoute`, `PublicOnlyRoute`, and the auth pages don't need to change. Passwords are stored in plain text in localStorage — acceptable only because this is a UI-only preview, must not ship to any real backend as-is.
