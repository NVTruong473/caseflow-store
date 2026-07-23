# UAT-MANUAL-T02 - Production Customer Notification And Simulated Transfer Walkthrough

## Scope

- Date: 2026-07-23
- Release under test: `v1.13.0`
- Production URL: `https://caseflow-store.vercel.app`
- Role: authenticated `customer`
- Test account: `CaseFlow UAT Customer`
- Payment method: simulated bank transfer
- Real payment, real bank details, email delivery, and SMS delivery: not used

## Test Order

- Order code: `CF-MRXNH8NZ-71D438191D`
- Item: `A Christmas Carol`
- Quantity: `1`
- Item total: `159.000 VND`
- Shipping: `25.000 VND`
- Estimated VAT: `15.900 VND`
- Payment fee: `0 VND`
- Server-calculated order total: `199.900 VND`
- Initial order status: `pending`
- Initial payment status: `awaiting-transfer`
- Final order status: `cancelled`
- Final payment status: `cancelled`

## Manual Acceptance Results

| Check | Result | Evidence |
| --- | --- | --- |
| Existing confirmed customer session and complete checkout profile | PASS | Checkout populated the UAT account contact and delivery profile |
| Add an in-stock edition to cart | PASS | Cart changed from `0` to `1` |
| Server-calculated checkout summary | PASS | `159.000 + 25.000 + 15.900 = 199.900 VND` |
| Select simulated bank transfer | PASS | Checkout selected `bank-transfer` and retained the server total |
| Create order once | PASS | One order code was returned and the cart was cleared |
| Separate order and payment states | PASS | Order `pending`; payment `awaiting-transfer` |
| No real bank account, QR, or payment deep link exposed | PASS | Customer surfaces contained no QR image or real transfer destination |
| No customer self-confirm/simulate control in Production | PASS | Customer history exposed only the eligible cancel action |
| In-app order-created notification | PASS | `Don hang da duoc tiep nhan` |
| In-app transfer-pending notification | PASS | `Dang cho xac nhan chuyen khoan` |
| Mark all notifications as read | PASS | Unread count and action disappeared after the request completed |
| Account order history without manual order-code entry | PASS | New order appeared first in `/account/orders` |
| Customer cancellation | PASS | Order and payment both changed to `cancelled` |
| Cancellation notifications | PASS | Order-cancelled and payment-not-accepted events appeared |
| Duplicate cancellation prevention | PASS | No eligible cancel button remained after cancellation |
| Anonymous operations/API boundary | PASS | Production safety verifier returned `401 UNAUTHORIZED` for all `8/8` protected routes |
| Production storefront smoke | PASS | Production smoke passed `9/9` |
| Notification contract verification | PASS | Contract verifier completed with zero failures |

## Visual Evidence

- `.agent/artifacts/uat-manual-t02/01-order-success.png`
- `.agent/artifacts/uat-manual-t02/02-account-notifications.png`
- `.agent/artifacts/uat-manual-t02/03-order-history-pending-transfer.png`
- `.agent/artifacts/uat-manual-t02/04-order-history-cancelled.png`

## Machine-Readable Evidence

- `.agent/artifacts/uat-manual-t02-production-smoke/production-smoke-check.json`
- `.agent/artifacts/uat-manual-t02-notification-safety/notification-production-safety-check.json`

## Findings

### Low - Success heading overstates the order lifecycle

The checkout success heading says `Don hang da duoc xac nhan` / `Order confirmed`
while the same page correctly reports the order status as `pending`. Persistence,
payment state, permissions, and subsequent notifications are correct, so this
does not block the UAT. The copy should be changed to `Don hang da duoc ghi nhan`
/ `Order received` in a separately scoped patch and then reverified on Production.

Resolution status: fixed locally by `COPYFIX-T01` on 2026-07-23. The focused
bilingual browser regression and full local `24/24` Playwright suite passed.
Production confirmation remains part of the patch release gate.

### Informational - External notification providers remain disabled

Production intentionally has no live email/SMS provider configuration. In-app
notifications are the authoritative customer channel for this release. The UAT
does not claim that an email or SMS was sent.

## Decision

`UAT-MANUAL-T02` passes with one non-blocking copy finding. The transactional
workflow, customer authorization boundary, in-app notifications, history, and
cancellation behavior are accepted for `v1.13.0`.
