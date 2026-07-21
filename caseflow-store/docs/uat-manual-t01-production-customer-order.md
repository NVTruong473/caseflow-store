# UAT-MANUAL-T01 Production Customer Order Test

- Date: 2026-07-21
- Production URL: `https://caseflow-store.vercel.app`
- Result: partial pass with one open finding
- Artifact: `.agent/artifacts/uat-manual-t01-v110-production`

## Scope

This UAT exercised the production website as a customer:

- self-service sign-up attempt
- customer sign-in
- account welcome vouchers
- profile completion
- product detail add-to-cart
- checkout with one account-bound voucher
- bank-transfer order creation
- QR/payment production boundary
- customer order history

No real payment, real bank transfer, real delivery, production deploy, schema
change, release tag, or release metadata change was performed.

## Test Account

- Email: `caseflow-uat-manual-mrulxe4i-asgjx2@example.com`
- Name: CaseFlow UAT Customer
- Password: not stored in repository artifacts.

The account was provisioned as a production UAT customer after self-service
sign-up returned a Supabase rate-limit response. It is intentionally left in
production so the user can sign in and inspect the order history.

## Order Created

- Order code: `CF-MRULYDA5-0834135AE0`
- Book: `A Christmas Carol`
- Edition slug: `a-christmas-carol-english-paperback`
- Payment method: `bank-transfer`
- Payment status: `awaiting-transfer`
- Order status: `pending`
- Promotion code: `WELCOME30K`
- Discount: `30000` VND
- Total: `166900` VND

## Result Summary

| Check | Result |
|---|---|
| Account ready for UAT | PASS |
| Self-service sign-up through production UI | FAIL/BLOCKED, Supabase returned `429 CUSTOMER_AUTH_FAILED` |
| Customer sign-in | PASS |
| 3 welcome vouchers visible | PASS |
| Customer profile completed | PASS |
| Product added to cart | PASS |
| Checkout applied exactly one account voucher | PASS |
| Order created | PASS |
| Server persisted trusted totals and discount | PASS |
| Production QR UI locked | PASS |
| Production payment/simulate API locked | PASS |
| Customer order history shows the order | PASS |
| No horizontal overflow in checked surfaces | PASS |

## Payment Boundary

Production is configured to lock QR demo payments by design:

- QR methods `momo` and `vnpay` are hidden on production checkout.
- `/checkout/payment?orderCode=...&provider=DEMO_VIETQR` redirects to
  `/account/orders`.
- `POST /api/payments` returned `403 PAYMENT_DISABLED`.
- `POST /api/dev/payments/:id/simulate-success` returned
  `404 PAYMENT_DISABLED`.

This is the expected production-safe behavior. QR success simulation remains a
local/development workflow, not a production customer workflow.

## Evidence

- `.agent/artifacts/uat-manual-t01-v110-production/uat-manual-customer-production-check.json`
- `.agent/artifacts/uat-manual-t01-v110-production/uat-manual-customer-production-report.md`
- `.agent/artifacts/uat-manual-t01-v110-production/01-account-created.png`
- `.agent/artifacts/uat-manual-t01-v110-production/02-profile-complete.png`
- `.agent/artifacts/uat-manual-t01-v110-production/03-book-added-to-cart.png`
- `.agent/artifacts/uat-manual-t01-v110-production/03b-checkout-review-before-submit.png`
- `.agent/artifacts/uat-manual-t01-v110-production/04-checkout-success.png`
- `.agent/artifacts/uat-manual-t01-v110-production/05-qr-boundary-orders-redirect.png`
- `.agent/artifacts/uat-manual-t01-v110-production/06-order-history.png`

## Verification Commands

- `UAT_MANUAL_BASE_URL=https://caseflow-store.vercel.app UAT_MANUAL_ARTIFACT_ID=uat-manual-t01-v110-production npm exec -- tsx scripts/verify-uat-manual-customer-production.ts`: completed with expected non-zero exit because `selfServiceSignupSucceeded` was false; all post-provision customer commerce checks passed.
- `npm exec -- tsc --noEmit --pretty false`: PASS.
- `npm run lint`: PASS.
- `npm audit --audit-level=high`: PASS at high threshold; the known moderate
  PostCSS/Next advisory remains.
- `git diff --check`: PASS.

## Open Finding

`UAT-MANUAL-F01`: production self-service sign-up returned
`429 CUSTOMER_AUTH_FAILED` with the message `Customer sign-up is temporarily
rate-limited. Try again later.`

This is not a checkout, voucher, order-history, or payment-boundary defect, but
it blocks repeated UAT sign-up attempts from the same testing environment. The
next investigation should check Supabase Auth rate-limit settings, email
confirmation settings, and whether the test environment has triggered an Auth
anti-abuse threshold.
