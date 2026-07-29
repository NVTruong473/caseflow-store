import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const SOURCE_ROOT = process.cwd();
const OUTPUT_ROOT = path.resolve(SOURCE_ROOT, "..", "dist-public");
const OUTPUT_NAME = "dist-public";
const PUBLIC_RELEASE_VERSION = process.env.PUBLIC_RELEASE_VERSION ?? "1.18.3";
const execFileAsync = promisify(execFile);

const COPY_DIRECTORIES = ["public", "src", "supabase"];
const COPY_FILES = [
  "LICENSE",
  "eslint.config.mjs",
  "next-env.d.ts",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "postcss.config.mjs",
  "tsconfig.json",
];

const EXCLUDED_NAMES = new Set([
  ".DS_Store",
  "seed.sql",
]);

const EXCLUDED_RELATIVE_PATHS = new Set([
  "public/file.svg",
  "public/globe.svg",
  "public/next.svg",
  "public/vercel.svg",
  "public/window.svg",
  "src/data",
  "src/lib/repositories/mock-catalog.ts",
  "src/lib/repositories/mock-orders.ts",
]);

const CATALOG_TABLES = [
  "book_categories",
  "book_authors",
  "book_translators",
  "book_publishers",
  "book_cover_assets",
  "book_works",
  "book_work_authors",
  "book_work_categories",
  "book_editions",
  "book_edition_translators",
  "book_promotions",
  "book_catalog_provenance_records",
  "book_content_quality_checks",
  "book_catalog_compatibility",
  "book_merchandising_shelves",
  "book_merchandising_shelf_items",
];

const TEXT_ARRAY_COLUMNS = new Set([
  "book_editions.omitted_optional_fact_keys",
  "book_works.themes",
]);

const README = `# CaseFlow Books

CaseFlow Books is a bilingual Vietnamese/English bookstore and small-business
operations application. It combines customer discovery, account-based
checkout, order self-service, catalog operations, inventory visibility,
promotions, notifications, and role-aware administration in one deployable
Next.js application.

## Features

- 500 sellable book editions with Vietnamese and English discovery.
- Search, filters, categories, merchandising shelves, edition comparison, and
  direct \`Buy now\` checkout.
- Local cart with server-side price, stock, promotion, tax, shipping, and total
  validation.
- Customer authentication, profile, signup vouchers, order history, order
  tracking, and eligible cancellation.
- Official COD/bank-transfer order flow and an isolated cross-device QR
  experience for product demonstration.
- Admin and staff dashboards for orders, catalog, stock, promotions,
  customers, content quality, and notifications.
- Bilingual interface, responsive layouts, accessible focus behavior, SEO
  routes, security headers, and an opt-in product walkthrough.

## Tech stack

- Next.js 16 App Router
- React 19 and TypeScript
- Supabase Auth, PostgreSQL, Row Level Security, and server-side repositories
- Zod validation
- Tailwind CSS 4 through PostCSS
- QRCode for the isolated QR experience
- ESLint and TypeScript quality gates

## Architecture

The application is a layered modular monolith:

1. \`src/app\`: pages and Route Handler controllers.
2. \`src/features\` and \`src/components\`: product-specific and shared UI.
3. \`src/lib/services\`: application use cases and orchestration.
4. \`src/lib/validation\` and \`src/types\`: DTO, domain, and validation
   contracts.
5. \`src/lib/repositories\`: data-access boundaries.
6. Supabase PostgreSQL/Auth: persistence, identity, transactions, and RLS.

The browser never supplies trusted prices, totals, stock, roles, or final order
state. Mutating requests are validated on the server.

## Folder structure

\`\`\`text
.
├── public/                 Runtime images, book covers, and introduction media
├── src/
│   ├── app/                Pages, layouts, and API Route Handlers
│   ├── components/         Shared interface components
│   ├── config/             Storefront configuration
│   ├── data/               Catalog manifests used by application logic
│   ├── features/           Feature-owned UI and interactions
│   ├── lib/                Services, repositories, policies, and validation
│   └── types/              Domain and database contracts
├── supabase/
│   ├── migrations/         Ordered additive database migrations
│   ├── schema.sql          Base schema for a fresh Supabase project
│   └── catalog-seed.sql    Non-customer catalog and merchandising seed
├── .env.example            Safe environment-variable template
├── next.config.ts          Next.js and security-header configuration
├── package.json            Commands and dependencies
└── LICENSE                 Source-use terms
\`\`\`

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- A Supabase project

## Installation

\`\`\`bash
npm ci
cp .env.example .env.local
\`\`\`

Fill in the required Supabase values before starting the application.
The package does not include a mock database fallback. A reachable Supabase
project with the checked-in schema, migrations, and catalog seed is required
for storefront and commerce runtime checks.

## Environment variables

Required:

- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`
- \`CHECKOUT_EXPERIENCE_TOKEN_SECRET\` with at least 32 random characters
- \`OPERATIONS_PASSWORD_CHANGE_SECRET\`

Recommended for deployment:

- \`NEXT_PUBLIC_SITE_URL\`
- \`NEXT_PUBLIC_STORE_*\` identity and monitored support channels
- Notification provider values only after a provider and sender are approved

The checked-in template keeps external notifications and mock payment controls
disabled. Never expose server-only keys through \`NEXT_PUBLIC_*\`.

## Database setup

For a new Supabase project:

1. Run \`supabase/schema.sql\` in the Supabase SQL editor.
2. Run every file in \`supabase/migrations/\` in filename order.
3. Run \`supabase/catalog-seed.sql\`.
4. Create the first operator in Supabase Auth, then set the matching
   \`public.profiles.role\` to \`admin\` from a trusted SQL session.
5. Configure the Supabase Auth Site URL and redirect allowlist for the local and
   deployed application URLs.

\`catalog-seed.sql\` contains catalog and merchandising data only. It does not
contain customer accounts, orders, payments, notification deliveries, or
private authentication data.

## Running locally

\`\`\`bash
npm run dev
\`\`\`

Open \`http://localhost:3000\`.

## Docker usage

No Docker configuration is included. The application has no container-specific
runtime requirement; use the Node.js commands in this README or add a
deployment-owner Dockerfile with the same environment boundary.

## Build

\`\`\`bash
npm run lint
npm run typecheck
npm run build
npm run start
\`\`\`

## Production deployment

1. Create a production Supabase project and apply the database setup above.
2. Add all required environment variables to the deployment platform.
3. Set \`NEXT_PUBLIC_SITE_URL\` to the canonical HTTPS origin.
4. Keep \`PAYMENT_MODE=disabled\` and \`ENABLE_MOCK_PAYMENT=false\`.
5. Keep notification providers disabled until real credentials, sender
   approvals, monitoring, and incident handling are available.
6. Build with \`npm run build\` and start with \`npm run start\`.
7. Verify authentication redirects, RLS, checkout totals, operator roles,
   security headers, and customer/order isolation after deployment.

Vercel can deploy the project directly from the repository. Other Node.js
platforms can run the same production build.

## Testing

This clean source package keeps only the release gates needed by downstream
developers:

\`\`\`bash
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
\`\`\`

Runtime dependencies must pass the audit above. Development-only advisories
should be reviewed against the current Next.js/ESLint compatibility matrix;
do not apply a forced major downgrade or upgrade merely to hide an audit
warning.

Before commercial launch, add organization-specific component and end-to-end
tests for the configured catalog, authentication, payments, notifications, and
deployment environment.

## Operational and legal boundary

The included QR experience does not settle real funds. A commercial deployment
requires the buyer's merchant identity, payment provider, notification sender,
legal policies, catalog rights review, observability, backup/restore process,
and operating runbooks.

Book-cover images and bibliographic references may originate from third-party
or public-domain sources. The deployment owner must verify rights, attribution,
territory, and edition matching before commercial use.

## License

This repository is source-available under the proprietary terms in
\`LICENSE\`. Access does not grant commercial deployment, resale,
redistribution, or sublicensing rights. Obtain a written agreement from the
copyright owner for those rights. Third-party packages and assets retain their
own licenses and terms.
`;

const ENV_EXAMPLE = `# Required public Supabase values
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Required server-only Supabase value
SUPABASE_SERVICE_ROLE_KEY=

# Canonical HTTPS origin and storefront identity
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STORE_NAME=CaseFlow Books
NEXT_PUBLIC_STORE_SHORT_MARK=CB
NEXT_PUBLIC_STORE_TAGLINE_EN=Bilingual bookstore
NEXT_PUBLIC_STORE_TAGLINE_VI=Nhà sách song ngữ
NEXT_PUBLIC_STORE_SUPPORT_PHONE=
NEXT_PUBLIC_STORE_SUPPORT_EMAIL=
NEXT_PUBLIC_STORE_SUPPORT_HOURS_EN=Mon-Sat, 09:00-18:00 ICT
NEXT_PUBLIC_STORE_SUPPORT_HOURS_VI=Thứ 2-Thứ 7, 09:00-18:00 ICT
NEXT_PUBLIC_STORE_LEGAL_NAME=CaseFlow Books
NEXT_PUBLIC_STORE_COPYRIGHT_YEAR=2026

# Authoritative VND display and optional English-mode USD estimate
CASEFLOW_FX_VND_PER_USD=26400
CASEFLOW_FX_SOURCE_LABEL=Deployment owner exchange-rate source
CASEFLOW_FX_SOURCE_URL=
CASEFLOW_FX_QUOTED_AT=
CASEFLOW_VAT_BASIS_POINTS=1000
CASEFLOW_INTL_PAYMENT_FEE_BASIS_POINTS=300

# Production-safe payment defaults
PAYMENT_MODE=disabled
ENABLE_MOCK_PAYMENT=false
CASEFLOW_MERCHANT_NAME=CaseFlow Books
DEMO_BANK_BIN=970436
DEMO_BANK_NAME=Demo bank
DEMO_BANK_ACCOUNT_NUMBER=0000000000
DEMO_BANK_ACCOUNT_NAME=
DEMO_PAYMENT_EXPIRES_MINUTES=15
MOCK_PAYMENT_WEBHOOK_SECRET=

# Isolated cross-device checkout experience
# Generate a random value of at least 32 characters.
CHECKOUT_EXPERIENCE_TOKEN_SECRET=
CHECKOUT_EXPERIENCE_ACCOUNT_NUMBER=000000000000
CHECKOUT_EXPERIENCE_BANK_NAME=CASEFLOW EXPERIENCE
CHECKOUT_EXPERIENCE_EXPIRES_MINUTES=15

# Server-only operator password-change control
OPERATIONS_PASSWORD_CHANGE_SECRET=

# External notifications remain off until provider onboarding is complete.
NOTIFICATION_MODE=disabled
EMAIL_PROVIDER=disabled
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
SMS_PROVIDER=disabled
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_FROM=
OTP_HASH_SECRET=
NOTIFICATION_DISPATCH_SECRET=
`;

const GITIGNORE = `node_modules/
.next/
out/
build/
coverage/
.env*
!.env.example
.vercel/
*.tsbuildinfo
.DS_Store
npm-debug.log*
`;

async function main() {
  assertPublicReleaseVersion();
  assertSafeOutputPath();
  await fs.rm(OUTPUT_ROOT, { force: true, recursive: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });

  for (const directory of COPY_DIRECTORIES) {
    await copyDirectory(
      path.join(SOURCE_ROOT, directory),
      path.join(OUTPUT_ROOT, directory),
    );
  }

  for (const file of COPY_FILES) {
    await fs.copyFile(
      path.join(SOURCE_ROOT, file),
      path.join(OUTPUT_ROOT, file),
    );
  }

  await fs.rm(path.join(OUTPUT_ROOT, "supabase", "seed.sql"), {
    force: true,
  });
  await writePublicPackageManifest();
  await normalizePublicPackageLock();
  await fs.writeFile(path.join(OUTPUT_ROOT, "README.md"), README, "utf8");
  await fs.writeFile(path.join(OUTPUT_ROOT, ".env.example"), ENV_EXAMPLE, "utf8");
  await fs.writeFile(path.join(OUTPUT_ROOT, ".gitignore"), GITIGNORE, "utf8");
  await writeCatalogSeed();
  await assertExportShape();

  const files = await listFiles(OUTPUT_ROOT);
  console.log(
    JSON.stringify(
      {
        fileCount: files.length,
        output: OUTPUT_ROOT,
        status: "PASS",
      },
      null,
      2,
    ),
  );
}

function assertSafeOutputPath() {
  if (
    path.basename(OUTPUT_ROOT) !== OUTPUT_NAME ||
    path.dirname(OUTPUT_ROOT) !== path.dirname(SOURCE_ROOT)
  ) {
    throw new Error(`Unsafe public export path: ${OUTPUT_ROOT}`);
  }
}

function assertPublicReleaseVersion() {
  if (!/^\d+\.\d+\.\d+$/.test(PUBLIC_RELEASE_VERSION)) {
    throw new Error(
      `PUBLIC_RELEASE_VERSION must be a stable semantic version, received ${PUBLIC_RELEASE_VERSION}`,
    );
  }
}

async function copyDirectory(source, destination) {
  const sourceRelative = path
    .relative(SOURCE_ROOT, source)
    .replaceAll(path.sep, "/");
  if (EXCLUDED_RELATIVE_PATHS.has(sourceRelative)) {
    return;
  }

  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDED_NAMES.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    const entryRelative = path
      .relative(SOURCE_ROOT, sourcePath)
      .replaceAll(path.sep, "/");

    if (EXCLUDED_RELATIVE_PATHS.has(entryRelative)) {
      continue;
    }

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, destinationPath);
    }
  }
}

async function writePublicPackageManifest() {
  const packagePath = path.join(OUTPUT_ROOT, "package.json");
  const packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"));

  packageJson.name = "caseflow-books";
  packageJson.version = PUBLIC_RELEASE_VERSION;
  packageJson.private = true;
  packageJson.license = "UNLICENSED";
  packageJson.scripts = {
    dev: "next dev",
    build: "next build",
    start: "next start",
    lint: "eslint",
    typecheck: "next typegen && tsc --noEmit",
  };
  delete packageJson.devDependencies["@playwright/test"];
  delete packageJson.devDependencies["@types/pg"];
  delete packageJson.devDependencies.pg;

  await fs.writeFile(
    packagePath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
    "utf8",
  );
}

async function normalizePublicPackageLock() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

  await execFileAsync(
    npmCommand,
    [
      "install",
      "--package-lock-only",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefer-offline",
    ],
    {
      cwd: OUTPUT_ROOT,
      env: {
        ...process.env,
        npm_config_update_notifier: "false",
      },
    },
  );

  const packageJson = JSON.parse(
    await fs.readFile(path.join(OUTPUT_ROOT, "package.json"), "utf8"),
  );
  const packageLock = JSON.parse(
    await fs.readFile(path.join(OUTPUT_ROOT, "package-lock.json"), "utf8"),
  );
  const lockRoot = packageLock.packages?.[""];

  if (
    packageLock.name !== packageJson.name ||
    packageLock.version !== packageJson.version ||
    lockRoot?.name !== packageJson.name ||
    lockRoot?.version !== packageJson.version
  ) {
    throw new Error("Public package-lock metadata does not match package.json");
  }
}

async function writeCatalogSeed() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const rawTables = {};

  for (const table of CATALOG_TABLES) {
    rawTables[table] = await readAllRows(supabaseUrl, serviceRoleKey, table);
  }

  const publicTables = selectPublicCatalogRows(rawTables);
  const sections = [
    "-- CaseFlow Books public catalog and merchandising seed.",
    "-- Contains no customer, authentication, order, payment, or delivery data.",
    `-- Active editions: ${publicTables.book_editions.length}.`,
    "begin;",
  ];
  const counts = {};

  for (const table of CATALOG_TABLES) {
    const rows = publicTables[table];
    counts[table] = rows.length;
    sections.push(renderInsert(table, rows));
  }

  sections.push("commit;", "");
  const seedPath = path.join(OUTPUT_ROOT, "supabase", "catalog-seed.sql");
  await fs.writeFile(seedPath, `${sections.filter(Boolean).join("\n\n")}\n`, "utf8");

  if (
    counts.book_editions !== 500 ||
    publicTables.book_editions.some((edition) => edition.is_active !== true)
  ) {
    throw new Error(
      `Expected 500 active public catalog editions, received ${counts.book_editions}`,
    );
  }
}

function selectPublicCatalogRows(tables) {
  const editions = tables.book_editions.filter((row) => row.is_active === true);
  const editionIds = new Set(editions.map((row) => row.id));
  const workIds = new Set(editions.map((row) => row.work_id));
  const works = tables.book_works.filter(
    (row) => row.is_active === true && workIds.has(row.id),
  );
  const activeWorkIds = new Set(works.map((row) => row.id));
  const workAuthors = tables.book_work_authors.filter((row) =>
    activeWorkIds.has(row.work_id),
  );
  const authorIds = new Set(workAuthors.map((row) => row.author_id));
  const workCategories = tables.book_work_categories.filter((row) =>
    activeWorkIds.has(row.work_id),
  );
  const categoryIds = new Set(workCategories.map((row) => row.category_id));
  const editionTranslators = tables.book_edition_translators.filter((row) =>
    editionIds.has(row.edition_id),
  );
  const translatorIds = new Set(
    editionTranslators.map((row) => row.translator_id),
  );
  const publisherIds = new Set(
    editions.map((row) => row.publisher_id).filter(Boolean),
  );
  const coverAssetIds = new Set(
    editions.map((row) => row.cover_asset_id).filter(Boolean),
  );
  const shelfRows = tables.book_merchandising_shelves.filter(
    (row) => row.is_active === true,
  );
  const shelfIds = new Set(shelfRows.map((row) => row.id));
  const entityIds = new Set([
    ...activeWorkIds,
    ...editionIds,
    ...authorIds,
    ...translatorIds,
    ...publisherIds,
    ...coverAssetIds,
  ]);

  return {
    book_categories: tables.book_categories.filter(
      (row) => row.is_active === true && categoryIds.has(row.id),
    ),
    book_authors: tables.book_authors.filter(
      (row) => row.is_active === true && authorIds.has(row.id),
    ),
    book_translators: tables.book_translators.filter(
      (row) => row.is_active === true && translatorIds.has(row.id),
    ),
    book_publishers: tables.book_publishers.filter(
      (row) => row.is_active === true && publisherIds.has(row.id),
    ),
    book_cover_assets: tables.book_cover_assets.filter((row) =>
      coverAssetIds.has(row.id),
    ),
    book_works: works,
    book_work_authors: workAuthors,
    book_work_categories: workCategories,
    book_editions: editions,
    book_edition_translators: editionTranslators,
    book_promotions: tables.book_promotions.filter(
      (row) => row.is_active === true,
    ),
    book_catalog_provenance_records:
      tables.book_catalog_provenance_records.filter((row) =>
        entityIds.has(row.entity_id),
      ),
    book_content_quality_checks: tables.book_content_quality_checks.filter(
      (row) => editionIds.has(row.edition_id),
    ),
    book_catalog_compatibility: tables.book_catalog_compatibility,
    book_merchandising_shelves: shelfRows,
    book_merchandising_shelf_items:
      tables.book_merchandising_shelf_items.filter(
        (row) =>
          row.is_active === true &&
          shelfIds.has(row.shelf_id) &&
          editionIds.has(row.edition_id),
      ),
  };
}

async function readAllRows(supabaseUrl, serviceRoleKey, table) {
  const pageSize = 1000;
  const rows = [];

  for (let offset = 0; ; offset += pageSize) {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${table}?select=*`,
      {
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          range: `${offset}-${offset + pageSize - 1}`,
          "x-client-info": "caseflow-public-export",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Catalog export failed for ${table}: ${response.status} ${await response.text()}`,
      );
    }

    const page = await response.json();
    rows.push(...page);
    if (page.length < pageSize) {
      return rows;
    }
  }
}

function renderInsert(table, rows) {
  if (rows.length === 0) {
    return `-- ${table}: no rows`;
  }

  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();
  const statements = [];

  for (let offset = 0; offset < rows.length; offset += 500) {
    const values = rows.slice(offset, offset + 500).map(
      (row) =>
        `  (${columns
          .map((column) => sqlLiteral(table, column, row[column]))
          .join(", ")})`,
    );
    statements.push(
      [
        `insert into public.${quoteIdentifier(table)} (${columns
          .map(quoteIdentifier)
          .join(", ")})`,
        "values",
        values.join(",\n"),
        "on conflict do nothing;",
      ].join("\n"),
    );
  }

  return statements.join("\n\n");
}

function sqlLiteral(table, column, value) {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid numeric value in ${table}.${column}`);
    }
    return String(value);
  }
  if (Array.isArray(value)) {
    if (TEXT_ARRAY_COLUMNS.has(`${table}.${column}`)) {
      return `array[${value.map((item) => quoteString(String(item))).join(", ")}]::text[]`;
    }
    return `${quoteString(JSON.stringify(value))}::jsonb`;
  }
  if (typeof value === "object") {
    return `${quoteString(JSON.stringify(value))}::jsonb`;
  }
  return quoteString(String(value));
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function quoteString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required export environment variable: ${name}`);
  }
  return value;
}

async function assertExportShape() {
  const files = await listFiles(OUTPUT_ROOT);
  const markdownFiles = files.filter((file) => file.endsWith(".md"));
  const forbiddenSegments = [
    "/.agent/",
    "/docs/",
    "/tests/",
    "/test-results/",
    "/playwright-report/",
    "/.vercel/",
    "/node_modules/",
  ];

  if (
    markdownFiles.length !== 1 ||
    markdownFiles[0] !== path.join(OUTPUT_ROOT, "README.md")
  ) {
    throw new Error(`Expected README.md as the only Markdown file`);
  }

  for (const file of files) {
    const normalized = `/${path.relative(OUTPUT_ROOT, file).replaceAll("\\", "/")}`;
    if (forbiddenSegments.some((segment) => normalized.includes(segment))) {
      throw new Error(`Forbidden path in public export: ${normalized}`);
    }
    if (path.basename(file) === ".env.local") {
      throw new Error("Local environment file was exported");
    }
  }
}

async function listFiles(directory) {
  const output = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await listFiles(entryPath)));
    } else if (entry.isFile()) {
      output.push(entryPath);
    }
  }

  return output.sort();
}

await main();
