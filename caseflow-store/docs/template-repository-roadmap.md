# Template Repository Roadmap

Date: 2026-07-24

## Objective

Create a private, reproducible commerce template from the verified CaseFlow
Books showroom without transferring Production identity, secrets, QA history,
or buyer-inappropriate catalog media. Prove that a future buyer instance can be
created and verified without inventing a buyer or enabling real providers.

## Tasks

### TEMPLATE-T01 - Accept Repository Strategy And Audit Baseline

Acceptance criteria:

- ADR-0018 defines showroom, template, and buyer ownership boundaries.
- The audit identifies prohibited data, history, assets, credentials, and
  claims.
- No remote repository, deployment, or buyer fixture is created yet.

Verification:

- documentation links and task IDs resolve;
- `git diff --check` passes.

### TEMPLATE-T02 - Define Export, License, And Handoff Contracts

Acceptance criteria:

- a machine-readable export manifest defines included and excluded paths;
- the template has an `UNLICENSED` package boundary and private-source notice;
- environment, catalog replacement, and buyer ownership requirements are
  explicit;
- no legal, provider, payment, logistics, or uptime readiness is fabricated.

Verification:

- manifest schema and policy verifier pass;
- prohibited showroom paths are absent from the planned output.

### TEMPLATE-T03 - Implement Deterministic Template Export

Acceptance criteria:

- one command exports a fresh template workspace from the showroom source;
- the exporter uses an allowlist, refuses dirty/unexpected secret-bearing
  inputs, and does not copy Git history;
- showroom identity is replaced only through reviewed template overrides;
- third-party downloaded covers and Production artifacts are excluded.

Verification:

- two exports have the same tracked file manifest and hashes;
- secret, infrastructure-identity, and prohibited-path scans pass.

### TEMPLATE-T04 - Generate And Harden The Private Template

Acceptance criteria:

- the generated template has a new Git history and no showroom remote;
- installation, typecheck, lint, architecture, source/config tests, and build
  pass without reading showroom environment files;
- a neutral `.env.example` and setup documentation exist;
- no real provider is enabled by default.

Verification:

- `npm ci`, `npm run lint`, `npx tsc --noEmit`, architecture/source/config
  checks, and `npm run build` pass in the generated repository;
- the retained Playwright suite is explicitly buyer-infrastructure-gated and is
  not run against the showroom Supabase project.

### TEMPLATE-T05 - Prove Buyer Bootstrap With A Disposable Fixture

Acceptance criteria:

- a disposable buyer fixture is generated from an immutable template commit;
- buyer identity overrides work without source edits;
- the fixture does not use showroom Supabase, Vercel, domain, or credentials;
- the fixture is deleted after evidence is recorded.

Verification:

- configuration verifier passes with buyer test values;
- build and configuration checks pass without Production access;
- no buyer repository or external service is created.

### TEMPLATE-T06 - Publish Private Template And Close Handoff

Acceptance criteria:

- final template secret/data/license/build gates pass;
- a private GitHub repository is created only after those gates pass;
- the verified template commit is pushed and tagged;
- showroom documentation records the template without exposing private source;
- worktrees are clean and no showroom runtime deployment changes.

Verification:

- GitHub reports the template repository as private;
- remote branch/tag hashes match the verified local template;
- showroom `v1.14.0` tag and Production deployment remain unchanged.

## Stop Conditions

Stop before creating a buyer repository, buyer infrastructure, paid service, or
legal commitment. Those require a real buyer, discovery answers, commercial
terms, and buyer-owned accounts.
