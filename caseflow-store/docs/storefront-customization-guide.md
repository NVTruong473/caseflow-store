# Storefront Customization Guide

CaseFlow Books is the reference single-store implementation. Rebranding is a
reviewed build/deploy activity, not a runtime theme editor.

## Public Configuration

Set these build-time public values in local `.env.local`, preview, and
Production as appropriate:

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production | Reference Vercel URL | Canonical metadata, robots, sitemap, structured links |
| `NEXT_PUBLIC_STORE_NAME` | No | `CaseFlow Books` | Public store and merchant fallback name |
| `NEXT_PUBLIC_STORE_SHORT_MARK` | No | Derived initials | Compact header mark, 1–4 alphanumeric characters |
| `NEXT_PUBLIC_STORE_TAGLINE_EN` | No | `Bilingual bookstore` | English header tagline |
| `NEXT_PUBLIC_STORE_TAGLINE_VI` | No | `Nhà sách song ngữ` | Vietnamese header tagline |
| `NEXT_PUBLIC_STORE_SUPPORT_PHONE` | No | Hidden | Monitored public phone; invalid/unset values are omitted |
| `NEXT_PUBLIC_STORE_SUPPORT_EMAIL` | No | Hidden | Monitored public mailbox; invalid/unset values are omitted |
| `NEXT_PUBLIC_STORE_SUPPORT_HOURS_EN` | No | Reference hours | English support-hours display |
| `NEXT_PUBLIC_STORE_SUPPORT_HOURS_VI` | No | Reference hours | Vietnamese support-hours display |
| `NEXT_PUBLIC_STORE_LEGAL_NAME` | No | Store name | Copyright display only; not company-registration evidence |
| `NEXT_PUBLIC_STORE_COPYRIGHT_YEAR` | No | Current UTC year | Copyright display year |

The typed source of truth is `src/config/storefront.ts`. These variables are
public by design; never place credentials or private customer data in them.

## Brand Assets

Before replacing visual assets:

1. Confirm buyer ownership or license for logo, favicon, font, photography, and
   product media.
2. Supply raster dimensions and transparent/light/dark variants where needed.
3. Replace the favicon and review the compact short mark at mobile widths.
4. Preserve image dimensions/aspect constraints to avoid layout shift.
5. Run the metadata scanner and responsive screenshot checks.

Do not hide AI/provenance metadata in internal source records. Public image
files may be stripped of embedded generator metadata, while internal
provenance manifests must remain truthful.

## Design Tokens

The visual system is primarily in `src/app/globals.css` and documented in
`docs/style-guide.md`. Customize semantic tokens rather than recoloring every
component independently:

- background, surface, paper, foreground, and muted text;
- primary and hover states;
- trust, offer, discovery, translation, arrival, and operations accents;
- border, focus ring, radius, shadow, and spacing tokens.

After token changes, inspect homepage, catalog, detail, checkout, account,
policy, assistant, and admin/staff surfaces. A buyer logo or primary color is
not enough to declare the theme complete.

## Content And Policies

- Store identity and support details come from the shared configuration.
- Product/catalog content comes from Supabase.
- Policy structure is in `src/lib/policies/bookstore-policies.ts`.
- Bilingual UI copy remains source-controlled and reviewed.

Buyer-specific terms, privacy text, delivery promises, returns, tax statements,
and support commitments require buyer/legal approval. The reference policies
describe application behavior; they are not legal advice.

## Server-Only Configuration

Keep Supabase service keys, database URLs, payment secrets, notification
credentials, and test passwords out of public variables and Client
Components. `.env.example` documents the categories without containing real
values.

Real provider activation requires:

- buyer-owned provider account and contract;
- preview/sandbox verification;
- secret-manager configuration;
- webhook signature and idempotency tests;
- production lock review;
- rollback and incident runbook;
- buyer acceptance.

## Rebuild And Verify

```bash
npm install
npm run verify:productization-config
npm run lint
npm exec -- tsc --noEmit --pretty false
npm run build
npm run test:e2e
```

Also run the release/security scripts documented by the current release. Do
not reuse CaseFlow’s old screenshots as buyer acceptance evidence; capture the
buyer build at agreed viewports.
