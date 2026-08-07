---
name: MevrelBank backend architecture
description: Phase 2 backend service — ports, structure, auth flow, email, and key decisions
---

# MevrelBank Backend — Phase 2

## Location
`mevrelbank/backend/` — CommonJS Node.js/Express, runs as `MevrelBank Backend` workflow.

## Port
- **Replit dev**: port 3001 (Replit only allows specific ports; 4000 is not available)
- Vite frontend proxies `/api/*` → `http://localhost:3001`
- Frontend always uses relative `/api/...` paths — never hardcoded port

## Auth Flow
1. `POST /api/auth/register` → creates user, sends 6-digit OTP via Resend
2. `POST /api/auth/verify-email` → confirms OTP, marks email verified
3. `POST /api/auth/login` → if TOTP enabled returns `{ mfaRequired: true, tempToken }`; otherwise returns access+refresh tokens directly
4. `POST /api/mfa/verify` → exchanges tempToken + TOTP code for session tokens
5. `POST /api/auth/refresh` → rotates refresh token, returns new access token
6. `POST /api/auth/logout` → revokes refresh token in DB

## Token storage (frontend)
- Access token: React memory only (never localStorage)
- Refresh token: `localStorage` under key `mb.refreshToken`
- Pending email (during verify flow): `sessionStorage` under key `mb.pendingEmail`

## Email
- All transactional email via Resend SDK, `FROM = noreply@mevrelbank.com`
- Email types: verification OTP, password reset OTP (30min), login alert, MFA email fallback

## TOTP MFA
- Optional — users without TOTP enabled skip the MFA step after login
- Setup in `/dashboard/profile` via `GET /api/mfa/setup` + `POST /api/mfa/enable`
- SMS fallback sends email OTP instead (no Twilio in Phase 2)

## Rate limiting
- Auth endpoints: 20 req per 15 min per IP
- OTP resend: 3 req per minute per IP

**Why 3001 not 4000:** Replit only allows specific port numbers for workflow `waitForPort`. 4000 is not in the allowlist.
