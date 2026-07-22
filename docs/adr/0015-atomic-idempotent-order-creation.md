# ADR-0015: Atomic And Idempotent Order Creation

- Status: Accepted
- Date: 2026-07-22
- Planning task: `ORDER-RELIABILITY-T01`

## Context

CaseFlow Books validates prices, stock, promotions, account vouchers, and
checkout identity on the server. The remaining reliability gap is transaction
scope: the current workflow creates an order through one PostgreSQL RPC and
marks a reserved signup voucher as used through a later database request.

If the order commit succeeds but voucher confirmation or the HTTP response
fails, the customer can receive an error even though the order exists. A retry
can then create a second order or leave the original discount disconnected
from voucher redemption. Client-side disabled buttons reduce accidental double
clicks, but they are not a correctness boundary.

## Decision

Keep the existing Next.js modular monolith and layered architecture. Harden the
checkout write boundary with two controls:

1. Each browser checkout attempt sends a UUID `checkoutAttemptId`. The same
   identifier is reused for retries until the attempt succeeds.
2. A new additive PostgreSQL RPC creates the order and order items, consumes an
   optional eligible signup voucher, and returns an existing order for a
   repeated customer/attempt pair in one transaction.

The database remains the final concurrency boundary. The browser identifier is
not trusted for price, stock, customer identity, promotion eligibility, or
totals.

## Data And API Boundary

- Add nullable `orders.checkout_attempt_id uuid` for backward compatibility.
- Add a partial unique index on `(customer_id, checkout_attempt_id)` when the
  attempt ID is present.
- Add a versioned RPC instead of removing the released RPC, so database and app
  deployment can be rolled forward without a zero-downtime compatibility gap.
- Add `checkoutAttemptId` to the internal checkout request DTO.
- Preserve the public API response envelope and existing error codes.
- Remove the pre-order voucher reservation write from this workflow; the RPC
  conditionally consumes the eligible customer voucher under the same
  transaction as the order.

## Transaction Rules

- Repeated attempts by the same customer return the original order and items.
- The RPC recalculates the subtotal from active catalog rows.
- Voucher redemption must match customer, code, expiry, and unused state.
- Order, items, and voucher redemption commit together or roll back together.
- A voucher-free order follows the same idempotent order path.

## Alternatives Considered

### Rely On The Disabled Submit Button

Rejected. UI state cannot protect against network retries, two tabs, delayed
responses, or direct API calls.

### Keep Voucher Confirmation As A Second Request

Rejected. Compensation cannot reliably undo an order that was already
committed, and returning an error after a successful commit invites duplicate
orders.

### Rewrite All Checkout Persistence

Rejected. A versioned additive RPC fixes the transaction boundary without a
framework change, broad schema rewrite, or public feature expansion.

## Consequences

Positive:

- Checkout retries become deterministic.
- Voucher redemption and discounted order creation cannot diverge.
- Double-click and transient response failures cannot create duplicate orders
  for one checkout attempt.
- The behavior is testable at repository, API, and browser levels.

Negative:

- The checkout request gains one internal UUID field.
- The database temporarily retains the previous RPC for deployment
  compatibility.
- A future cleanup migration may remove the previous RPC only after all
  deployed runtimes no longer call it.

## Guardrails

- No price, tax, fee, stock, promotion, payment, shipping, or role decision is
  moved to the browser.
- No destructive migration or existing-order rewrite.
- No real payment integration.
- No change to the stable API response envelope.
- Production migration, deployment, and release happen only after local gates
  and migration verification pass.
