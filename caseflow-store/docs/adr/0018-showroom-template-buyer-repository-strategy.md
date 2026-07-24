# ADR-0018: Showroom, Template, And Buyer Repository Strategy

- Status: Accepted
- Date: 2026-07-24
- Planning task: `TEMPLATE-T01`

## Context

CaseFlow Books `v1.14.0` is a verified public reference deployment. The owner
may sell a customized copy of the product to a future business, but there is no
buyer, buyer-owned catalog, legal entity, provider account, or operating
infrastructure yet.

Copying the current Git repository directly would also copy development
history, Production QA evidence, release artifacts, reference deployment
identity, and catalog media that are unnecessary or inappropriate for a buyer.
Keeping every buyer in the showroom repository would couple unrelated
credentials, data, release schedules, and commercial obligations.

## Decision

Use a `2 + N` repository model:

1. The existing `caseflow-store` repository remains the public showroom and
   engineering reference.
2. A private `caseflow-commerce-template` repository is generated from an
   explicit allowlist and starts with a new Git history.
3. A private buyer repository is created from a tested template release only
   after buyer discovery and a signed commercial agreement.

The template remains a configurable single-store Next.js modular monolith. It
is not a multi-tenant SaaS, a reseller control plane, or a hosted shared
database.

## Template Export Contract

The template must:

- include application source, database schema/migrations, tests, design
  foundations, environment examples, and buyer-facing setup documentation;
- exclude `.git`, `.agent`, local environment files, Vercel metadata, build
  outputs, QA screenshots, Production reports, customer/order exports, and
  private backups;
- exclude third-party storefront cover downloads and keep only project-created
  or neutral placeholder assets needed for local development;
- replace showroom-specific package/config defaults with neutral template
  values without changing runtime security boundaries;
- contain no Production URL, deployment ID, Supabase project reference, real
  account, credential, or provider secret;
- declare the package private and the source unlicensed until a written buyer
  license grants use;
- build and pass focused tests without using the showroom Production database.

The exporter is deterministic and fails closed when a prohibited file, secret,
or showroom infrastructure identifier is found.

## Buyer Instance Contract

A buyer instance must:

- be created from an immutable template tag;
- have a new private repository, Supabase project, Vercel project, domain, and
  secrets owned by that buyer;
- receive buyer-approved brand, catalog, contact, policy, provider, and
  operational configuration;
- never share the showroom database, auth tenant, payment state, notification
  sender, analytics, or deployment credentials;
- pass migration, security, role, checkout, responsive, and UAT gates before
  handoff.

No buyer repository will be created before a buyer exists. A disposable local
fixture may be generated to verify the bootstrap contract, but it must not be
presented as a real customer project.

## Update Strategy

Shared fixes are implemented in the private template first and released under
an immutable template version. Buyer repositories receive reviewed updates by
merge or cherry-pick. They do not pull arbitrary showroom commits, and the
template does not absorb buyer-specific code unless it is generalized,
documented, and regression-tested.

## Commercial And Legal Boundary

The private template grants no redistribution or resale rights by merely
granting repository access. A future agreement must define license scope,
number of deployments, modification rights, source redistribution, warranty,
support, data migration, acceptance, and termination. This ADR is an
engineering boundary, not legal advice or a substitute for a signed contract.

## Alternatives Considered

### One Repository With Buyer Branches

Rejected. Branches do not isolate repository access, credentials, issue
history, deployment ownership, or long-term release obligations.

### Clone The Showroom With Full Git History

Rejected. It unnecessarily transfers portfolio history, Production evidence,
reference infrastructure identity, and potentially unsuitable assets.

### Build A Multi-Tenant White-Label SaaS

Rejected. There is no buyer requirement for tenant routing, tenant billing,
shared operations, or tenant isolation, and the complexity would weaken the
proven single-store product.

### Create A Buyer Repository Now

Rejected. An invented buyer would create fake business data and an unsupported
operational claim. The correct proof is a disposable bootstrap fixture.

## Consequences

Positive:

- showroom releases remain stable and independently demonstrable;
- template distribution is deliberate, private, smaller, and auditable;
- each buyer owns an isolated deployment and data boundary;
- common fixes have one controlled upstream.

Negative:

- shared fixes require an explicit propagation workflow;
- buyer customizations can diverge and need compatibility review;
- commercial licensing still requires real legal and business decisions.
