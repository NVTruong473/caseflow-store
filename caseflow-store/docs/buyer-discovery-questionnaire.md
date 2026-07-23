# Buyer Discovery Questionnaire

Use this before estimating or accepting customization work. Unknown answers are
not implementation approval; they are scope and risk.

## 1. Business Identity

- Buyer legal name and public trading name:
- Country and operating jurisdictions:
- Company/tax registration details that must appear:
- Monitored support email and phone:
- Support hours and responsible team:
- Domain already owned by the buyer:
- Brand files supplied: logo, favicon, colors, font licenses, image licenses:
- Vietnamese and English copy owner/reviewer:

Gate: do not publish contact, legal, warranty, compliance, or tax claims until
the buyer supplies and approves them.

## 2. Catalog And Content

- Product domain: books or another category:
- Expected product, category, variant, and image counts:
- Source system: spreadsheet, ERP, CMS, marketplace export, or API:
- Stable external IDs and unique identifiers:
- Required variants, languages, formats, attributes, and compatibility rules:
- Price source, currency, compare-at price, VAT, and effective dates:
- Inventory source and overselling policy:
- Image/description ownership and license evidence:
- SEO fields and redirect requirements:
- Existing orders that must be migrated:

Gate: inspect a representative source export before promising import cost or
timeline. The reference catalog importer is not a universal buyer-data
adapter.

## 3. Customers And Authentication

- Existing customer accounts to migrate:
- Password migration capability from the current identity provider:
- Required login methods, email confirmation, MFA, recovery, and session
  policy:
- Customer roles and staff/admin permission matrix:
- Required retention, deletion, export, consent, and privacy workflows:
- Expected account and checkout abuse patterns:

Gate: never import plaintext passwords or broaden roles to simplify migration.

## 4. Orders And Fulfillment

- Required order lifecycle and cancellation rules:
- Warehouses, stock reservation, backorder, and allocation rules:
- Shipping carriers, service levels, regions, fees, tracking, and COD rules:
- Returns, exchanges, refunds, and partial fulfillment:
- Invoice, tax, accounting, ERP, and reconciliation systems:
- Customer-service escalation and order rejection authority:

Gate: the reference status model is a starting point, not proof that the
buyer’s physical operation follows the same workflow.

## 5. Payments

- Provider and merchant contract:
- Countries, currencies, methods, and settlement accounts:
- Webhook signing, idempotency, reconciliation, refunds, and disputes:
- Fraud checks and manual-review ownership:
- PCI scope and provider-hosted UI requirements:
- Sandbox and production credentials supplied through an approved secret
  manager:

Gate: no real payment is activated by changing the demo bank number. A
buyer-specific ADR and security review are mandatory.

## 6. Email, SMS, And Marketing

- Approved sender domain and provider accounts:
- Transactional templates and languages:
- Consent, unsubscribe, suppression, bounce, complaint, and retention rules:
- SMS sender approval and supported countries:
- Marketing platform and lawful consent source:

Gate: application templates do not prove provider deliverability or marketing
consent.

## 7. Hosting And Operations

- Buyer-owned GitHub, Vercel, Supabase, DNS, email/SMS, and monitoring accounts:
- Environments: development, preview/staging, production:
- Data residency, backup, restore-time, uptime, and support expectations:
- Incident contacts and response hours:
- Expected traffic, catalog size, concurrency, and load-test target:
- Release approval and rollback owner:
- Ongoing maintenance, dependency, security, and provider cost owner:

Gate: transfer production ownership to buyer-controlled accounts before the
commercial handoff is considered complete.

## 8. Acceptance

- Named buyer approver:
- Agreed browsers/devices:
- Required UAT journeys:
- Data reconciliation thresholds:
- Performance and accessibility targets:
- Security checks:
- Launch/rollback decision process:
- Post-launch warranty or support period:

No acceptance item should be phrased as “works like the demo.” Each must name
the exact environment, data, action, expected result, and evidence.
