# AUTH-EMAIL-T01 Real Email Confirmation UAT

- Date: 2026-07-21
- Production URL: `https://caseflow-store.vercel.app`
- Current deployment after fix: `dpl_AXPMXSQ73rvofGE4cYLT5hnF5kd5`
- Status: PARTIAL PASS, with post-fix email rerun blocked by Supabase Auth rate limit

## Objective

Verify the fully real customer registration path:

1. Customer enters an email address they control.
2. Supabase Auth sends the confirmation email.
3. Customer opens the mailbox and clicks the confirmation link.
4. Customer returns to CaseFlow Books and signs in.
5. Customer receives the 3 account-bound welcome vouchers.
6. Customer completes profile, places an order, checks QR/payment production
   boundary, and verifies order history.

## What Passed

The real-mailbox UAT was run against the tester-controlled Gmail mailbox using
a Gmail plus-alias:

- Email: `truongskull014+caseflow-uat-202607211550@gmail.com`
- Public sign-up status: `201`
- Service-role fallback: not used
- Real email confirmation: observed by Supabase Auth before the verifier
  continued
- Order created: `CF-MRUU092P-A54D8D8BB5`

The full customer path passed after confirmation:

| Check | Result |
|---|---|
| Public production sign-up created account | PASS |
| Real mailbox confirmation observed | PASS |
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

Evidence:

- `.agent/artifacts/auth-email-t01-production/uat-manual-customer-production-check.json`
- `.agent/artifacts/auth-email-t01-production/uat-manual-customer-production-report.md`
- `.agent/artifacts/auth-email-t01-production/01-account-created.png`
- `.agent/artifacts/auth-email-t01-production/02-profile-complete.png`
- `.agent/artifacts/auth-email-t01-production/03-book-added-to-cart.png`
- `.agent/artifacts/auth-email-t01-production/03b-checkout-review-before-submit.png`
- `.agent/artifacts/auth-email-t01-production/04-checkout-success.png`
- `.agent/artifacts/auth-email-t01-production/05-qr-boundary-orders-redirect.png`
- `.agent/artifacts/auth-email-t01-production/06-order-history.png`

## Defect Found

After clicking the confirmation email, the tester saw a browser page on
`localhost:3000` with:

```text
error=access_denied
error_code=otp_expired
error_description=Email link is invalid or has expired
```

The account was already confirmed by the time this was observed, so the UAT
data path passed. The defect was the customer-facing redirect target: the
confirmation link could send the customer to localhost instead of the
production website.

## Root Cause

`src/app/api/customer/session/route.ts` built Supabase `emailRedirectTo` with:

```ts
new URL("/account", request.url)
```

In serverless/proxy deployments, `request.url` can represent an internal or
local origin. Vercel production also did not have `NEXT_PUBLIC_SITE_URL`
configured, so the email redirect target had no explicit production origin.

## Fix Applied

Runtime fix:

- Commit: `409c333 fix: use public origin for signup email redirects`
- Route now builds the confirmation redirect from:
  1. `NEXT_PUBLIC_SITE_URL`
  2. forwarded public request headers
  3. request URL only as a final fallback

Environment fix:

- Added Vercel Production env:
  `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app`

Deployment:

- Production deployment: `dpl_AXPMXSQ73rvofGE4cYLT5hnF5kd5`
- Alias verified: `https://caseflow-store.vercel.app`

## Post-fix Verification

Local/runtime checks before deploy:

- `npm exec -- tsc --noEmit --pretty false`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS

Production checks after deploy:

- `npx vercel inspect https://caseflow-store.vercel.app`: PASS, alias points
  to `dpl_AXPMXSQ73rvofGE4cYLT5hnF5kd5`
- `PRODUCTION_SMOKE_BASE_URL=https://caseflow-store.vercel.app PRODUCTION_SMOKE_ARTIFACT_ID=auth-email-t01-post-fix npm exec -- tsx scripts/verify-production-smoke.ts`:
  PASS
- `SECURITY_QA_BASE_URL=https://caseflow-store.vercel.app SECURITY_QA_ARTIFACT_ID=auth-email-t01-post-fix npm exec -- tsx scripts/verify-security-posture.ts`:
  PASS
- `PAYQR_PRODUCTION_SAFETY_BASE_URL=https://caseflow-store.vercel.app PAYQR_ARTIFACT_ID=auth-email-t01-post-fix npm exec -- tsx scripts/verify-qr-payment-production-safety.ts`:
  PASS

Evidence:

- `.agent/artifacts/auth-email-t01-post-fix/production-smoke-check.json`
- `.agent/artifacts/auth-email-t01-post-fix/security-posture-check.json`
- `.agent/artifacts/auth-email-t01-post-fix/qr-payment-production-safety-check.json`

## Post-fix Email Rerun

A second real-email UAT was attempted after the deploy using:

- Email: `truongskull014+caseflow-uat-fixed-202607211558@gmail.com`
- Artifact: `.agent/artifacts/auth-email-t01-production-fixed`

Result:

- Public sign-up returned `429 CUSTOMER_AUTH_FAILED`.
- Service-role fallback stayed disabled.
- The verifier stopped before sending/confirming a new email.

This is consistent with Supabase Auth signup/email rate limiting after repeated
production email tests. The post-fix confirmation link cannot be honestly
marked reverified until the rate limit cools down or custom SMTP/rate limits
are configured.

## Current Conclusion

The real customer email confirmation journey is data-pass: a real Gmail inbox
confirmed the account and the customer checkout flow completed without
service-role fallback.

The user-facing redirect defect was real and has been fixed and deployed.

The remaining gap is post-fix email-link UX revalidation. Do not run repeated
signup attempts immediately. Wait for Supabase cooldown or configure custom
SMTP, then rerun the strict real-email UAT with a fresh Gmail alias.

## Next Safe Rerun

```bash
UAT_MANUAL_BASE_URL=https://caseflow-store.vercel.app \
UAT_MANUAL_ARTIFACT_ID=auth-email-t01-production-rerun \
UAT_MANUAL_DISABLE_FALLBACK=true \
UAT_MANUAL_REQUIRE_REAL_EMAIL_CONFIRMATION=true \
UAT_MANUAL_EMAIL='truongskull014+caseflow-uat-rerun-YYYYMMDDHHMM@gmail.com' \
UAT_MANUAL_EMAIL_CONFIRMATION_WAIT_SECONDS=900 \
npm exec -- tsx scripts/verify-uat-manual-customer-production.ts
```

## Guardrails

- Do not service-role-confirm the user for this task.
- Do not mark the post-fix confirmation redirect PASS without a fresh email
  link after cooldown.
- Do not spam production sign-up attempts; Supabase Auth can rate-limit
  signup/email flows.
- For business-grade launch, configure custom SMTP and abuse controls instead
  of relying on default Supabase email delivery.
