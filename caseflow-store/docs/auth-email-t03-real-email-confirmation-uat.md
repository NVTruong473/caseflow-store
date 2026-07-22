# AUTH-EMAIL-T03 - Real Email Confirmation UAT After SMTP

Date: 2026-07-22

Status: BLOCKED

Production URL: `https://caseflow-store.vercel.app`

## Objective

Rerun a strict customer registration UAT after custom SMTP is configured:
public sign-up, delivered confirmation email, mailbox click, sign-in, welcome
vouchers, checkout, QR/payment production boundary, and account order history.

## Result

The test was not run to completion because the required SMTP prerequisite is
blocked and this environment does not have controlled access to click the
confirmation link from the target mailbox.

## Blocking Conditions

- `AUTH-SMTP-T02` did not configure SMTP because real credentials are missing.
- There is no controlled mailbox automation available in this environment to
  prove a delivered email link was clicked.
- Reusing a previously confirmed account would not test email delivery.
- Service-role confirming the account would bypass the exact customer path
  being verified.

## Required UAT Rules

The task can be marked PASS only when all of the following are true:

- A fresh customer performs public sign-up on production.
- Supabase sends a confirmation email through the configured SMTP provider.
- The real confirmation link is clicked.
- The redirect lands on `https://caseflow-store.vercel.app`, not `localhost`.
- The customer signs in after confirmation.
- The account receives the three signup vouchers.
- Checkout accepts at most one owned voucher.
- Production QR/payment safety remains locked.
- Account order history shows the created order.

## Guardrails

- Do not service-role-confirm the account.
- Do not use dashboard manual confirmation as a substitute for email delivery.
- Do not claim PASS without a real mailbox click.
- Do not spam production sign-up if Supabase Auth returns a rate limit.
