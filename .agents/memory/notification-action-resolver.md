---
name: Notification Action Resolver
description: Architecture, routing vocabulary, and highlight mechanism for the actionable notification system (implemented 2026-07-15).
---

## Rule
Notification routing logic lives exclusively in `src/app/website/services/notificationActionResolver.ts`.
Never resolve destinations from notification text. Only use `(entityType, entityId)` from the backend.

**Why:** Text matching is brittle; the backend owns the routing vocabulary. A dedicated service layer keeps the API transport layer (bankingApi.ts) pure and gives a single place to update routing rules.

## Database columns added to `notifications`
```sql
entity_type  VARCHAR(30)   -- routing vocabulary; NULL = no destination
entity_id    UUID          -- UUID of the referenced entity; NULL ok
metadata     JSONB         -- future extensibility bag; not used for routing
```

## entity_type vocabulary (exhaustive as of this session)
| value          | destination page                        |
|----------------|-----------------------------------------|
| 'transaction'  | /dashboard/transactions?highlight=<id>  |
| 'account'      | /dashboard/accounts?highlight=<id>      |
| 'beneficiary'  | /dashboard/beneficiaries?highlight=<id> |
| 'statement'    | /dashboard/statements?highlight=<id>    |
| 'security'     | /dashboard/profile                      |
| null           | no navigation                           |

## Every notification creation site (all updated)
| Route | entity_type | entity_id source |
|---|---|---|
| auth.js: registration | null | — (welcome message) |
| banking.js POST /accounts | account | new account row id |
| banking.js POST /transfer | transaction | pending tx row id |
| banking.js POST /pay | transaction | pending tx row id |
| banking.js POST /beneficiaries | beneficiary | new beneficiary row id |
| admin.js POST /accounts/:id/credit | transaction | tx insert RETURNING id |
| admin.js POST /accounts/:id/debit | transaction | tx insert RETURNING id |
| admin.js POST /transfer (from) | transaction | from tx insert RETURNING id |
| admin.js POST /transfer (to, cross-user) | transaction | to tx insert RETURNING id |
| admin.js PATCH /transactions/:id/confirm | transaction | original tx.id |
| admin.js PATCH /transactions/:id/reject | transaction | original tx.id |

## Admin transfer tx insert — important
The admin transfer was previously a single multi-row `VALUES ($1…), ($4…)` INSERT.
It was split into two separate INSERTs (both with `RETURNING id`) so each can have its UUID captured for the notification.

## Row highlight mechanism
- CSS animation: `.row-highlight` keyframe in `animations.css` — blue wash + inset ring fades over 2 s.
- Elements must carry `data-entity-id="<uuid>"` on their outermost container.
- `applyRowHighlight(entityId)` in the resolver service: 150 ms delay → querySelector → scrollIntoView → add class → remove on animationend.
- Pages that support highlight: TransactionsPage, AccountsPage, BeneficiariesPage, StatementsPage.
- Each page reads `useSearchParams().get("highlight")` and calls `applyRowHighlight()` after its data fetch resolves.

## publicNotification() shape (banking.js)
Returns `{ id, title, body, kind, read, time, entityType, entityId, metadata }`.
Old notifications in DB get `entityType: null, entityId: null, metadata: null` — no action on click.

**How to apply:** When adding any new notification type: add an `entity_type`+`entity_id` to the INSERT, extend the switch in `resolveNotificationPath()` if a new entity_type is needed, add `data-entity-id` to the destination page's row element if it's a new page.
