---
name: MevrelBank payments and statement generation
description: Why MevrelBank's transfers/payments are ledger-only and how statements get generated without a cron.
---

**Internal transfers and beneficiary payments are real ledger operations, not real money movement.** `POST /api/banking/transfer` (own accounts) and `POST /api/banking/pay` (saved beneficiary) atomically update `accounts.balance/available` and write real `transactions` rows in Neon, but MevrelBank has no licensed Banking-as-a-Service/payment-rail partner connected — nothing ever reaches an external bank.

**Why:** connecting a real settlement rail (Faster Payments/BACS) requires selecting and contracting a licensed BaaS provider — a business/legal/compliance decision no agent should make unattended. Building a self-consistent internal ledger was the honest, non-deceptive middle ground given the app already had no real money anywhere.

**How to apply:** don't present "Pay" or "Transfer" as reaching a real external account in UI copy or docs. When real settlement is eventually wanted, that's a human-initiated Phase 4 decision (provider selection) — treat it as blocked on the user, not as an autonomous next step.

**Statement generation has no cron in this environment.** Statements for the previous calendar month are generated lazily inside `GET /api/banking/statements` (one row per account+period, PDF via `pdfkit`, served through an auth-protected file route) — "generated monthly" really means "generated the next time anyone asks after month-end." Account balances are a denormalized running total; statement opening/closing balances are derived by summing `transactions` up to a point in time, so keep every future balance-changing endpoint consistent with that invariant (always insert a matching transaction row alongside any balance change).
