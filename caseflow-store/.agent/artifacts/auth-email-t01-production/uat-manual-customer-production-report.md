# UAT-MANUAL-T01 Production Customer Order Test

- Generated at: 2026-07-21T15:52:19.132Z
- Base URL: https://caseflow-store.vercel.app
- Result: PASS

## Customer Account

- Email: `truongskull014+caseflow-uat-202607211550@gmail.com`
- Name: CaseFlow UAT Customer
- Password: not stored in repository artifacts.

## Order

- Order code: `CF-MRUU092P-A54D8D8BB5`
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

- `.agent/artifacts/auth-email-t01-production/01-account-created.png`
- `.agent/artifacts/auth-email-t01-production/02-profile-complete.png`
- `.agent/artifacts/auth-email-t01-production/03-book-added-to-cart.png`
- `.agent/artifacts/auth-email-t01-production/03b-checkout-review-before-submit.png`
- `.agent/artifacts/auth-email-t01-production/04-checkout-success.png`
- `.agent/artifacts/auth-email-t01-production/05-qr-boundary-orders-redirect.png`
- `.agent/artifacts/auth-email-t01-production/06-order-history.png`
