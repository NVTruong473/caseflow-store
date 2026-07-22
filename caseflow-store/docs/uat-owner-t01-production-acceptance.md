# UAT-OWNER-T01 - Production Customer And Operations Acceptance

Date: 2026-07-22

Production URL: `https://caseflow-store.vercel.app`

Result: PASS for the released `v1.12.1` product contract, with documented
commercial-operation limitations.

## Scope And Result

| Step | Result | Evidence |
|---|---:|---|
| Self-service customer registration | PASS | Production UI returned a successful account creation without service-role fallback. |
| Real mailbox confirmation | PASS | Supabase Auth delivered a fresh message to the tester-controlled Gmail alias; the clicked link redirected to `https://caseflow-store.vercel.app/account`, and the account became confirmed. |
| Three account-bound welcome vouchers | PASS | `WELCOME30K`, `READMORE20K`, and `FREESHIP25K` were granted with 30-day expiry. |
| Cart, profile, voucher, and checkout | PASS | One available edition was added; the complete customer profile was reused; exactly one voucher was applied. |
| Server-persisted order totals | PASS | Order `CF-MRWAT991-0266BA851D` stored a 30,000 VND discount and a final total of 166,900 VND. |
| Production QR/payment boundary | PASS | Production hid demo QR/wallet controls, rejected payment creation with `403 PAYMENT_DISABLED`, and rejected the mock settlement route. |
| Customer order history | PASS | The signed-in customer saw the order code, amount, method, order status, and payment status without a lookup code. |
| Customer cancellation | PASS | The customer cancelled the eligible order through the UI; database order, payment, and shipping states all became `cancelled`. |
| Voucher enforcement | PASS, 10/10 | Account ownership, one-code-per-order, reuse rejection, persisted discount, and responsive surfaces passed. |
| Role authorization | PASS | Anonymous and customer access were denied; staff order operations passed; admin-only settings remained admin-only. |
| Staff dashboard and inventory | PASS | Revenue, average order, payment/order summaries, top books, low-stock risks, recent orders, empty range, and CSV control rendered correctly. |
| Visual review | PASS | Customer, checkout, voucher, order history, staff, desktop dashboard, and mobile dashboard captures had no horizontal overflow or blocking overlap. |
| Production smoke and security | PASS | Nine-route smoke passed; security posture returned zero findings. |
| QA data cleanup | PASS | Temporary staff/dashboard/voucher records were removed; one older orphaned automation-only auth user was removed after verifying it had no profile or order. |

## Production UAT Order

- Order code: `CF-MRWAT991-0266BA851D`
- Payment method: bank transfer
- Promotion: `WELCOME30K`
- Discount: 30,000 VND
- Final total: 166,900 VND
- Final order status: `cancelled`
- Final payment status: `cancelled`
- Final shipping status: `cancelled`

The UAT account and cancelled order are retained as explicit acceptance
evidence. Temporary verifier accounts, catalog rows, orders, and dashboard
fixtures were removed.

## Verification Commands

- Strict production customer UAT with real email confirmation: PASS.
- `scripts/verify-signup-vouchers.ts` against production: PASS, 10/10.
- `scripts/verify-staff-role-access.ts` against production: PASS.
- `scripts/verify-admin-dashboard.ts` against production: PASS.
- `scripts/verify-release-cleanup.ts`: PASS, zero temporary QA matches.
- `scripts/verify-production-smoke.ts`: PASS, 9/9 routes.
- `scripts/verify-security-posture.ts`: PASS, zero findings.
- `npm run lint`: PASS.
- `npx tsc --noEmit --pretty false`: PASS.
- Secret scan: PASS, 1,341 files and zero findings.

## Visual Evidence

- `.agent/artifacts/uat-owner-t01-production/01-account-created.png`
- `.agent/artifacts/uat-owner-t01-production/03b-checkout-review-before-submit.png`
- `.agent/artifacts/uat-owner-t01-production/04-checkout-success.png`
- `.agent/artifacts/uat-owner-t01-production/06-order-history.png`
- `.agent/artifacts/uat-owner-t01-signup-vouchers/account-signup-vouchers.png`
- `.agent/artifacts/uat-owner-t01-staff-role/staff-operations-orders-page-en.png`
- `.agent/artifacts/uat-owner-t01-admin-dashboard/admin-dashboard-desktop-en.png`
- `.agent/artifacts/uat-owner-t01-admin-dashboard/admin-dashboard-empty-mobile-en.png`

The Gmail inbox itself is not stored as a repository screenshot to avoid
adding unrelated mailbox content to public project evidence.

## Findings And Honest Boundaries

1. Supabase's default Auth sender delivered the tested message, but custom SMTP
   remains unconfigured. This does not prove business-grade sender reputation,
   quota, bounce handling, or deliverability.
2. Order-confirmation email/SMS is not implemented. Customers can see orders
   in account history and use guarded tracking, but no transactional order
   notification is sent.
3. Production intentionally disables demo QR generation and mock settlement.
   Real online payment, webhook reconciliation, refunds, and financial
   settlement are outside the current release.
4. Carrier integration, warehouse operations, and live delivery tracking are
   not implemented.

These are not hidden QA failures. They are explicit requirements for a future
commercial launch and should not be represented as completed portfolio scope.
