# AUTH-SMTP-T02 - Configure Real Supabase Auth SMTP

Date: 2026-07-22

Status: BLOCKED

Target: Supabase Auth for `caseflow-store`

## Objective

Apply the prepared Supabase Auth custom SMTP automation using real SMTP
provider credentials and a real Supabase Management API token. This is required
before treating production email confirmation as business-grade.

## Result

The automation was run in apply mode and correctly stopped before any Supabase
API mutation. The current local environment only contains non-secret helper
values, not the real provider credentials needed to configure SMTP.

Missing required values:

- `SUPABASE_ACCESS_TOKEN`
- `SMTP_ADMIN_EMAIL`
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`

Present helper values:

- `SUPABASE_PROJECT_REF`
- `SMTP_PORT`
- `SMTP_SENDER_NAME`

## Verification

- `AUTH_SMTP_APPLY=true npm exec -- tsx scripts/configure-supabase-custom-smtp.ts`:
  BLOCKED as expected with `missing-or-invalid-smtp-config`.
- `.env.local` presence check: confirmed helper values are present and real
  secret/provider values are absent.
- `git diff --check`: PASS.

## Why This Must Stay Blocked

SMTP cannot be made real by filling random values into `.env.local`. A fake
host or fake password would only move the failure later, usually into a worse
place: users would attempt registration, Supabase would fail to send mail, and
the site would look broken in production.

## Required Inputs To Unblock

- A Supabase Management API access token with permission to update the project
  Auth configuration.
- A real SMTP host and port from the selected email provider.
- A verified sender/admin email.
- SMTP username.
- SMTP password or provider app password.

Do not commit these values. Keep them in local env or Vercel/Supabase secret
configuration only.

## Guardrails

- Do not invent fake SMTP credentials.
- Do not disable email confirmations to bypass the issue.
- Do not commit `SUPABASE_ACCESS_TOKEN` or SMTP secrets.
- Do not mark real-email UAT as pass until SMTP delivery and mailbox click are
  observed.
