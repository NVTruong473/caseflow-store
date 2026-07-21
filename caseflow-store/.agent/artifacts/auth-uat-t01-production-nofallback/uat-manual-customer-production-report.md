# UAT-MANUAL-T01 Production Customer Order Test

- Generated at: 2026-07-21T15:17:25.890Z
- Base URL: https://caseflow-store.vercel.app
- Result: PASS

## Customer Account

- Email: `caseflow-uat-manual-mruspqcg-xk4bg9@gmail.com`
- Name: CaseFlow UAT Customer
- Password: not stored in repository artifacts.

## Order

- Order code: `CF-MRUSRE2K-007B2B5B07`
- Book: A Christmas Carol (`a-christmas-carol-english-paperback`)
- Payment method: bank-transfer
- Payment status: awaiting-transfer
- Order status: pending
- Promotion: WELCOME30K
- Discount: 30000 VND
- Total: 166900 VND

## Voucher Codes Seen

- `WELCOME30K`
- `READMORE20K`
- `FREESHIP25K`

## QR And Payment Boundary

- Checkout QR methods hidden in production: expected.
- `/checkout/payment` redirects to account orders: yes
- `POST /api/payments`: 403 PAYMENT_DISABLED
- `POST /api/dev/payments/:id/simulate-success`: 404 PAYMENT_DISABLED

## Checks

| Check | Result |
|---|---|
| accountReadyForUat | PASS |
| selfServiceSignupSucceeded | PASS |
| signedInAsCustomer | PASS |
| vouchersGranted | PASS |
| profileCompleted | PASS |
| productAddedToCart | PASS |
| checkoutAppliedOneVoucher | PASS |
| orderCreated | PASS |
| orderUsesServerPersistedTotals | PASS |
| productionQrUiLocked | PASS |
| productionPaymentApiLocked | PASS |
| orderHistoryShowsOrder | PASS |
| noHorizontalOverflow | PASS |

## Screenshots

- `.agent/artifacts/auth-uat-t01-production-nofallback/01-account-created.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/02-profile-complete.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/03-book-added-to-cart.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/03b-checkout-review-before-submit.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/04-checkout-success.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/05-qr-boundary-orders-redirect.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/06-order-history.png`
