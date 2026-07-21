# AUTH-EMAIL-T01 Real Email Confirmation UAT

- Date: 2026-07-21
- Production URL: `https://caseflow-store.vercel.app`
- Status: BLOCKED pending controlled mailbox access

## Objective

Verify the fully real customer registration path:

1. Customer enters an email address they control.
2. Supabase Auth sends the confirmation email.
3. Customer opens the mailbox and clicks the confirmation link.
4. Customer returns to CaseFlow Books and signs in.
5. Customer receives the 3 account-bound welcome vouchers.
6. Customer completes profile, places an order, checks QR/payment production
   boundary, and verifies order history.

## Current Finding

`AUTH-UAT-T01` proved public production sign-up can create an account without
service-role fallback. It did not prove a real inbox confirmation click,
because the verifier used a controlled admin-confirm step after the public
sign-up succeeded.

That means the honest remaining gap is operational: real email delivery and
real mailbox confirmation have not been verified end-to-end.

## Harness Update

`scripts/verify-uat-manual-customer-production.ts` now supports a strict real
email-confirmation mode:

```bash
UAT_MANUAL_BASE_URL=https://caseflow-store.vercel.app \
UAT_MANUAL_ARTIFACT_ID=auth-email-t01-production \
UAT_MANUAL_DISABLE_FALLBACK=true \
UAT_MANUAL_REQUIRE_REAL_EMAIL_CONFIRMATION=true \
UAT_MANUAL_EMAIL='your-controlled-mailbox@example.com' \
UAT_MANUAL_EMAIL_CONFIRMATION_WAIT_SECONDS=600 \
npm exec -- tsx scripts/verify-uat-manual-customer-production.ts
```

Behavior:

- The verifier uses the exact mailbox in `UAT_MANUAL_EMAIL`.
- Service-role fallback stays disabled.
- After public sign-up creates the account, the verifier polls Supabase Auth
  for `email_confirmed_at`.
- The tester must open the mailbox and click the Supabase confirmation link
  while the verifier is still running.
- Only after real confirmation is observed does the verifier continue to
  sign-in, vouchers, profile, cart, checkout, QR/payment boundary, and order
  history.

## Blocker

This task cannot be honestly marked PASS until a controlled inbox is available.

Acceptable ways to unblock:

- provide a dedicated test mailbox and let me run the verifier while you click
  the confirmation email;
- paste the confirmation link from the mailbox during the verifier wait window;
- connect an email tool/account that can read the confirmation email.

Do not bypass this by using service-role confirmation, because that would only
repeat `AUTH-UAT-T01` and would not test real email delivery.

## Guardrails

- No real payment transfer.
- No production mock-payment enablement.
- No forced Supabase confirmation for the real-email test.
- No deploy, tag, release rewrite, or production data cleanup for this
  preflight.
- Do not run repeated signup attempts in a short window; Supabase Auth can
  rate-limit signup/email flows.

## Next Step

Run the command above with a mailbox controlled by the tester, click the
confirmation email while the script waits, then record the resulting order and
screenshots under `.agent/artifacts/auth-email-t01-production`.
