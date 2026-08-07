-- MevrelBank Phase 2 — Auth Schema
-- Run via: node src/db/migrate.js

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  account_type  VARCHAR(20) NOT NULL CHECK (account_type IN ('personal', 'business')),
  email_verified BOOLEAN DEFAULT FALSE,
  totp_enabled  BOOLEAN DEFAULT FALSE,
  totp_secret   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  code       VARCHAR(6) NOT NULL,
  type       VARCHAR(30) NOT NULL CHECK (type IN ('email_verification', 'password_reset', 'mfa_email')),
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_type ON otp_codes(user_id, type);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- MevrelBank Phase 3 — Banking Schema
-- Mirrors the shapes currently mocked in the dashboard frontend
-- (mockBankingData.ts) so real data can later replace the mock arrays.

CREATE TABLE IF NOT EXISTS accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  type           VARCHAR(30) NOT NULL CHECK (type IN ('Current Account', 'Savings Account')),
  sort_code      VARCHAR(8) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  balance        NUMERIC(14,2) NOT NULL DEFAULT 0,
  available      NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number);

CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(50) NOT NULL,
  amount      NUMERIC(14,2) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS statements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  period       VARCHAR(30) NOT NULL,
  file_url     TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  nickname       VARCHAR(100),
  sort_code      VARCHAR(8) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  last_paid_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  body       TEXT NOT NULL,
  kind       VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (kind IN ('security', 'payment', 'info')),
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 7 — Actionable notifications
-- entity_type: routing vocabulary owned by the backend (never parsed from text).
-- entity_id:   UUID of the referenced entity (transaction, account, etc.).
-- metadata:    JSONB bag for future extensibility; not used for routing decisions.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type VARCHAR(30);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id   UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata    JSONB;

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred ON transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_statements_account ON statements(account_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON beneficiaries(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Phase 3.5 — Profile details + internal ledger transfers
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- Admin panel + session/remember-me support
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS remember BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE statements ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(14,2);
ALTER TABLE statements ADD COLUMN IF NOT EXISTS closing_balance NUMERIC(14,2);

-- Unique guard so the statement generator never double-generates a period
CREATE UNIQUE INDEX IF NOT EXISTS idx_statements_account_period ON statements(account_id, period);

-- Phase 4 — Pending transaction workflow
-- initiated_by: 'user' (pending until admin confirms) | 'admin' (posted immediately)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS initiated_by VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (initiated_by IN ('user', 'admin'));
-- metadata: JSONB bag used for pending flows (toAccountId, toAccountName, beneficiaryId, etc.)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_initiated_by ON transactions(initiated_by);

-- Phase 5 — Site-wide settings (key/value), admin-editable
CREATE TABLE IF NOT EXISTS site_settings (
  key        VARCHAR(50) PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value)
VALUES ('whatsapp_number', '')
ON CONFLICT (key) DO NOTHING;

-- Phase 6 — US-standard identifiers: replace UK-style "sort code" (6 digits,
-- XX-XX-XX) with a 9-digit ABA routing number, matching how US banks
-- actually identify themselves. Renames + widens the column on both tables
-- that carry it; safe to re-run.
DO $mig$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'sort_code'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN sort_code TO routing_number;
  END IF;
END $mig$;

DO $mig$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beneficiaries' AND column_name = 'sort_code'
  ) THEN
    ALTER TABLE beneficiaries RENAME COLUMN sort_code TO routing_number;
  END IF;
END $mig$;

ALTER TABLE accounts ALTER COLUMN routing_number TYPE VARCHAR(9);
ALTER TABLE beneficiaries ALTER COLUMN routing_number TYPE VARCHAR(9);

-- Existing demo data had 6-digit UK-style sort codes; backfill to the bank's
-- fixed 9-digit ABA routing number so old rows don't fail validation.
UPDATE accounts SET routing_number = '071001245' WHERE length(routing_number) <> 9;
UPDATE beneficiaries SET routing_number = '071001245' WHERE length(routing_number) <> 9;

-- Widen account numbers from 8 to 10-12 digits (US convention); existing
-- 8-digit demo numbers are left as-is (still valid, just on the short end).
ALTER TABLE accounts ALTER COLUMN account_number TYPE VARCHAR(20);
ALTER TABLE beneficiaries ALTER COLUMN account_number TYPE VARCHAR(20);

-- Phase 8 — Admin Data Management
-- Transaction types distinguish ordinary customer transactions from admin
-- adjustments, reversals, and void-reversals. Explicit FK columns (reversal_of /
-- reversed_by) create a first-class audit chain without relying on metadata text.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tx_type VARCHAR(20) NOT NULL DEFAULT 'transaction'
  CHECK (tx_type IN ('transaction', 'adjustment', 'reversal', 'void_reversal'));

-- Mandatory internal reason field for all admin-originated adjustment / void entries.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS admin_reason TEXT;

-- Self-referential reversal links — set to NULL if the linked transaction is ever removed.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reversal_of UUID REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reversed_by UUID REFERENCES transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_tx_type    ON transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_transactions_reversal_of ON transactions(reversal_of);

-- Account lifecycle: soft-close replaces hard deletion; history is always retained.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS status       VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'closed'));
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS closed_at    TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS close_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

-- Customer archival: replaces permanent deletion.
-- archived_at being non-NULL means the customer has been archived.
-- is_active is also set to FALSE and all sessions are revoked at archive time.
ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_at    TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS archive_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_users_archived_at ON users(archived_at);

-- Phase 9 — Admin identity tracking + description-edit audit log
-- Store which administrator performed each admin-originated financial action.
-- ON DELETE SET NULL preserves history even if the admin account is ever removed.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE accounts    ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users       ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_admin_id ON transactions(admin_id);

-- Append-only audit log for transaction description/category edits.
-- One row per PATCH /transactions/:id/description call.
CREATE TABLE IF NOT EXISTS transaction_edits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  admin_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  old_name       TEXT NOT NULL,
  new_name       TEXT NOT NULL,
  old_category   TEXT,
  new_category   TEXT,
  reason         TEXT NOT NULL,
  edited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_edits_tx ON transaction_edits(transaction_id);
