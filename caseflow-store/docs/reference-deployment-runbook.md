# Reference Deployment Runbook

This runbook operates the reference/demo application. A buyer Production
handoff must use buyer-owned accounts and an approved customization plan.

## Ownership

Record owners for:

- GitHub repository and branch protection;
- Vercel project, environment variables, aliases, and billing;
- Supabase organization/project, database, Auth, backups, and service keys;
- DNS/domain;
- payment, email, SMS, monitoring, shipping, tax, and accounting providers;
- release approval, incident response, and rollback.

The reference developer’s personal accounts are not a durable buyer
Production boundary.

## Local Preflight

```bash
node --version
npm --version
npm install
cp .env.example .env.local
npm run verify:productization-config
npm run lint
npm exec -- tsc --noEmit --pretty false
npm run build
```

Use only a development/staging Supabase project for destructive test setup.
Never commit `.env.local`, database URLs, service keys, provider credentials,
or reusable UAT passwords.

## Database And Data

For a fresh buyer project:

1. provision a buyer-owned Supabase project;
2. apply the reviewed schema/migrations in order;
3. verify RLS/grants before importing customer or order data;
4. import mapped catalog data through an idempotent buyer-specific script;
5. reconcile counts and sample records;
6. run API, storefront, checkout, role, and cleanup tests.

Before any Production migration:

- capture provider backup/snapshot identifier;
- export affected records to encrypted private storage;
- record table counts and migration version;
- prove restore in a non-Production environment;
- document rollback ownership and maximum acceptable downtime.

## Preview Deployment

Preview must use non-Production data and provider sandbox/disabled modes.

Verify:

- public configuration and canonical URL;
- no Production secret in browser bundles or logs;
- account callback/redirect URLs;
- migration version and catalog counts;
- payment simulation boundary;
- external notification mode;
- customer/staff/admin role matrix;
- responsive, accessibility, SEO, security, and cleanup gates.

## Production Promotion

Promote only an immutable commit that passed the agreed gates. Record:

- commit and tag;
- deployment ID/URL and alias;
- environment-variable review;
- database migration/backup identifiers;
- smoke and browser test artifacts;
- approver and time;
- rollback target.

The CaseFlow reference Production must keep real providers disabled and
mock-payment success locked.

## Smoke Checklist

- home, catalog, detail, policies, robots, and sitemap return successfully;
- product API returns active catalog data;
- account and checkout boundaries behave correctly;
- anonymous admin/customer protected APIs return `401`;
- staff/admin permissions return expected `403`/success responses;
- no serious browser console, hydration, asset, or horizontal-overflow error;
- production simulate-payment endpoint remains blocked;
- no secret/public metadata finding;
- temporary users, orders, vouchers, stock changes, and notifications are
  cleaned.

## Incident Triage

Classify before changing data:

- P0: secret exposure, unauthorized customer/admin access, payment-state
  corruption, destructive data loss;
- P1: checkout/order creation unavailable, wrong trusted total, auth outage,
  widespread catalog failure;
- P2: degraded search, notification delay, broken non-critical admin feature,
  responsive defect;
- P3: copy, isolated visual, or documentation issue.

For P0/P1:

1. stop risky writes or remove the affected deployment from traffic;
2. preserve logs/evidence without printing secrets;
3. rotate exposed credentials;
4. promote the last verified deployment when application rollback is safe;
5. restore database data only from a tested backup with an approved plan;
6. run security/smoke/cleanup gates;
7. document impact, timeline, root cause, and prevention.

Do not “fix” incidents with `git reset --hard`, blanket table deletion, silent
history rewrite, or unreviewed Production SQL.

## Credential Rotation

- rotate Supabase anon/service/database credentials according to exposure;
- update trusted deployment environments, then redeploy;
- invalidate old provider/webhook/dispatcher secrets;
- verify browser bundles and logs contain no secret;
- rerun auth, role, webhook, payment-lock, notification, and secret scans;
- record who rotated what without recording the secret value.

## Rollback

Application rollback and database rollback are separate decisions.

- Application: promote the last verified immutable deployment, then smoke test.
- Database: use the migration-specific reverse plan or tested backup; preserve
  orders and snapshots.
- Catalog: deactivate or reverse the migration batch; do not delete referenced
  editions.
- Providers: disable the provider mode first, then rotate/reconcile.

## Periodic Maintenance

- dependency/security review;
- backup restore drill;
- expiring domain/sender/provider credential check;
- stale account/UAT data cleanup;
- catalog/provenance review;
- performance/error trend review;
- access and role review;
- release documentation consistency check.
