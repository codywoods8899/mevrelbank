---
name: MevrelBank account numbers
description: Why customer account numbers were always masked, and where full numbers are now generated.
---

**Account numbers used to be generated already-masked.** `accounts.account_number` (VARCHAR(20)) was populated with a literal `•••• 1234`-style string at creation time (in both `auth.js` `seedNewCustomer` on email verification and `banking.js` `POST /accounts`) — a real full number was never generated, so customers could never see their own full account number no matter what the frontend did.

**Fix applied:** `mevrelbank/backend/src/lib/accountNumber.js` now generates a real unique 8-digit number (checked against the DB for collisions) and both call sites use it. Existing masked rows were backfilled with real numbers, and a `UNIQUE INDEX idx_accounts_account_number` was added (also in `schema.sql` for fresh installs). Frontend already passed the API's `accountNumber` through untouched — no frontend change was needed.

**How to apply:** if account-number display issues resurface, check the generation site first, not the frontend — the frontend has never truncated or masked this field.
