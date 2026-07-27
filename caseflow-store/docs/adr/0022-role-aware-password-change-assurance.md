# ADR-0022: Role-aware Password Change Assurance

- Status: Accepted
- Date: 2026-07-27
- Task: `SECURITY-UX-PLAN-T01`
- Target: `v1.16.0`

## Context

The current password form verifies only the current password. A stolen active
browser session plus a known password can change the credential without
proof-of-email possession. Operations accounts also need an additional
store-owned control during this portfolio/demo phase.

## Decision

Use role-specific assurance before updating a password:

- `customer`: request a Supabase single-use recovery link sent only to the
  signed-in account email. The link opens `/account/password-reset`, establishes
  the recovery session, removes bearer tokens from the visible URL, accepts the
  new password, then ends the recovery session.
- `admin` and `staff`: require the current password plus a server-only
  operations secret. The secret is supplied through
  `OPERATIONS_PASSWORD_CHANGE_SECRET`; the requested test value may be set in
  deployment configuration, but it is never committed or bundled.

The account UI receives the authenticated role from the server and renders the
corresponding form. The API repeats role authorization and never trusts the
client-selected flow.

## Guardrails

- No password, operations secret, recovery link token, session token, or SMTP
  credential is logged or persisted by the application.
- Operations-secret comparison is constant-time.
- Missing or placeholder operations secret fails closed.
- Customer password change has no fallback to current-password-only behavior.
- Recovery links are single-use and expire under Supabase Auth policy.
- Customer resend controls respect provider cooldown and expose no arbitrary
  email input.
- The customer password API fails closed; a normal signed-in session cannot use
  the application endpoint to bypass the email link.
- The recovery page requires `type=recovery` plus both provider tokens before
  accepting a new password.
- API responses use the existing envelope and do not disclose secret values.

## Production Email Boundary

Supabase default SMTP is suitable only for authorized test addresses and has
strict rate limits. Real customer delivery is not marked production-ready
until:

1. an authorized mailbox receives the recovery link;
2. the link redirects to the intended production reset page;
3. the link completes one end-to-end password change;
4. custom SMTP, SPF, DKIM, DMARC, abuse limits, and monitoring are configured
   before a buyer uses the system for real commerce.

## Alternatives Rejected

- **Hardcode the requested test secret:** anyone reading the source would own
  the second factor.
- **Use one shared secret in a public environment variable:** it would be
  bundled into the client.
- **Send the OTP through in-app notifications:** a stolen logged-in session
  could read the same code, so it does not prove mailbox possession.
- **Continue current-password-only changes:** does not meet the requested
  assurance boundary.
- **Use Supabase reauthentication nonce as an unconditional factor:** hosted
  Supabase accepts password changes without nonce for sessions created within
  the previous 24 hours. A focused test proved that an invalid nonce was
  accepted on a fresh session, so this would provide misleading assurance.

## Consequences

Customer changes depend on Supabase email delivery and recovery-link policy.
Admin/staff changes depend on a deployment-owned secret and remain a demo
control, not enterprise MFA. A buyer should replace the shared operations
secret with per-user MFA or an identity-provider policy.
