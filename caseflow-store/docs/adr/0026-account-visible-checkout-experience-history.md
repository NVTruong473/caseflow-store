# ADR-0026: Account-visible Checkout Experience History

- Status: Accepted
- Date: 2026-07-29
- Task: `EXPERIENCE-HISTORY-T01`
- Target: patch release after verification

## Context

The cross-device QR experience already persists an isolated, customer-owned
session under ADR-0021. It intentionally creates no order or payment and does
not consume stock, vouchers, or cart contents.

Customers currently cannot review completed experience sessions after leaving
checkout. This makes a successful practice flow look lost. The transfer form
also leaves an incorrect six-digit code in place after a failed attempt, which
makes recovery unclear on a phone.

Treating an experience session as an order would be misleading. Clearing the
cart after an experience would also remove the exact items the customer may
still want to order officially.

## Decision

1. Show recent customer-owned checkout experience sessions in a separate
   `QR experience history` section on the account order-history page.
2. Expose only a safe read model: session ID, transfer reference, amount,
   currency, status, and timestamps. Never expose capability tokens,
   confirmation codes or hashes, cart fingerprints, salts, or failed values.
3. Keep experience records visually and semantically separate from official
   orders. They are not payments, transactions, sales, or fulfillment records.
4. Preserve cart and Buy Now state after an experience. A completed desktop
   experience offers an explicit action to continue to official checkout.
5. After an invalid phone confirmation, keep the session pending until the
   existing five-attempt limit, clear the incorrect code, focus the code input,
   and allow another submission.

## Security And Commerce Boundary

- History is read only for the authenticated customer who owns each session.
- The service-role repository filters by `customer_id`; table RLS remains
  closed to browser roles.
- Experience completion still creates no order or payment and changes no
  stock, voucher, notification, sales, or admin metric.
- The official order flow remains the only flow that may clear a cart after a
  successful cart-based order.
- Expired pending sessions are rendered as expired without requiring a
  browser-controlled database update.

## Consequences

The account page becomes an honest activity history rather than pretending a
practice transfer is a purchase. Customers can verify that their practice was
recorded and then return to official checkout with the cart intact.

The experience history cannot list book titles because ADR-0021 deliberately
does not persist cart contents or product snapshots. Adding such snapshots
would require a separate data-minimization decision.

## Acceptance Criteria

- A completed experience appears in the owning customer's account history.
- Another customer cannot access that history through the repository or UI.
- The experience is labelled as non-payment and visually separated from
  official orders.
- Completing an experience does not create an order or payment and does not
  clear the cart.
- A wrong six-digit code can be corrected and resubmitted until the existing
  attempt limit is reached.
- Lint, TypeScript, Production build, focused Playwright, architecture, and
  Production-safety gates pass before release.
