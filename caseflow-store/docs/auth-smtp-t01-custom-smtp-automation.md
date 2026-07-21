# AUTH-SMTP-T01 Custom SMTP Automation

- Date: 2026-07-21
- Status: BLOCKED pending real SMTP credentials and Supabase Management API token
- Target: Supabase Auth for `caseflow-store`

## Objective

Automate the Supabase Auth custom SMTP configuration so the project no longer
depends on Supabase's low-limit built-in email sender for production sign-up
confirmation emails.

## Why This Is Needed

Supabase documents that custom SMTP is recommended beyond toy/demo projects.
The built-in email sender has a low project-wide quota for email-sending Auth
endpoints such as `/auth/v1/signup`, and exceeding Auth limits returns HTTP
`429 Too Many Requests`.

Primary sources:

- `https://supabase.com/docs/guides/auth/auth-smtp`
- `https://supabase.com/docs/guides/auth/rate-limits`

## Automation Added

Script:

```bash
scripts/configure-supabase-custom-smtp.ts
```

The script:

- loads local env values with `@next/env`;
- derives the Supabase project ref from `SUPABASE_PROJECT_REF`,
  `PROJECT_REF`, or `NEXT_PUBLIC_SUPABASE_URL`;
- validates required SMTP values;
- rejects placeholder/local SMTP hosts;
- refuses weak placeholder passwords;
- redacts `smtp_pass`, `smtp_user`, token-like fields, and secrets from output;
- dry-runs by default;
- applies only when `AUTH_SMTP_APPLY=true` is explicitly set.

It patches the official Supabase Management API endpoint:

```text
PATCH https://api.supabase.com/v1/projects/{project-ref}/config/auth
```

with:

```json
{
  "external_email_enabled": true,
  "mailer_secure_email_change_enabled": true,
  "mailer_autoconfirm": false,
  "smtp_admin_email": "...",
  "smtp_host": "...",
  "smtp_port": 587,
  "smtp_user": "...",
  "smtp_pass": "...",
  "smtp_sender_name": "CaseFlow Books"
}
```

## Required Secrets

These values must be provided from a trusted local shell or ignored `.env.local`.
Do not commit real values.

```bash
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
SMTP_ADMIN_EMAIL=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME="CaseFlow Books"
```

For Gmail SMTP, this requires a Google App Password, not the normal Gmail
account password. For a business-grade sender, prefer a transactional provider
such as Resend, Postmark, SendGrid, Brevo, or AWS SES with SPF, DKIM, and DMARC
configured.

## Dry Run

```bash
npm exec -- tsx scripts/configure-supabase-custom-smtp.ts
```

Expected behavior without credentials: the script exits non-zero and lists
missing env names without printing secrets.

## Apply

Only run this when every real value is present:

```bash
AUTH_SMTP_APPLY=true npm exec -- tsx scripts/configure-supabase-custom-smtp.ts
```

## Post-apply Verification

After apply succeeds:

1. Run one strict real-email UAT with a fresh Gmail alias.
2. Click the confirmation email from the mailbox.
3. Confirm the redirect lands on `https://caseflow-store.vercel.app/account`,
   not `localhost:3000`.
4. Confirm customer sign-in, welcome vouchers, checkout, QR/payment production
   lock, and order history.
5. Run production smoke, security posture, and QR production-safety checks.

## Current Blocker

The local environment currently does not contain:

- `SUPABASE_ACCESS_TOKEN`
- `SMTP_ADMIN_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

Therefore the automation is ready, but applying custom SMTP is blocked until
real credentials are supplied.

## Guardrails

- Do not use fake SMTP credentials.
- Do not commit SMTP secrets.
- Do not disable email confirmation to avoid rate limits.
- Do not use service-role confirmation to claim this email path is production
  ready.
- Do not keep retrying production sign-up while Supabase returns `429`.
