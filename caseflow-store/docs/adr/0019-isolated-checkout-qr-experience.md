# ADR-0019: Isolate Official Checkout From The QR Experience

- Status: Accepted
- Date: 2026-07-27
- Planning task: `CHECKOUT-MODE-T01`

## Context

The released checkout intentionally hides QR demo payment creation and mock
success controls in Production. That boundary prevents a customer from using a
public simulation endpoint to mark a real stored order as paid.

The storefront still needs a visible way to demonstrate how a QR transfer
works. Re-enabling the persisted demo-payment APIs in Production would weaken
ADR-0010, while removing the experience entirely makes the payment capability
hard to evaluate.

## Decision

Split the signed-in checkout page into two explicit modes:

1. `Official checkout` / `Đặt hàng` preserves the existing profile, shipping,
   voucher, payment-method, order creation, inventory, and order-history flow.
2. `QR experience` / `Trải nghiệm QR` renders a self-contained training flow
   based on the current cart after `/api/cart/validate` has returned trusted
   catalog totals.

The experience mode:

- creates no order or persisted payment;
- calls neither `/api/orders` nor `/api/payments`;
- never invokes the development simulate-success endpoint;
- generates an internal `caseflow-experience://` QR payload that cannot open a
  banking or wallet application;
- uses the visibly non-real account number `0000000000`;
- changes only local component state from pending to completed;
- labels the result as an experience, not a settled transaction;
- resets on reload and has no effect on stock, vouchers, cart contents,
  customer history, notifications, or admin reporting.

The existing persisted `MOCK_GATEWAY` and `DEMO_VIETQR` providers remain
development-only under ADR-0010. This decision does not convert the experience
mode into a payment provider.

## Security Boundary

Production continues to reject the mock simulate-success endpoint. Client-side
state is acceptable only because the experience cannot update a business
record. Any future requirement to settle a stored order must use a real
provider, server-owned amount, signed webhook, idempotency, reconciliation, and
a separate security review.

## Consequences

Positive:

- visitors can evaluate the QR interaction without weakening Production;
- the official order flow remains clear and unchanged;
- the demonstration cannot create fake sales or paid orders;
- no new database, migration, secret, provider, or external dependency is
  required.

Negative:

- an experience completion is intentionally not visible in order history or
  admin analytics;
- the generated QR is not a bank-compatible VietQR settlement code;
- the experience resets when the page reloads.

## Acceptance Criteria

- Checkout exposes accessible official and experience tabs in both languages.
- Official checkout retains all existing fields and order behavior.
- Experience mode uses server-validated cart data and displays the calculated
  VND amount.
- QR generation, pending state, countdown, simulated completion, and reset
  work without page reload.
- No order, payment, stock, voucher, notification, or analytics mutation is
  performed by experience mode.
- Existing Production mock-payment locks remain unchanged and verified.
- Mobile and desktop layouts have no overflow or clipped QR content.
- Lint, TypeScript, build, focused Playwright, and production-safety checks
  pass.
