# AUTH-UAT-T01 Production Sign-up Rate-limit Investigation

- Date: 2026-07-21
- Production URL: `https://caseflow-store.vercel.app`
- Result: PASS after no-fallback rerun
- Artifact: `.agent/artifacts/auth-uat-t01-production-nofallback`

## Scope

This task investigated the open `UAT-MANUAL-F01` finding where production
self-service customer sign-up returned `429 CUSTOMER_AUTH_FAILED`.

The rerun deliberately disabled the service-role fallback used by
`UAT-MANUAL-T01`. If public sign-up failed, the UAT had to stop before profile,
cart, checkout, payment-boundary, and order-history checks.

## Investigation

The application route for customer registration calls
`supabase.auth.signUp(...)` in `src/app/api/customer/session/route.ts`. When
Supabase Auth returns status `429`, the route preserves the 429 status and maps
it to the stable app error code `CUSTOMER_AUTH_FAILED` with customer-safe copy.

Supabase's official Auth documentation says:

- Auth endpoint rate limits return HTTP `429 Too Many Requests`.
- `/auth/v1/signup` is one of the endpoints that can trigger email sending.
- With Supabase's built-in email provider, email-sending flows are limited to a
  small project-wide quota, and custom SMTP is required for a production-grade
  sender.
- Supabase documents `over_email_send_rate_limit` and
  `over_request_rate_limit` as Auth error classes behind 429-style behavior.

Primary references:

- `https://supabase.com/docs/guides/auth/rate-limits`
- `https://supabase.com/docs/guides/auth/auth-smtp`
- `https://supabase.com/docs/guides/auth/debugging/error-codes`

The older UAT account used an `example.com` address and was attempted while the
project was undergoing repeated production verification. That was not a strong
enough signal to claim the signup implementation was broken. The app did the
correct thing by returning a safe 429 response instead of silently creating a
fallback account.

## Rerun

Command:

```bash
UAT_MANUAL_BASE_URL=https://caseflow-store.vercel.app \
UAT_MANUAL_ARTIFACT_ID=auth-uat-t01-production-nofallback \
UAT_MANUAL_DISABLE_FALLBACK=true \
UAT_MANUAL_EMAIL_DOMAIN=gmail.com \
npm exec -- tsx scripts/verify-uat-manual-customer-production.ts
```

Result:

- Self-service sign-up returned `201`.
- `fallbackProvisioned` was `false`.
- The account required confirmation before sign-in, so the verifier used the
  existing controlled admin-confirm step only after the public sign-up had
  created the account.
- Customer sign-in passed.
- The 3 account-bound signup vouchers were visible.
- Profile completion passed.
- Product add-to-cart passed.
- Checkout with one voucher passed.
- Production QR/payment lock passed.
- Account order history passed.

## UAT Account And Order

- UAT email: `caseflow-uat-manual-mruspqcg-xk4bg9@gmail.com`
- UAT order: `CF-MRUSRE2K-007B2B5B07`
- Password is not stored in repository artifacts.

## Pass Matrix

| Check | Result |
|---|---|
| Public production sign-up created account | PASS |
| Service-role fallback disabled | PASS |
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

## Evidence

- `.agent/artifacts/auth-uat-t01-production-nofallback/uat-manual-customer-production-check.json`
- `.agent/artifacts/auth-uat-t01-production-nofallback/uat-manual-customer-production-report.md`
- `.agent/artifacts/auth-uat-t01-production-nofallback/01-account-created.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/02-profile-complete.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/03-book-added-to-cart.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/03b-checkout-review-before-submit.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/04-checkout-success.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/05-qr-boundary-orders-redirect.png`
- `.agent/artifacts/auth-uat-t01-production-nofallback/06-order-history.png`

## Conclusion

`UAT-MANUAL-F01` is closed for the current production build. The production
registration implementation works when Supabase Auth is not rate-limiting the
signup/email flow.

The remaining production-readiness truth is operational, not code-level:
CaseFlow Books still depends on Supabase Auth email delivery limits. A real
business launch should configure custom SMTP, reviewed sender identity,
deliverability records, and abuse controls instead of relying on repeated
testing through the default sender.

## Recommended Follow-up

- Configure custom SMTP before treating public email sign-up as production
  ready.
- Keep the no-fallback UAT mode for future registration checks.
- Avoid repeated automated sign-up probes against production in a short window.
- Use a controlled real mailbox for a future manual email-confirmation test.
