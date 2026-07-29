# External Buyer UAT Charter - CaseFlow Books v1.18.2

## Purpose

This is the final no-coaching acceptance test for a person who has not worked
on CaseFlow Books. Automated release gates must pass before this charter is
used. The observer may record findings but must not explain where controls are
or how a flow is intended to work.

Independent execution status: **NOT RUN**.

## Test Setup

- Use the canonical Production URL in a private browser session.
- Test one desktop viewport at or above 1280 px and one physical phone or a
  375 px mobile viewport.
- Use a new customer email controlled by the tester.
- Do not reuse admin, staff, QA, or development credentials.
- Do not transfer real money or enter a banking password.
- Record the browser, device, viewport, language, start time, and finish time.
- Capture the URL and a screenshot for every failed expectation.

## Severity

| Level | Meaning | Release decision |
|---|---|---|
| P0 | Security breach, data exposure, incorrect trusted total, or cross-account access | Stop immediately |
| P1 | A primary customer or operator journey cannot be completed | Reject acceptance |
| P2 | Misleading copy, broken responsive layout, inaccessible control, or recoverable workflow defect | Fix before buyer handoff |
| P3 | Cosmetic issue with no material loss of clarity or control | Record for backlog |

## Customer Scenarios

### UAT-01 - Discovery Without Coaching

1. Open the homepage in Vietnamese.
2. Identify how to browse the catalog without assistance.
3. Search for a known title or author.
4. Apply language, category, price, and availability filters.
5. Open a result, inspect edition details, and compare editions.

Expected:

- The route to the catalog is obvious.
- Results, empty states, filter state, price, stock, language, format, and ISBN
  remain readable without clipped or overlapping text.
- Back navigation retains a comprehensible discovery state.

### UAT-02 - Cart Management

1. Add one edition to the cart.
2. Increase and decrease quantity.
3. Remove one line.
4. Add two different editions.
5. Clear the cart, add one edition again, and continue shopping.

Expected:

- Cart count and totals update immediately.
- Quantity cannot exceed stock or fall below one.
- Remove and clear actions are distinguishable.
- Continuing shopping does not lose the retained cart.

### UAT-03 - Account And Welcome Vouchers

1. Register or sign in with the tester-owned email.
2. Complete the customer profile.
3. Inspect available welcome vouchers.
4. Apply one voucher during checkout.
5. Attempt to combine more than one voucher.

Expected:

- Exactly three eligible signup vouchers are visible for a new account.
- Only one voucher can affect an order.
- Discount and final total are recalculated by the server.
- Authentication returns the customer to a useful storefront destination.

### UAT-04 - Cross-device QR Experience

1. Enter checkout with one retained cart item.
2. Select the experience mode and create a QR session.
3. Scan the QR with the phone.
4. Enter the exact total and an incorrect six-digit code.
5. Correct the code and submit again.
6. Return to the desktop and inspect account history.

Expected:

- Both devices clearly state that no real money is transferred.
- The phone receives no password, email, address, cart details, or customer PII.
- A wrong code clears, refocuses, shows the remaining attempts, and permits a
  corrected submission.
- Completion updates without a page reload.
- The session appears under a separate QR experience history, never as an
  official order or settled payment.
- The cart remains intact and offers a route to official checkout.

### UAT-05 - Official Order

1. Continue from the preserved cart to official checkout.
2. Select COD or the available official bank-transfer order method.
3. Review item, VAT, shipping, payment fee, voucher, and total.
4. Submit once, including one deliberate double-click attempt.
5. Open the success page and account order history.

Expected:

- One order is created with one stable order code.
- No duplicate order is created.
- The official cart is cleared only after successful cart checkout.
- Order and payment statuses are displayed separately.
- The order is visible to the owning customer and not to another account.

### UAT-06 - Order Self-service

1. Open the new order in account history.
2. Inspect its current status and line items.
3. Cancel it while it is still eligible.
4. Reload and inspect the status again.
5. Try public tracking with correct and incorrect contact data.

Expected:

- Cancellation requires confirmation and persists after reload.
- A cancelled order cannot be cancelled twice.
- Public tracking requires both order code and matching contact data.
- Private address, profile, or payment information is not exposed.

## Operator Scenarios

### UAT-07 - Role Boundaries

1. Open admin routes while signed out and as a customer.
2. Repeat with a staff account.
3. Repeat with an admin account.
4. Inspect dashboard, orders, catalog, inventory, promotions, and customers.

Expected:

- Anonymous and customer users cannot access operator data.
- Staff can perform only the operations allowed by the role matrix.
- Admin-only actions remain unavailable to staff at both UI and API levels.
- Rejected or cancelled orders do not count as pending revenue or paid orders.

## Cross-cutting Scenarios

### UAT-08 - Responsive, Keyboard, And Language

- Repeat homepage, catalog, product, cart, checkout, QR phone page, order
  history, and account screens at desktop and mobile widths.
- Navigate primary actions with Tab, Shift+Tab, Enter, Space, and Escape.
- Switch between Vietnamese and English on at least three routes.
- Test browser back, refresh, slow network, and one temporary API interruption.

Expected:

- No horizontal overflow, clipped text, overlap, focus loss, hydration error,
  severe console error, or untranslated primary action.
- Focus is visible and dialogs return focus to their trigger.
- Retryable failures explain what happened and permit recovery.

## Acceptance Record

Record each scenario as `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN`. Acceptance
requires:

- every scenario executed;
- zero P0, P1, and P2 findings;
- every test-created account, order, payment, and experience record removed;
- tester name and date recorded;
- unresolved P3 findings assigned to a backlog owner;
- no verbal coaching required to complete the primary journeys.

The website owner must not mark this independent gate as passed on the tester's
behalf.
