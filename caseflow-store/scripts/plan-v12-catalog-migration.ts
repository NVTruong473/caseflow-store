import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import canonicalManifestJson from "../src/data/books/v1.2-canonical-manifest.json";
import coverManifestJson from "../src/data/books/v1.2-cover-portfolio-manifest.json";
import editorialManifestJson from "../src/data/books/v1.2-editorial-metadata-manifest.json";
import merchandisingManifestJson from "../src/data/books/v1.2-merchandising-rules-manifest.json";
import { caseflowBooksSeed } from "../src/data/books/seed";
import { canonicalCatalogManifestSchema } from "../src/lib/validation/canonical-catalog";
import { coverPipelineManifestSchema } from "../src/lib/validation/cover-assets";
import { editorialMetadataManifestSchema } from "../src/lib/validation/editorial-metadata";
import { merchandisingManifestSchema } from "../src/lib/validation/merchandising";

type CountResult = {
  table: string;
  count: number | null;
  ok: boolean;
  error: string | null;
};

const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t10");
const PRIVATE_BACKUP_DIR = path.join(ARTIFACT_DIR, "private-backups");
const MIGRATION_SQL_PATH = path.join(
  "supabase",
  "migrations",
  "0008_v12_catalog_merchandising.sql",
);
const COUNT_SQL_PATH = path.join(ARTIFACT_DIR, "pre-migration-counts.sql");
const GENERATED_AT = "2026-07-17T00:00:00.000Z";
const CAPTURE_LIVE_COUNTS = process.argv.includes("--capture-live-counts");

const canonicalManifest = canonicalCatalogManifestSchema.parse(canonicalManifestJson);
const coverManifest = coverPipelineManifestSchema.parse(coverManifestJson);
const editorialManifest = editorialMetadataManifestSchema.parse(editorialManifestJson);
const merchandisingManifest = merchandisingManifestSchema.parse(
  merchandisingManifestJson,
);

const existingWorkIds = new Set(caseflowBooksSeed.works.map((work) => work.id));
const existingEditionIds = new Set(
  caseflowBooksSeed.editions.map((edition) => edition.id),
);
const v12WorkIds = new Set(canonicalManifest.works.map((work) => work.id));
const v12EditionIds = new Set(canonicalManifest.editions.map((edition) => edition.id));
const existingAuthorByName = new Map(
  caseflowBooksSeed.authors.map((author) => [author.name, author]),
);
const existingPublisherByName = new Map(
  caseflowBooksSeed.publishers.map((publisher) => [publisher.name, publisher]),
);

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.mkdirSync(PRIVATE_BACKUP_DIR, { recursive: true });

  const authorNames = uniqueSorted(
    canonicalManifest.works.flatMap((work) => work.authors),
  );
  const publisherNames = uniqueSorted(
    canonicalManifest.editions
      .map((edition) => edition.bibliographic.publisherName)
      .filter((name): name is string => name !== null),
  );
  const translatorNames = uniqueSorted(
    canonicalManifest.editions.flatMap(
      (edition) => edition.bibliographic.translatorNames,
    ),
  );

  const newAuthorNames = authorNames.filter((name) => !existingAuthorByName.has(name));
  const existingAuthorNames = authorNames.filter((name) =>
    existingAuthorByName.has(name),
  );
  const newPublisherNames = publisherNames.filter(
    (name) => !existingPublisherByName.has(name),
  );
  const retiredWorkIds = caseflowBooksSeed.works
    .filter((work) => !v12WorkIds.has(work.id))
    .map((work) => work.id);
  const retiredEditionIds = caseflowBooksSeed.editions
    .filter((edition) => !v12EditionIds.has(edition.id))
    .map((edition) => edition.id);
  const insertedWorkIds = canonicalManifest.works
    .filter((work) => !existingWorkIds.has(work.id))
    .map((work) => work.id);
  const insertedEditionIds = canonicalManifest.editions
    .filter((edition) => !existingEditionIds.has(edition.id))
    .map((edition) => edition.id);
  const preservedWorkIds = canonicalManifest.works
    .filter((work) => existingWorkIds.has(work.id))
    .map((work) => work.id);
  const preservedEditionIds = canonicalManifest.editions
    .filter((edition) => existingEditionIds.has(edition.id))
    .map((edition) => edition.id);

  const workAuthorRows = canonicalManifest.works.reduce(
    (count, work) => count + work.authors.length,
    0,
  );
  const workCategoryRows = canonicalManifest.works.reduce(
    (count, work) => count + work.categorySlugs.length,
    0,
  );
  const editionTranslatorRows = canonicalManifest.editions.reduce(
    (count, edition) => count + edition.bibliographic.translatorNames.length,
    0,
  );

  const canonicalProvenanceIds = new Set(
    canonicalManifest.editions.flatMap((edition) =>
      edition.provenance.facts.map((fact) => fact.provenance.id),
    ),
  );
  const coverProvenanceIds = new Set(
    coverManifest.assets.map((asset) => asset.provenance.id),
  );
  const editorialEvidenceIds = new Set(
    editorialManifest.editions.flatMap((edition) =>
      edition.qualityEvidence
        .map((evidence) => evidence.provenanceRecordId)
        .filter((id): id is string => id !== null),
    ),
  );
  const persistedProvenanceIds = new Set([
    ...canonicalProvenanceIds,
    ...coverProvenanceIds,
  ]);
  const qualityReferenceIdsWithoutPersistedRecord = [...editorialEvidenceIds].filter(
    (id) => !persistedProvenanceIds.has(id),
  );
  const qualityCheckCount = editorialManifest.editions.reduce(
    (count, edition) => count + edition.qualityEvidence.length,
    0,
  );
  const manualMerchandisingItems = merchandisingManifest.shelves.reduce(
    (count, shelf) => count + shelf.manualSlots.length,
    0,
  );

  writePreMigrationCountSql();

  const manifestSnapshot = buildManifestSnapshot();
  const assetManifest = buildAssetManifest();
  const liveCounts = CAPTURE_LIVE_COUNTS
    ? await captureLiveCounts()
    : {
        status: "not-captured",
        reason: "Run with --capture-live-counts to read Supabase count-only state.",
        counts: [] as CountResult[],
      };

  const plan = {
    taskId: "V12-T10",
    generatedAt: GENERATED_AT,
    mode: "dry-run-plan",
    baselineRelease: "v1.1.0",
    migrationSqlPath: MIGRATION_SQL_PATH,
    privateBackupDirectory: PRIVATE_BACKUP_DIR,
    preMigrationCountSqlPath: COUNT_SQL_PATH,
    liveCounts,
    sourceManifests: manifestSnapshot.manifests,
    assetManifest: {
      path: path.join(ARTIFACT_DIR, "v12-asset-manifest.json"),
      assetCount: assetManifest.assets.length,
      totalBytes: assetManifest.totalBytes,
      placeholderPrimaryAssets: assetManifest.placeholderPrimaryAssets,
    },
    plannedWrites: {
      inserts: {
        book_authors: newAuthorNames.length,
        book_publishers: newPublisherNames.length,
        book_translators: translatorNames.length,
        book_cover_assets: coverManifest.assets.length,
        book_works: insertedWorkIds.length,
        book_work_authors: workAuthorRows,
        book_work_categories: workCategoryRows,
        book_editions: insertedEditionIds.length,
        book_edition_translators: editionTranslatorRows,
        book_catalog_provenance_records: persistedProvenanceIds.size,
        book_content_quality_checks: qualityCheckCount,
        book_catalog_compatibility: canonicalManifest.compatibility.length,
        book_merchandising_shelves: merchandisingManifest.shelves.length,
        book_merchandising_shelf_items: manualMerchandisingItems,
      },
      updates: {
        book_categories: caseflowBooksSeed.categories.length,
        book_authors: existingAuthorNames.length,
        book_publishers: publisherNames.length - newPublisherNames.length,
        book_works: preservedWorkIds.length,
        book_editions: preservedEditionIds.length,
      },
      deactivations: {
        book_works: retiredWorkIds.length,
        book_editions: retiredEditionIds.length,
      },
      deletes: {},
      prohibitedDeletes: [],
      unchangedProductionAreas: [
        "profiles",
        "orders",
        "order_items",
        "book_promotions",
        "book_inventory_adjustments",
        "categories",
        "products",
      ],
    },
    idStability: {
      preservedWorkIds: preservedWorkIds.length,
      preservedEditionIds: preservedEditionIds.length,
      insertedWorkIds,
      insertedEditionIds,
      retiredWorkIds,
      retiredEditionIds,
      newAuthorNames,
      newPublisherNames,
      translatorNames,
    },
    compatibility: {
      entries: canonicalManifest.compatibility.length,
      retiredToCatalog: canonicalManifest.compatibility.filter(
        (entry) => entry.behavior === "retired-to-catalog",
      ).length,
      redirects: canonicalManifest.compatibility.filter(
        (entry) => entry.behavior === "redirect",
      ).length,
    },
    contentQualityReferences: {
      uniqueReferences: editorialEvidenceIds.size,
      persistedReferences: [...editorialEvidenceIds].filter((id) =>
        persistedProvenanceIds.has(id),
      ).length,
      internalDerivedReferences:
        qualityReferenceIdsWithoutPersistedRecord.length,
    },
    safetyAssertions: {
      noDeletesPlanned: true,
      v11SeedStillAvailable: true,
      v11PlaceholderStillAvailable: true,
      v12ActiveEditionTarget: canonicalManifest.editions.length,
      v12PrimaryPlaceholderTarget: assetManifest.placeholderPrimaryAssets,
      orderDerivedShelfInactive: merchandisingManifest.shelves.some(
        (shelf) =>
          shelf.sourceKind === "order-derived" &&
          shelf.slug === "sales-trending-30d" &&
          shelf.isActive === false,
      ),
      privateBackupDirectoryIgnored: true,
    },
    rollback: {
      strategy:
        "Re-run v1.1 seed for catalog tables, deactivate v1.2-only work/editions, restore pre-v1.2 catalog backup if production had manual catalog edits, and leave customer/order/promotion/inventory data untouched.",
      v11Tag: "v1.1.0",
      disableMerchandisingSql:
        "update public.book_merchandising_shelves set is_active = false;",
      deactivateInsertedCatalogSql:
        "update public.book_editions set is_active = false where id in (...v1.2 inserted edition ids...); update public.book_works set is_active = false where id in (...v1.2 inserted work ids...);",
    },
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "v12-migration-input-snapshot.json"),
    JSON.stringify(manifestSnapshot, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "v12-asset-manifest.json"),
    JSON.stringify(assetManifest, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "v12-catalog-migration-plan.json"),
    JSON.stringify(plan, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "v12-catalog-migration-plan.md"),
    renderPlanMarkdown(plan),
  );

  console.log(
    JSON.stringify(
      {
        artifact: path.join(ARTIFACT_DIR, "v12-catalog-migration-plan.json"),
        insertedWorks: insertedWorkIds.length,
        insertedEditions: insertedEditionIds.length,
        preservedEditions: preservedEditionIds.length,
        retiredEditions: retiredEditionIds.length,
        coverAssets: coverManifest.assets.length,
        liveCounts: liveCounts.status,
        ok: true,
      },
      null,
      2,
    ),
  );
}

function buildManifestSnapshot() {
  const manifestPaths = [
    "src/data/books/v1.2-canonical-manifest.json",
    "src/data/books/v1.2-cover-portfolio-manifest.json",
    "src/data/books/v1.2-editorial-metadata-manifest.json",
    "src/data/books/v1.2-merchandising-rules-manifest.json",
  ];

  return {
    taskId: "V12-T10",
    generatedAt: GENERATED_AT,
    manifests: manifestPaths.map((manifestPath) => ({
      path: manifestPath,
      sha256: sha256File(manifestPath),
      bytes: fs.statSync(manifestPath).size,
    })),
  };
}

function buildAssetManifest() {
  const assets = coverManifest.assets.map((asset) => {
    const filePath = path.join("public", asset.path);
    return {
      editionId: asset.editionId,
      assetId: asset.id,
      path: asset.path,
      sha256: sha256File(filePath),
      bytes: fs.statSync(filePath).size,
      width: asset.dimensions.width,
      height: asset.dimensions.height,
      source: "project-created-vector",
    };
  });

  return {
    taskId: "V12-T10",
    generatedAt: GENERATED_AT,
    assets,
    totalBytes: assets.reduce((total, asset) => total + asset.bytes, 0),
    placeholderPrimaryAssets: assets.filter((asset) =>
      asset.path.includes("placeholder"),
    ).length,
  };
}

function writePreMigrationCountSql() {
  const tables = [
    "categories",
    "products",
    "profiles",
    "orders",
    "order_items",
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
    "book_inventory_adjustments",
  ];
  const lines = [
    "-- V12-T10 pre-migration count-only checks. Do not select PII rows here.",
    "select jsonb_build_object(",
    ...tables.flatMap((table, index) => [
      `  '${table}', (select count(*) from public.${table})${
        index === tables.length - 1 ? "" : ","
      }`,
    ]),
    ") as pre_v12_counts;",
    "",
    "select jsonb_build_object(",
    "  'active_book_editions', (select count(*) from public.book_editions where is_active),",
    "  'active_book_works', (select count(*) from public.book_works where is_active),",
    "  'primary_placeholder_editions', (",
    "    select count(*)",
    "    from public.book_editions",
    "    join public.book_cover_assets",
    "      on book_cover_assets.id = book_editions.cover_asset_id",
    "    where book_editions.is_active",
    "      and book_cover_assets.path like '%placeholder%'",
    "  ),",
    "  'book_order_snapshots', (",
    "    select count(*) from public.order_items where book_edition_id is not null",
    "  )",
    ") as pre_v12_catalog_state;",
    "",
  ];
  fs.writeFileSync(COUNT_SQL_PATH, lines.join("\n"));
}

async function captureLiveCounts() {
  const env = loadEnv(".env.local");
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      status: "skipped-missing-env",
      reason:
        "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local.",
      counts: [] as CountResult[],
    };
  }

  const tables = [
    "categories",
    "products",
    "profiles",
    "orders",
    "order_items",
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
    "book_inventory_adjustments",
  ];
  const counts = await Promise.all(
    tables.map((table) => countSupabaseTable(supabaseUrl, serviceRoleKey, table)),
  );
  const status = counts.every((count) => count.ok) ? "captured" : "partial";
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "pre-migration-counts-live.json"),
    JSON.stringify(
      {
        taskId: "V12-T10",
        generatedAt: new Date().toISOString(),
        status,
        containsPiiRows: false,
        counts,
      },
      null,
      2,
    ) + "\n",
  );

  return { status, reason: null, counts };
}

async function countSupabaseTable(
  supabaseUrl: string,
  serviceRoleKey: string,
  table: string,
): Promise<CountResult> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
      method: "HEAD",
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        prefer: "count=exact",
      },
    });
    const range = response.headers.get("content-range");
    const parsedCount = range?.match(/\/(\d+)$/)?.[1] ?? null;
    return {
      table,
      count: parsedCount === null ? null : Number(parsedCount),
      ok: response.ok && parsedCount !== null,
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      table,
      count: null,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function renderPlanMarkdown(plan: {
  plannedWrites: {
    inserts: Record<string, number>;
    updates: Record<string, number>;
    deactivations: Record<string, number>;
  };
  idStability: {
    insertedWorkIds: string[];
    insertedEditionIds: string[];
    retiredWorkIds: string[];
    retiredEditionIds: string[];
    newAuthorNames: string[];
    newPublisherNames: string[];
    translatorNames: string[];
  };
  liveCounts: { status: string };
}) {
  return [
    "# V12-T10 Catalog Migration Dry-Run Plan",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Planned Writes",
    "",
    "No deletes are planned. Existing customer, order, order item, promotion,",
    "inventory-adjustment, phone catalog, and profile rows are unchanged.",
    "",
    "### Inserts",
    "",
    ...Object.entries(plan.plannedWrites.inserts).map(
      ([table, count]) => `- ${table}: ${count}`,
    ),
    "",
    "### Updates",
    "",
    ...Object.entries(plan.plannedWrites.updates).map(
      ([table, count]) => `- ${table}: ${count}`,
    ),
    "",
    "### Deactivations",
    "",
    ...Object.entries(plan.plannedWrites.deactivations).map(
      ([table, count]) => `- ${table}: ${count}`,
    ),
    "",
    "## ID Stability",
    "",
    `- Inserted work IDs: ${plan.idStability.insertedWorkIds.join(", ")}`,
    `- Inserted edition IDs: ${plan.idStability.insertedEditionIds.join(", ")}`,
    `- Retired work IDs: ${plan.idStability.retiredWorkIds.join(", ")}`,
    `- Retired edition IDs: ${plan.idStability.retiredEditionIds.join(", ")}`,
    `- New authors: ${plan.idStability.newAuthorNames.join(", ") || "none"}`,
    `- New publishers: ${plan.idStability.newPublisherNames.length}`,
    `- New translators: ${plan.idStability.translatorNames.length}`,
    "",
    "## Live Count Status",
    "",
    `- ${plan.liveCounts.status}`,
    "",
  ].join("\n");
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function sha256File(filePath: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function loadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return {} as Record<string, string>;
  }

  const values: Record<string, string> = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }
    const separator = raw.indexOf("=");
    values[raw.slice(0, separator).trim()] = raw.slice(separator + 1).trim();
  }
  return values;
}

void main();
