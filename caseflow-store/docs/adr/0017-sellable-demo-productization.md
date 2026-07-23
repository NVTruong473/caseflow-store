# ADR-0017: Sellable Demo Productization

- Status: Accepted
- Date: 2026-07-24
- Planning task: `PRODUCTIZE-T01`

## Context

CaseFlow Books is a stable bookstore and small-business operations demo. The
owner may show or sell the source to a prospective business, then customize
brand, catalog, policies, providers, and deployment with that buyer.

The current application proves product and engineering capability, but it is
not a turnkey business. Treating placeholder support details, simulated
payments, unlicensed commercial content, or disabled providers as launch-ready
would create legal and operational risk. A large multi-tenant or theme-builder
rewrite would also weaken the proven single-store architecture without a real
buyer requirement.

## Decision

Productize the existing modular monolith as a configurable single-store demo:

1. Centralize public store identity, canonical URL, support details, and legal
   display values in a typed build-time configuration with safe defaults.
2. Keep support phone and email optional. Do not render invented contact
   details when a deployment has not configured them.
3. Document buyer discovery, brand customization, catalog replacement,
   environment setup, deployment, data ownership, and final acceptance.
4. Preserve simulated payment and provider-disabled boundaries. Real services
   require a later buyer-specific ADR, credentials, contracts, and security
   review.
5. Add an automated productization verifier for stale release claims,
   placeholder contact data, unsafe demo claims, and configuration drift.
6. Keep CaseFlow Books as the reference implementation and portfolio brand.
   This is not a multi-tenant SaaS, reseller control plane, or no-code builder.

## Buyer-Specific Work Deferred

- Custom domain purchase, DNS, TLS ownership, and branded sender domain.
- Real payment settlement, refunds, reconciliation, fraud controls, and PCI
  scope.
- Email/SMS provider accounts, sender approval, deliverability monitoring, and
  consent management.
- Carrier, warehouse, tax-invoice, ERP, accounting, and live inventory feeds.
- Commercial catalog licensing, cover rights, publisher feeds, and buyer-owned
  product copy.
- Buyer-specific legal terms, privacy notices, return policy, hotline, company
  registration, and tax identity.

## Alternatives Considered

### Build A Multi-Tenant White-Label Platform

Rejected. No current buyer requires tenant isolation, per-tenant databases,
billing, domain routing, or a reseller administration plane.

### Add An Admin Theme And Branding Editor

Rejected. It adds mutation, upload, validation, caching, authorization, and
rollback complexity for values that are safer to review during deployment.

### Keep Hard-Coded Placeholder Contact Details

Rejected. An unreachable hotline or invented mailbox damages trust and can be
mistaken for a real customer-service commitment.

### Enable Real Providers Now

Rejected. There is no buyer legal entity, provider contract, sender identity,
bank account, fulfillment process, or approved production credential set.

## Consequences

Positive:

- A buyer can estimate customization effort from an explicit configuration and
  handoff contract.
- The public demo remains honest while still looking like a complete product.
- Runtime architecture, API contracts, and proven role boundaries remain
  stable.
- Buyer-specific integrations start from documented gates rather than hidden
  assumptions.

Negative:

- Rebranding still requires a reviewed build and deployment.
- Catalog replacement remains a data migration, not a one-click import for
  arbitrary schemas.
- The reference deployment cannot claim to be a legally operating bookstore.

## Guardrails

- Do not expose secrets through public configuration.
- Do not render placeholder phone numbers or fake support mailboxes.
- Do not claim real payment, delivery, email, SMS, licensing, tax, or legal
  readiness.
- Do not weaken server-owned totals, RLS, role checks, idempotency, or stable
  API errors.
- Do not introduce external services or recurring cost without a buyer-specific
  decision.
- Preserve the existing 500-edition reference catalog and order snapshot
  integrity.
