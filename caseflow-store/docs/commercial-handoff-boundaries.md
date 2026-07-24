# Commercial Handoff Boundaries

This document is a technical scope checklist, not legal advice or a sales
contract.

## Repository Delivery Model

- The public showroom is not cloned with its full Git history.
- A buyer starts from the private `caseflow-bookstore-template` release.
- Each real buyer receives a separate private repository and buyer-owned
  infrastructure.
- No buyer repository is created before discovery and written commercial
  scope.
- The template is bookstore-specific. Unrelated product domains require a
  separately estimated schema/domain/UI migration.

## Included In The Reference Product

- Next.js/React/TypeScript source for the single-store reference app.
- Supabase schema, migrations, RLS/grants, and repository integration.
- Bilingual bookstore storefront and 500-edition reference catalog.
- Customer account/profile, vouchers, cart, simulated checkout, order history,
  cancellation, tracking, and in-app notifications.
- Staff/admin dashboard, orders, simulated-transfer decisions, notifications,
  catalog, inventory, promotions, customers, settings, and exports.
- Rule-based assistant, SEO, accessibility/responsive design, and QA scripts.
- Reference deployment, release evidence, configuration contract, discovery
  questionnaire, catalog migration guidance, and runbook.

## Not Included As A Ready Business Capability

- Buyer legal entity, tax registration, policies, contracts, or compliance
  approval.
- Custom domain purchase or ownership transfer.
- Real payment settlement, merchant account, refunds, disputes, reconciliation,
  fraud controls, or PCI assessment.
- Approved email/SMS sender, marketing consent, deliverability, or OTP service.
- Carrier, warehouse, procurement, packing, tracking-map, returns center, ERP,
  accounting, or tax-invoice integration.
- Licensed commercial product feed, publisher agreement, cover rights, or
  buyer product copy.
- Production SLO, 24/7 support, enterprise audit logging, data-residency
  guarantee, or penetration-test certificate.
- Unlimited catalog/customer/order migration from an unknown source.

## Buyer Must Supply

- approved brand and monitored contact/legal details;
- buyer-owned GitHub/Vercel/Supabase/domain/provider accounts;
- product source export and ownership/provenance evidence;
- business rules for price, tax, stock, delivery, payment, returns, and roles;
- provider contracts and sandbox/Production credentials through secure
  channels;
- privacy/terms/returns/shipping copy approved for the operating jurisdiction;
- named UAT approver, acceptance journeys, performance target, and support
  expectations.

## Customization Estimate Is Separate

Estimate only after reviewing the buyer questionnaire and representative data.
Classify work as:

- configuration: public identity, canonical URL, support details;
- content/design: logo, tokens, copy, policies, media;
- data migration: source mapping, validation, import, reconciliation, rollback;
- integration: provider SDK/API/webhook and operational process;
- infrastructure: accounts, domain, environments, monitoring, backups;
- acceptance/support: UAT, training, launch, warranty, maintenance.

Do not bundle unknown provider, migration, legal, or third-party costs into a
fixed “website source” promise.

## Third-Party Costs And Accounts

The buyer owns recurring service fees and account agreements unless a signed
contract says otherwise. Secrets stay in buyer-controlled secret managers and
are never delivered in repository files, screenshots, chat logs, or release
notes.

## Acceptance Evidence

A buyer handoff is complete only when the agreed scope has:

- immutable source commit/tag;
- buyer-owned deployment and database;
- reviewed environment inventory;
- migration/reconciliation and backup/restore evidence;
- customer/staff/admin UAT;
- security, role, secret, payment/provider lock, and cleanup reports;
- responsive/accessibility/browser evidence;
- rollback target and incident contacts;
- known limitations and buyer sign-off.

## Reference Deployment Language

Use:

> Working source-code reference for a bilingual bookstore and operations
> system, customized with the buyer before real launch.

Do not use:

> Turnkey legally compliant bookstore ready to collect money and ship orders
> immediately.
