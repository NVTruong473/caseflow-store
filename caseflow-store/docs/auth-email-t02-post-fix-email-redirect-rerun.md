# AUTH-EMAIL-T02 Post-fix Email Redirect Rerun

- Date: 2026-07-21
- Production URL: `https://caseflow-store.vercel.app`
- Production deployment: `dpl_AXPMXSQ73rvofGE4cYLT5hnF5kd5`
- Result: BLOCKED by Supabase Auth rate limit

## Objective

Rerun the strict real-email UAT after the signup email redirect fix to prove a
fresh Supabase confirmation email no longer sends customers to `localhost:3000`
and instead returns them to `https://caseflow-store.vercel.app/account`.

## Preflight

- Local branch: `main`
- Runtime fix present: `409c333 fix: use public origin for signup email redirects`
- Report commit present: `887d23a docs: record auth email uat and redirect fix`
- Vercel alias verified against deployment `dpl_AXPMXSQ73rvofGE4cYLT5hnF5kd5`
- `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app` is configured in
  Vercel Production.

## Rerun Attempt

Command:

```bash
UAT_MANUAL_BASE_URL=https://caseflow-store.vercel.app \
UAT_MANUAL_ARTIFACT_ID=auth-email-t02-production-rerun \
UAT_MANUAL_DISABLE_FALLBACK=true \
UAT_MANUAL_REQUIRE_REAL_EMAIL_CONFIRMATION=true \
UAT_MANUAL_EMAIL='truongskull014+caseflow-uat-t02-202607211605@gmail.com' \
UAT_MANUAL_EMAIL_CONFIRMATION_WAIT_SECONDS=900 \
npm exec -- tsx scripts/verify-uat-manual-customer-production.ts
```

Result:

- Public sign-up returned `429 CUSTOMER_AUTH_FAILED`.
- `fallbackProvisioned` remained `false`.
- No account was created.
- No fresh confirmation email was available to click.
- Checkout/order-history steps were intentionally not executed.

Evidence:

- `.agent/artifacts/auth-email-t02-production-rerun/uat-manual-customer-production-check.json`
- `.agent/artifacts/auth-email-t02-production-rerun/uat-manual-customer-production-report.md`

## Conclusion

`AUTH-EMAIL-T02` did not disprove the redirect fix. It was blocked before
email delivery by Supabase Auth rate limiting. This is the expected operational
failure mode after repeated signup/email tests in a short window.

The safe next action is to wait for the Supabase Auth cooldown or configure
custom SMTP/rate limits, then rerun with a fresh Gmail alias. Do not keep
retrying immediately.

## Next Rerun Command

```bash
UAT_MANUAL_BASE_URL=https://caseflow-store.vercel.app \
UAT_MANUAL_ARTIFACT_ID=auth-email-t02-production-rerun-2 \
UAT_MANUAL_DISABLE_FALLBACK=true \
UAT_MANUAL_REQUIRE_REAL_EMAIL_CONFIRMATION=true \
UAT_MANUAL_EMAIL='truongskull014+caseflow-uat-t02-rerun-YYYYMMDDHHMM@gmail.com' \
UAT_MANUAL_EMAIL_CONFIRMATION_WAIT_SECONDS=900 \
npm exec -- tsx scripts/verify-uat-manual-customer-production.ts
```

## Guardrails

- Do not service-role-confirm this test.
- Do not mark post-fix redirect as PASS until a fresh confirmation email is
  clicked after the fix.
- Do not repeatedly hit production sign-up while Supabase returns 429.
- For a real launch, configure custom SMTP, deliverability records, and abuse
  controls instead of relying on default Supabase email sending.
