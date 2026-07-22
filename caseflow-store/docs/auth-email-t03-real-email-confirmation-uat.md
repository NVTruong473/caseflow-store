# AUTH-EMAIL-T03 - Real Email Confirmation UAT After SMTP

Date: 2026-07-22

Status: PASS with residual SMTP blocker

Production URL: `https://caseflow-store.vercel.app`

## Objective

Rerun a strict customer registration UAT: public sign-up, delivered
confirmation email, mailbox click, sign-in, welcome vouchers, checkout,
QR/payment production boundary, and account order history.

## Result

The first rerun proved that customer registration and checkout could complete,
but it also exposed that Supabase Auth was still generating confirmation links
with `redirect_to=http://localhost:3000`. That result was not accepted as the
final pass because a real customer would see the wrong redirect target.

The Supabase Auth URL Configuration was corrected through the dashboard:

- Site URL: `https://caseflow-store.vercel.app`
- Redirect URL: `https://caseflow-store.vercel.app/account`

The fixed rerun passed with:

- Email: `truongskull014+caseflow-uat-t03-fixed-202607220925@gmail.com`
- Confirmation link target:
  `https://caseflow-store.vercel.app/account`
- Order: `CF-MRVGAH41-6042473213`
- Service-role fallback: not used
- Dashboard/manual confirmation: not used
- Signup vouchers: 3 visible
- Checkout: one owned voucher applied
- Production QR/payment simulation endpoints: locked
- Account order history: order visible

## Residual SMTP Blocker

`AUTH-SMTP-T02` remains blocked because real credentials are still missing:

- `SUPABASE_ACCESS_TOKEN`
- `SMTP_ADMIN_EMAIL`
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`

This UAT proves the production redirect and default Supabase sender path after
cooldown. It does not prove custom SMTP deliverability.

## Required UAT Rules

The task is accepted because all of the following are true:

- A fresh customer performs public sign-up on production.
- Supabase sends a confirmation email.
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
- Do not claim custom SMTP is configured until `AUTH-SMTP-T02` passes.
- Do not spam production sign-up if Supabase Auth returns a rate limit.
