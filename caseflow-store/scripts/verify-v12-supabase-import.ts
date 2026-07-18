import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import canonicalManifestJson from "../src/data/books/v1.2-canonical-manifest.json";
import coverManifestJson from "../src/data/books/v1.2-cover-portfolio-manifest.json";
import editorialManifestJson from "../src/data/books/v1.2-editorial-metadata-manifest.json";
import merchandisingManifestJson from "../src/data/books/v1.2-merchandising-rules-manifest.json";
import { caseflowBooksSeed } from "../src/data/books/seed";
import { canonicalCatalogManifestSchema } from "../src/lib/validation/canonical-catalog";
import { coverPipelineManifestSchema } from "../src/lib/validation/cover-assets";
import { editorialMetadataManifestSchema } from "../src/lib/validation/editorial-metadata";
import { merchandisingManifestSchema } from "../src/lib/validation/merchandising";

type Row = Record<string, unknown>;

const TASK_ID = "V12-T11";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t11");
const REPORT_PATH = path.join(ARTIFACT_DIR, "post-migration-supabase-check.json");
const MARKDOWN_PATH = path.join(ARTIFACT_DIR, "post-migration-supabase-check.md");
const BACKUP_MANIFEST_PATH = path.join(
  ARTIFACT_DIR,
  "pre-migration-backup-manifest.json",
);
const PLACEHOLDER_PATH = "/images/books/placeholders/book-cover-placeholder.svg";
const RETIRED_ELEMENTS_WORK_ID = "00000000-0000-4000-8000-000000002049";
const RETIRED_ELEMENTS_EDITION_IDS = [
  "00000000-0000-4000-8000-000000003049",
  "00000000-0000-4000-8000-000000004049",
];
const UNCHANGED_TABLES = [
  "categories",
  "products",
  "profiles",
  "orders",
  "order_items",
  "customer_addresses",
  "book_promotions",
  "book_inventory_adjustments",
];

loadEnvConfig(process.cwd());

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});
const anonClient = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

const canonicalManifest = canonicalCatalogManifestSchema.parse(canonicalManifestJson);
const coverManifest = coverPipelineManifestSchema.parse(coverManifestJson);
const editorialManifest = editorialMetadataManifestSchema.parse(editorialManifestJson);
const merchandisingManifest = merchandisingManifestSchema.parse(
  merchandisingManifestJson,
);

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const [
    works,
    editions,
    covers,
    workAuthors,
    workCategories,
    editionTranslators,
    provenance,
    quality,
    compatibility,
    shelves,
    shelfItems,
    publishers,
    unchangedCounts,
    anonChecks,
  ] = await Promise.all([
    readAllRows("book_works"),
    readAllRows("book_editions"),
    readAllRows("book_cover_assets"),
    readAllRows("book_work_authors"),
    readAllRows("book_work_categories"),
    readAllRows("book_edition_translators"),
    readAllRows("book_catalog_provenance_records"),
    readAllRows("book_content_quality_checks"),
    readAllRows("book_catalog_compatibility"),
    readAllRows("book_merchandising_shelves"),
    readAllRows("book_merchandising_shelf_items"),
    readAllRows("book_publishers"),
    countTables(UNCHANGED_TABLES),
    readAnonChecks(),
  ]);

  const report = buildReport({
    works,
    editions,
    covers,
    workAuthors,
    workCategories,
    editionTranslators,
    provenance,
    quality,
    compatibility,
    shelves,
    shelfItems,
    publishers,
    unchangedCounts,
    anonChecks,
  });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MARKDOWN_PATH, renderMarkdown(report));

  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        artifact: REPORT_PATH,
        active: report.counts.active,
        pass: report.pass,
      },
      null,
      2,
    ),
  );

  if (!report.ok) {
    process.exitCode = 1;
  }
}

function buildReport(input: {
  works: Row[];
  editions: Row[];
  covers: Row[];
  workAuthors: Row[];
  workCategories: Row[];
  editionTranslators: Row[];
  provenance: Row[];
  quality: Row[];
  compatibility: Row[];
  shelves: Row[];
  shelfItems: Row[];
  publishers: Row[];
  unchangedCounts: Record<string, number>;
  anonChecks: Awaited<ReturnType<typeof readAnonChecks>>;
}) {
  const expected = buildExpected();
  const backupCounts = readBackupCounts();
  const coverById = new Map(input.covers.map((cover) => [String(cover.id), cover]));
  const workById = new Map(input.works.map((work) => [String(work.id), work]));
  const editionById = new Map(
    input.editions.map((edition) => [String(edition.id), edition]),
  );
  const activeWorks = input.works.filter((work) => work.is_active === true);
  const activeEditions = input.editions.filter(
    (edition) => edition.is_active === true,
  );
  const activeWorkIds = new Set(activeWorks.map((work) => String(work.id)));
  const activeEditionIds = new Set(activeEditions.map((edition) => String(edition.id)));
  const activeWorkAuthorRows = input.workAuthors.filter((row) =>
    activeWorkIds.has(String(row.work_id)),
  );
  const activeWorkCategoryRows = input.workCategories.filter((row) =>
    activeWorkIds.has(String(row.work_id)),
  );
  const activeEditionTranslatorRows = input.editionTranslators.filter((row) =>
    activeEditionIds.has(String(row.edition_id)),
  );
  const activeEditionCoverPaths = activeEditions.map((edition) => {
    const cover = coverById.get(String(edition.cover_asset_id));
    return typeof cover?.path === "string" ? cover.path : null;
  });
  const retiredWork = workById.get(RETIRED_ELEMENTS_WORK_ID);
  const retiredEditions = RETIRED_ELEMENTS_EDITION_IDS.map((id) =>
    editionById.get(id),
  );
  const activePublisherNames = activeEditions
    .map((edition) => {
      const publisher = input.publishers.find(
        (row) => row.id === edition.publisher_id,
      );
      return typeof publisher?.name === "string" ? publisher.name : null;
    })
    .filter((name): name is string => name !== null);
  const publisherDisplayFacts = activeEditions.flatMap((edition) =>
    displayFacts(edition).filter((fact) => fact.key === "publisher"),
  );
  const isbnDisplayFacts = activeEditions.flatMap((edition) =>
    displayFacts(edition).filter((fact) => fact.key === "isbn"),
  );
  const orphanChecks = {
    activeEditionsMissingActiveWork: activeEditions.filter(
      (edition) => !activeWorkIds.has(String(edition.work_id)),
    ).length,
    activeEditionsMissingCover: activeEditions.filter(
      (edition) => !coverById.has(String(edition.cover_asset_id)),
    ).length,
    activeWorksWithoutAuthor: activeWorks.filter(
      (work) => !activeWorkAuthorRows.some((row) => row.work_id === work.id),
    ).length,
    activeWorksWithoutCategory: activeWorks.filter(
      (work) => !activeWorkCategoryRows.some((row) => row.work_id === work.id),
    ).length,
    merchandisingItemsMissingShelf: input.shelfItems.filter(
      (item) => !input.shelves.some((shelf) => shelf.id === item.shelf_id),
    ).length,
    merchandisingItemsMissingActiveEdition: input.shelfItems.filter(
      (item) => !activeEditionIds.has(String(item.edition_id)),
    ).length,
  };
  const pairChecks = activeEditions.map((edition) => {
    const paired = editionById.get(String(edition.paired_edition_id));
    return {
      id: edition.id,
      ok:
        paired !== undefined &&
        paired.is_active === true &&
        paired.paired_edition_id === edition.id &&
        paired.pair_id === edition.pair_id,
    };
  });
  const localCoverFileChecks = coverManifest.assets.map((asset) => ({
    id: asset.id,
    path: asset.path,
    exists: fs.existsSync(path.join("public", asset.path)),
    dbPathMatches: coverById.get(asset.id)?.path === asset.path,
  }));
  const unchangedTableMatches = Object.fromEntries(
    UNCHANGED_TABLES.map((table) => [
      table,
      backupCounts[table] === undefined
        ? false
        : backupCounts[table] === input.unchangedCounts[table],
    ]),
  ) as Record<string, boolean>;
  const pass = {
    activeWorksMatchCanonical:
      activeWorks.length === canonicalManifest.works.length &&
      setEquals(activeWorkIds, expected.workIds),
    activeEditionsMatchCanonical:
      activeEditions.length === canonicalManifest.editions.length &&
      setEquals(activeEditionIds, expected.editionIds),
    activeLanguageCounts:
      activeEditions.filter((edition) => edition.language === "en").length === 50 &&
      activeEditions.filter((edition) => edition.language === "vi").length === 50,
    retiredElementsInactive:
      retiredWork?.is_active === false &&
      retiredEditions.every((edition) => edition?.is_active === false),
    primaryCoversNoPlaceholder:
      activeEditionCoverPaths.length === canonicalManifest.editions.length &&
      activeEditionCoverPaths.every(
        (coverPath) =>
          coverPath !== null &&
          coverPath !== PLACEHOLDER_PATH &&
          coverPath.startsWith("/images/books/v12-covers/"),
      ),
    coverRowsMatchManifest: localCoverFileChecks.every(
      (check) => check.exists && check.dbPathMatches,
    ),
    provenanceCount: input.provenance.length === expected.provenanceRecords,
    qualityCount: input.quality.length === expected.qualityChecks,
    compatibilityCount: input.compatibility.length === canonicalManifest.compatibility.length,
    merchandisingShelves:
      input.shelves.length === merchandisingManifest.shelves.length &&
      input.shelves.filter((shelf) => shelf.is_active === true).length ===
        merchandisingManifest.shelves.filter((shelf) => shelf.isActive).length,
    merchandisingItems: input.shelfItems.length === expected.merchandisingManualItems,
    activeRelationshipsMatchManifest:
      activeWorkAuthorRows.length === expected.workAuthorRows &&
      activeWorkCategoryRows.length === expected.workCategoryRows &&
      activeEditionTranslatorRows.length === expected.editionTranslatorRows,
    noOrphans: Object.values(orphanChecks).every((count) => count === 0),
    editionPairsReciprocal: pairChecks.every((pair) => pair.ok),
    sourceReviewApproved: activeEditions.every(
      (edition) => edition.source_review_status === "approved",
    ),
    isbnAndPublisherHygiene:
      activeEditions.every(
        (edition) =>
          edition.isbn13 === null ||
          (typeof edition.isbn13 === "string" &&
            /^(978|979)\d{10}$/.test(edition.isbn13)),
      ) &&
      activePublisherNames.every((name) => name.trim().toLowerCase() !== "vh") &&
      publisherDisplayFacts.every(
        (fact) => localizedValues(fact.value).every((value) => value !== "vh"),
      ) &&
      isbnDisplayFacts.every((fact) =>
        localizedValues(fact.value).every(
          (value) => value === "" || /^(978|979)\d{10}$/.test(value),
        ),
      ),
    unchangedTablesPreserved: Object.values(unchangedTableMatches).every(Boolean),
    anonCanReadActiveCatalog: input.anonChecks.activeEditionCount === 100,
    anonCannotReadInactiveElements: input.anonChecks.retiredElementsVisible === 0,
    anonMerchandisingRls:
      input.anonChecks.activeShelfCount ===
      merchandisingManifest.shelves.filter((shelf) => shelf.isActive).length,
    internalTablesBlockedForAnon:
      input.anonChecks.provenanceBlocked && input.anonChecks.qualityBlocked,
  };
  const ok = Object.values(pass).every(Boolean);

  return {
    taskId: TASK_ID,
    generatedAt: new Date().toISOString(),
    ok,
    pass,
    counts: {
      active: {
        works: activeWorks.length,
        editions: activeEditions.length,
        englishEditions: activeEditions.filter((edition) => edition.language === "en")
          .length,
        vietnameseEditions: activeEditions.filter(
          (edition) => edition.language === "vi",
        ).length,
      },
      tables: {
        book_cover_assets: input.covers.length,
        book_catalog_provenance_records: input.provenance.length,
        book_content_quality_checks: input.quality.length,
        book_catalog_compatibility: input.compatibility.length,
        book_merchandising_shelves: input.shelves.length,
        book_merchandising_shelf_items: input.shelfItems.length,
      },
      unchangedCounts: input.unchangedCounts,
    },
    expected,
    orphanChecks,
    pairFailures: pairChecks.filter((pair) => !pair.ok),
    coverFileFailures: localCoverFileChecks.filter(
      (check) => !check.exists || !check.dbPathMatches,
    ),
    unchangedTableMatches,
    anonChecks: input.anonChecks,
  };
}

function buildExpected() {
  const provenanceIds = new Set<string>();
  for (const edition of canonicalManifest.editions) {
    for (const fact of edition.provenance.facts) {
      provenanceIds.add(fact.provenance.id);
    }
  }
  for (const asset of coverManifest.assets) {
    provenanceIds.add(asset.provenance.id);
  }

  return {
    workIds: new Set(canonicalManifest.works.map((work) => work.id)),
    editionIds: new Set(canonicalManifest.editions.map((edition) => edition.id)),
    provenanceRecords: provenanceIds.size,
    qualityChecks: editorialManifest.editions.reduce(
      (count, edition) => count + edition.qualityEvidence.length,
      0,
    ),
    workAuthorRows: canonicalManifest.works.reduce(
      (count, work) => count + work.authors.length,
      0,
    ),
    workCategoryRows: canonicalManifest.works.reduce(
      (count, work) => count + work.categorySlugs.length,
      0,
    ),
    editionTranslatorRows: canonicalManifest.editions.reduce(
      (count, edition) => count + edition.bibliographic.translatorNames.length,
      0,
    ),
    merchandisingManualItems: merchandisingManifest.shelves.reduce(
      (count, shelf) => count + shelf.manualSlots.length,
      0,
    ),
    seedCatalogCounts: {
      categories: caseflowBooksSeed.categories.length,
      originalWorks: caseflowBooksSeed.works.length,
      originalEditions: caseflowBooksSeed.editions.length,
    },
  };
}

async function readAnonChecks() {
  const { count: activeEditionCount, error: editionError } = await anonClient
    .from("book_editions")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  if (editionError) {
    throw new Error(`Anon active edition check failed: ${editionError.message}`);
  }

  const { count: activeShelfCount, error: shelfError } = await anonClient
    .from("book_merchandising_shelves")
    .select("id", { count: "exact", head: true });
  if (shelfError) {
    throw new Error(`Anon merchandising shelf check failed: ${shelfError.message}`);
  }

  const { data: retiredRows, error: retiredError } = await anonClient
    .from("book_editions")
    .select("id")
    .in("id", RETIRED_ELEMENTS_EDITION_IDS);
  if (retiredError) {
    throw new Error(`Anon retired edition check failed: ${retiredError.message}`);
  }

  const provenanceResult = await anonClient
    .from("book_catalog_provenance_records")
    .select("id")
    .limit(1);
  const qualityResult = await anonClient
    .from("book_content_quality_checks")
    .select("id")
    .limit(1);

  return {
    activeEditionCount: activeEditionCount ?? 0,
    activeShelfCount: activeShelfCount ?? 0,
    retiredElementsVisible: retiredRows?.length ?? 0,
    provenanceBlocked: Boolean(provenanceResult.error),
    qualityBlocked: Boolean(qualityResult.error),
    provenanceError: provenanceResult.error?.message ?? null,
    qualityError: qualityResult.error?.message ?? null,
  };
}

async function readAllRows(table: string) {
  const pageSize = 1_000;
  const rows: Row[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await serviceClient.from(table).select("*").range(from, to);
    if (error) {
      throw new Error(`Read failed for ${table}: ${error.message}`);
    }

    const page = (data ?? []) as Row[];
    rows.push(...page);
    if (page.length < pageSize) {
      break;
    }
  }

  return rows;
}

async function countTables(tables: string[]) {
  const entries = await Promise.all(
    tables.map(async (table) => [table, await countTable(table)] as const),
  );
  return Object.fromEntries(entries) as Record<string, number>;
}

async function countTable(table: string) {
  const { count, error } = await serviceClient
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(`Count failed for ${table}: ${error.message}`);
  }
  return count ?? 0;
}

function readBackupCounts() {
  if (!fs.existsSync(BACKUP_MANIFEST_PATH)) {
    return {} as Record<string, number>;
  }

  const manifest = JSON.parse(fs.readFileSync(BACKUP_MANIFEST_PATH, "utf8")) as {
    rowsByTable?: Record<string, number>;
    tables?: Array<{ table: string; rows: number }>;
  };
  if (manifest.rowsByTable) {
    return manifest.rowsByTable;
  }
  return Object.fromEntries(
    (manifest.tables ?? []).map((table) => [table.table, table.rows]),
  );
}

function displayFacts(edition: Row) {
  if (!Array.isArray(edition.display_facts)) {
    return [] as Array<{ key: string; value: unknown }>;
  }
  return edition.display_facts.filter(isDisplayFact);
}

function isDisplayFact(value: unknown): value is { key: string; value: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "key" in value &&
    typeof (value as { key: unknown }).key === "string" &&
    "value" in value
  );
}

function localizedValues(value: unknown) {
  if (typeof value === "object" && value !== null) {
    return Object.values(value)
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim().toLowerCase());
  }
  if (typeof value === "string") {
    return [value.trim().toLowerCase()];
  }
  return [];
}

function setEquals(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) {
    return false;
  }
  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }
  return true;
}

function renderMarkdown(report: ReturnType<typeof buildReport>) {
  return [
    "# V12-T11 Supabase Import Verification",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `- Overall: ${report.ok ? "passed" : "failed"}`,
    `- Active works: ${report.counts.active.works}`,
    `- Active editions: ${report.counts.active.editions}`,
    `- English editions: ${report.counts.active.englishEditions}`,
    `- Vietnamese editions: ${report.counts.active.vietnameseEditions}`,
    `- Provenance records: ${report.counts.tables.book_catalog_provenance_records}`,
    `- Content-quality checks: ${report.counts.tables.book_content_quality_checks}`,
    `- Merchandising shelves: ${report.counts.tables.book_merchandising_shelves}`,
    `- Merchandising manual items: ${report.counts.tables.book_merchandising_shelf_items}`,
    "",
    "## Pass Matrix",
    "",
    ...Object.entries(report.pass).map(
      ([key, value]) => `- ${key}: ${value ? "pass" : "fail"}`,
    ),
    "",
  ].join("\n");
}

function requiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
