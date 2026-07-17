# Entry 17 - Authentication And Security

Type: real implementation journal entry.

## Goal

Replace temporary admin authorization with Supabase Auth and lock down runtime secrets and API errors.

## Work Completed

A confirmed Supabase admin identity was created and linked to a `profiles` row with role `admin`. The mock admin token flow was replaced with Supabase SSR cookie login/logout, session refresh middleware, server page gates, and per-request API role checks.

Security hardening also finalized `.env.example`, removed stale variables, scanned for secrets, and added stable API error codes. The API error contract defined 13 compile-time error codes and documented HTTP/code semantics.

## Evidence

- Anonymous admin API returned 401.
- Normal customer admin access returned 403.
- Admin list/update/sign-out behavior passed.
- 26 client assets contained no service-role or admin-password values.
- Commit and build secret scans found 0 exact sensitive values.
- API contract tests passed.
- Integration freeze was activated after Day 16.

## Lesson

Auth was not complete when login worked. It became credible only after anonymous, customer, and admin paths were tested separately and service-role secrets were kept out of client assets.
