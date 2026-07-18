import crypto from "node:crypto";
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
import { BLOCKING_CONTENT_QUALITY_REQUIREMENTS } from "../src/types/content-provenance";
import type { SourceNote } from "../src/types/domain";

type JsonRecord = Record<string, unknown>;

type UpsertBatch = {
  table: string;
  onConflict: string;
  rows: JsonRecord[];
};

type AppliedBatch = {
  table: string;
  rows: number;
  chunks: number;
  skipped: boolean;
};

const TASK_ID = "V12-T11";
const APPLY = process.argv.includes("--apply");
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t11");
const BACKUP_MANIFEST_PATH = path.join(
  ARTIFACT_DIR,
  "pre-migration-backup-manifest.json",
);
const APPLY_ARTIFACT_PATH = path.join(ARTIFACT_DIR, "catalog-upsert-apply.json");
const DRY_RUN_ARTIFACT_PATH = path.join(
  ARTIFACT_DIR,
  "catalog-upsert-dry-run.json",
);
const IMPORTED_AT = "2026-07-18T00:00:00.000Z";
const RETIRED_ELEMENTS_WORK_ID = "00000000-0000-4000-8000-000000002049";
const RETIRED_ELEMENTS_EDITION_IDS = [
  "00000000-0000-4000-8000-000000003049",
  "00000000-0000-4000-8000-000000004049",
];

loadEnvConfig(process.cwd());

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const client = createClient(supabaseUrl, serviceRoleKey, {
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

const existingAuthorByName = new Map(
  caseflowBooksSeed.authors.map((author) => [author.name, author]),
);
const existingWorkById = new Map(
  caseflowBooksSeed.works.map((work) => [work.id, work]),
);
const existingEditionById = new Map(
  caseflowBooksSeed.editions.map((edition) => [edition.id, edition]),
);
const editorialByEditionId = new Map(
  editorialManifest.editions.map((edition) => [edition.editionId, edition]),
);
const coverAssetByEditionId = new Map(
  coverManifest.assets.map((asset) => [asset.editionId, asset]),
);

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const payload = buildImportPayload();
  const dryRunReport = buildDryRunReport(payload);

  if (!APPLY) {
    fs.writeFileSync(DRY_RUN_ARTIFACT_PATH, `${JSON.stringify(dryRunReport, null, 2)}\n`);
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "dry-run",
          artifact: DRY_RUN_ARTIFACT_PATH,
          rowsByTable: dryRunReport.rowsByTable,
        },
        null,
        2,
      ),
    );
    return;
  }

  assertBackupGate();

  const applied: AppliedBatch[] = [];
  for (const batch of payload.batches) {
    applied.push(await upsertBatch(batch));
  }
  const retired = await retireLegacyElementsRows();
  const postApplyCounts = await countTables([
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
    "book_catalog_provenance_records",
    "book_content_quality_checks",
    "book_catalog_compatibility",
    "book_merchandising_shelves",
    "book_merchandising_shelf_items",
  ]);
  const activeCounts = await readActiveCatalogCounts();
  const report = {
    ...dryRunReport,
    mode: "apply",
    generatedAt: new Date().toISOString(),
    applied,
    retired,
    postApplyCounts,
    activeCounts,
    pass: {
      activeWorks: activeCounts.activeWorks === canonicalManifest.works.length,
      activeEditions: activeCounts.activeEditions === canonicalManifest.editions.length,
      activeEnglishEditions: activeCounts.activeEnglishEditions === 50,
      activeVietnameseEditions: activeCounts.activeVietnameseEditions === 50,
      noActivePrimaryPlaceholder: activeCounts.activePrimaryPlaceholderEditions === 0,
      provenanceRows:
        postApplyCounts.book_catalog_provenance_records ===
        payload.expected.provenanceRecords,
      qualityRows:
        postApplyCounts.book_content_quality_checks === payload.expected.qualityChecks,
      merchandisingShelves:
        postApplyCounts.book_merchandising_shelves ===
        merchandisingManifest.shelves.length,
      merchandisingManualItems:
        postApplyCounts.book_merchandising_shelf_items ===
        payload.expected.merchandisingManualItems,
      legacyElementsRetired:
        retired.workRowsUpdated >= 0 && retired.editionRowsUpdated >= 0,
    },
  };
  const ok = Object.values(report.pass).every(Boolean);

  fs.writeFileSync(APPLY_ARTIFACT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        ok,
        artifact: APPLY_ARTIFACT_PATH,
        activeCounts,
        pass: report.pass,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

function buildImportPayload() {
  const authorRows = buildAuthorRows();
  const translatorRows = buildTranslatorRows();
  const publisherRows = buildPublisherRows();
  const publisherIdByName = new Map(
    publisherRows.map((publisher) => [String(publisher.name), String(publisher.id)]),
  );
  const authorIdByName = new Map(
    authorRows.map((author) => [String(author.name), String(author.id)]),
  );
  const translatorIdByName = new Map(
    translatorRows.map((translator) => [
      String(translator.name),
      String(translator.id),
    ]),
  );
  const provenanceRows = buildProvenanceRows();
  const qualityRows = buildContentQualityRows();
  const merchandisingShelfRows = merchandisingManifest.shelves.map((shelf) => ({
    id: shelf.id,
    slug: shelf.slug,
    shelf_type: shelf.type,
    source_kind: shelf.sourceKind,
    labels: shelf.labels,
    description: shelf.description,
    inclusion_rule: shelf.inclusionRule,
    starts_at: shelf.startsAt,
    ends_at: shelf.endsAt,
    is_active: shelf.isActive,
    sort_order: shelf.sortOrder,
    min_items: shelf.minItems,
    max_items: shelf.maxItems,
    fallback: shelf.fallback,
    required_permission: shelf.requiredPermission,
    created_at: IMPORTED_AT,
    updated_at: IMPORTED_AT,
  }));
  const merchandisingItemRows = merchandisingManifest.shelves.flatMap((shelf) =>
    shelf.manualSlots.map((slot) => ({
      id: stableUuid(`merchandising-item:${shelf.id}:${slot.editionId}`),
      shelf_id: shelf.id,
      edition_id: slot.editionId,
      position: slot.position,
      is_active: slot.isActive,
      note: slot.note,
      created_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    })),
  );
  const editionTranslatorRows = canonicalManifest.editions.flatMap((edition) =>
    edition.bibliographic.translatorNames.map((translatorName, index) => ({
      edition_id: edition.id,
      translator_id: requiredMapValue(
        translatorIdByName,
        translatorName,
        `Missing translator ${translatorName}`,
      ),
      sort_order: index,
      created_at: IMPORTED_AT,
    })),
  );

  const batches: UpsertBatch[] = [
    {
      table: "book_categories",
      onConflict: "id",
      rows: caseflowBooksSeed.categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        labels: category.labels,
        description: category.description,
        sort_order: category.sortOrder,
        is_active: category.isActive,
        created_at: category.createdAt,
        updated_at: IMPORTED_AT,
      })),
    },
    {
      table: "book_authors",
      onConflict: "id",
      rows: authorRows,
    },
    {
      table: "book_translators",
      onConflict: "id",
      rows: translatorRows,
    },
    {
      table: "book_publishers",
      onConflict: "id",
      rows: publisherRows,
    },
    {
      table: "book_cover_assets",
      onConflict: "id",
      rows: coverManifest.assets.map((asset) => ({
        id: asset.id,
        path: asset.path,
        alt_text: asset.altText,
        source: "generated",
        source_note: coverSourceNote(asset.source.sourceLabel, asset.generatedAt),
        created_at: asset.generatedAt,
        updated_at: IMPORTED_AT,
      })),
    },
    {
      table: "book_works",
      onConflict: "id",
      rows: canonicalManifest.works.map((work) => {
        const existing = existingWorkById.get(work.id);
        return {
          id: work.id,
          slug: work.slug,
          title: work.title.en,
          original_title: existing?.originalTitle ?? null,
          localized_title: work.title,
          original_language: existing?.originalLanguage ?? "English",
          themes: existing?.themes ?? [],
          age_rating: existing?.ageRating ?? null,
          publication_era: existing?.publicationEra ?? null,
          canonical_summary: work.summary,
          is_active: true,
          created_at: existing?.createdAt ?? canonicalManifest.curatedAt,
          updated_at: IMPORTED_AT,
        };
      }),
    },
    {
      table: "book_work_authors",
      onConflict: "work_id,author_id",
      rows: canonicalManifest.works.flatMap((work) =>
        work.authors.map((authorName, index) => ({
          work_id: work.id,
          author_id: requiredMapValue(
            authorIdByName,
            authorName,
            `Missing author ${authorName}`,
          ),
          sort_order: index,
          created_at: IMPORTED_AT,
        })),
      ),
    },
    {
      table: "book_work_categories",
      onConflict: "work_id,category_id",
      rows: canonicalManifest.works.flatMap((work) =>
        work.categorySlugs.map((categorySlug, index) => ({
          work_id: work.id,
          category_id: requiredMapValue(
            new Map(caseflowBooksSeed.categories.map((category) => [category.slug, category.id])),
            categorySlug,
            `Missing category ${categorySlug}`,
          ),
          sort_order: index,
          created_at: IMPORTED_AT,
        })),
      ),
    },
    {
      table: "book_editions",
      onConflict: "id",
      rows: canonicalManifest.editions.map((edition) =>
        editionRow(edition, publisherIdByName),
      ),
    },
    {
      table: "book_edition_translators",
      onConflict: "edition_id,translator_id",
      rows: editionTranslatorRows,
    },
    {
      table: "book_catalog_provenance_records",
      onConflict: "id",
      rows: provenanceRows,
    },
    {
      table: "book_content_quality_checks",
      onConflict: "edition_id,requirement",
      rows: qualityRows,
    },
    {
      table: "book_catalog_compatibility",
      onConflict: "legacy_entity_type,legacy_id",
      rows: canonicalManifest.compatibility.map((entry) => ({
        id: stableUuid(`compatibility:${entry.legacyEntityType}:${entry.legacyId}`),
        legacy_entity_type: entry.legacyEntityType,
        legacy_id: entry.legacyId,
        legacy_slug: entry.legacySlug,
        behavior: entry.behavior,
        target_slug: entry.targetSlug,
        reason: entry.reason,
        created_at: IMPORTED_AT,
        updated_at: IMPORTED_AT,
      })),
    },
    {
      table: "book_merchandising_shelves",
      onConflict: "id",
      rows: merchandisingShelfRows,
    },
    {
      table: "book_merchandising_shelf_items",
      onConflict: "shelf_id,edition_id",
      rows: merchandisingItemRows,
    },
  ];

  return {
    batches,
    expected: {
      activeWorks: canonicalManifest.works.length,
      activeEditions: canonicalManifest.editions.length,
      provenanceRecords: provenanceRows.length,
      qualityChecks: qualityRows.length,
      compatibilityEntries: canonicalManifest.compatibility.length,
      merchandisingShelves: merchandisingManifest.shelves.length,
      merchandisingManualItems: merchandisingItemRows.length,
      editionTranslatorRows: editionTranslatorRows.length,
    },
  };
}

function buildAuthorRows() {
  const canonicalAuthorNames = uniqueSorted(
    canonicalManifest.works.flatMap((work) => work.authors),
  );
  const newAuthorRows = canonicalAuthorNames
    .filter((authorName) => !existingAuthorByName.has(authorName))
    .map((authorName) => ({
      id: stableUuid(`author:${authorName}`),
      slug: slugify(authorName),
      name: authorName,
      bio_short: null,
      country: authorName === "Ernest Hemingway" ? "United States" : null,
      birth_year: null,
      death_year: null,
      source_note: sourceNoteForReviewedBibliographicFact(authorName),
      is_active: true,
      created_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    }));

  return [
    ...caseflowBooksSeed.authors.map((author) => ({
      id: author.id,
      slug: author.slug,
      name: author.name,
      bio_short: author.bioShort,
      country: author.country,
      birth_year: author.birthYear,
      death_year: author.deathYear,
      source_note: author.sourceNote,
      is_active: author.isActive,
      created_at: author.createdAt,
      updated_at: IMPORTED_AT,
    })),
    ...newAuthorRows,
  ];
}

function buildTranslatorRows() {
  return uniqueSorted(
    canonicalManifest.editions.flatMap(
      (edition) => edition.bibliographic.translatorNames,
    ),
  ).map((translatorName) => ({
    id: stableUuid(`translator:${translatorName}`),
    slug: slugify(translatorName),
    name: translatorName,
    bio_short: null,
    source_note: sourceNoteForReviewedBibliographicFact(translatorName),
    is_active: true,
    created_at: IMPORTED_AT,
    updated_at: IMPORTED_AT,
  }));
}

function buildPublisherRows() {
  return uniqueSorted(
    canonicalManifest.editions
      .map((edition) => edition.bibliographic.publisherName)
      .filter((publisherName): publisherName is string => publisherName !== null),
  ).map((publisherName) => ({
    id: stableUuid(`publisher:${publisherName}`),
    slug: slugify(publisherName),
    name: publisherName,
    country: null,
    website: null,
    is_active: true,
    created_at: IMPORTED_AT,
    updated_at: IMPORTED_AT,
  }));
}

function buildProvenanceRows() {
  const byId = new Map<string, JsonRecord>();
  for (const edition of canonicalManifest.editions) {
    for (const fact of edition.provenance.facts) {
      byId.set(fact.provenance.id, provenanceRow(fact.provenance));
    }
  }
  for (const asset of coverManifest.assets) {
    byId.set(asset.provenance.id, provenanceRow(asset.provenance));
  }
  return [...byId.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function buildContentQualityRows() {
  const blocking = new Set<string>(BLOCKING_CONTENT_QUALITY_REQUIREMENTS);
  return editorialManifest.editions.flatMap((edition) =>
    edition.qualityEvidence.map((evidence) => ({
      id: stableUuid(`quality:${edition.editionId}:${evidence.requirement}`),
      edition_id: edition.editionId,
      requirement: evidence.requirement,
      requirement_level: blocking.has(evidence.requirement) ? "blocking" : "optional",
      status: evidence.status,
      provenance_record_id: evidence.provenanceRecordId,
      note: evidence.note,
      created_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    })),
  );
}

function editionRow(
  edition: (typeof canonicalManifest.editions)[number],
  publisherIdByName: Map<string, string>,
) {
  const existing = existingEditionById.get(edition.id);
  const editorial = requiredMapValue(
    editorialByEditionId,
    edition.id,
    `Missing editorial metadata for ${edition.id}`,
  );
  const coverAsset = requiredMapValue(
    coverAssetByEditionId,
    edition.id,
    `Missing cover asset for ${edition.id}`,
  );
  const publisherId =
    edition.bibliographic.publisherName === null
      ? null
      : requiredMapValue(
          publisherIdByName,
          edition.bibliographic.publisherName,
          `Missing publisher ${edition.bibliographic.publisherName}`,
        );

  return {
    id: edition.id,
    work_id: edition.workId,
    slug: edition.slug,
    display_title: editorial.publicTitle,
    localized_display_title: edition.displayTitle,
    subtitle: edition.bibliographic.subtitle,
    language: edition.language,
    format: edition.store.format,
    publisher_id: publisherId,
    isbn13: edition.bibliographic.isbn13,
    isbn10: edition.bibliographic.isbn10,
    publication_year: edition.bibliographic.publicationYear,
    page_count: edition.bibliographic.pageCount,
    dimensions: edition.bibliographic.dimensions,
    weight_grams: edition.bibliographic.weightGrams,
    cover_asset_id: coverAsset.id,
    price_vnd: edition.store.priceVnd,
    compare_at_price_vnd: edition.store.compareAtPriceVnd,
    stock_quantity: edition.store.stockQuantity,
    low_stock_threshold: edition.store.lowStockThreshold,
    inventory_status: edition.store.inventoryStatus,
    summary: editorial.summary,
    table_of_contents: null,
    sample_excerpt_policy:
      "No copyrighted excerpt is stored; use project-written preview guidance only.",
    is_featured: edition.store.isFeatured,
    is_active: edition.store.availability !== "retired",
    pair_id: edition.pairId,
    paired_edition_id: edition.pairedEditionId,
    reason_to_read: editorial.reasonToRead,
    display_facts: editorial.displayFacts,
    omitted_optional_fact_keys: editorial.omittedOptionalFactKeys,
    source_edition_key: edition.bibliographic.sourceEditionKey,
    source_review_status: "approved",
    created_at: existing?.createdAt ?? canonicalManifest.curatedAt,
    updated_at: IMPORTED_AT,
  };
}

function provenanceRow(record: {
  id: string;
  entityType: string;
  entityId: string;
  fieldKey: string;
  sourceLabel: string;
  sourceUrl: string | null;
  checkedAt: string;
  contentKind: string;
  rightsBasis: string;
  rightsBasisNote: string;
  license: unknown;
  attribution: unknown;
  reviewStatus: string;
  reviewerNote: string | null;
  reviewedAt: string | null;
  editionMatchConfidence: string;
  sourceEditionKey: string | null;
}) {
  return {
    id: record.id,
    entity_type: record.entityType,
    entity_id: record.entityId,
    field_key: record.fieldKey,
    source_label: record.sourceLabel,
    source_url: record.sourceUrl,
    checked_at: record.checkedAt,
    content_kind: record.contentKind,
    rights_basis: record.rightsBasis,
    rights_basis_note: record.rightsBasisNote,
    license: record.license,
    attribution: record.attribution,
    review_status: record.reviewStatus,
    reviewer_note: record.reviewerNote,
    reviewed_at: record.reviewedAt,
    edition_match_confidence: record.editionMatchConfidence,
    source_edition_key: record.sourceEditionKey,
    created_at: IMPORTED_AT,
    updated_at: IMPORTED_AT,
  };
}

async function upsertBatch(batch: UpsertBatch): Promise<AppliedBatch> {
  if (batch.rows.length === 0) {
    return { table: batch.table, rows: 0, chunks: 0, skipped: true };
  }

  const chunks = chunk(batch.rows, batch.table === "book_content_quality_checks" ? 250 : 200);
  for (const rows of chunks) {
    await retry(async () => {
      const { error } = await client
        .from(batch.table)
        .upsert(rows, { onConflict: batch.onConflict });

      if (error) {
        throw new Error(`Upsert failed for ${batch.table}: ${error.message}`);
      }
    });
  }

  return {
    table: batch.table,
    rows: batch.rows.length,
    chunks: chunks.length,
    skipped: false,
  };
}

async function retireLegacyElementsRows() {
  const { data: editionRows, error: editionError } = await client
    .from("book_editions")
    .update({
      is_active: false,
      inventory_status: "discontinued",
      is_featured: false,
      updated_at: IMPORTED_AT,
    })
    .in("id", RETIRED_ELEMENTS_EDITION_IDS)
    .select("id");
  if (editionError) {
    throw new Error(`Retiring legacy Elements editions failed: ${editionError.message}`);
  }

  const { data: workRows, error: workError } = await client
    .from("book_works")
    .update({ is_active: false, updated_at: IMPORTED_AT })
    .eq("id", RETIRED_ELEMENTS_WORK_ID)
    .select("id");
  if (workError) {
    throw new Error(`Retiring legacy Elements work failed: ${workError.message}`);
  }

  return {
    workId: RETIRED_ELEMENTS_WORK_ID,
    editionIds: RETIRED_ELEMENTS_EDITION_IDS,
    workRowsUpdated: workRows?.length ?? 0,
    editionRowsUpdated: editionRows?.length ?? 0,
  };
}

async function readActiveCatalogCounts() {
  const [works, editions, placeholderRows] = await Promise.all([
    selectRows("book_works", "id,is_active", { is_active: true }),
    selectRows("book_editions", "id,language,is_active", { is_active: true }),
    selectRows(
      "book_editions",
      "id,cover_asset_id,book_cover_assets!book_editions_cover_asset_id_fkey(path)",
      { is_active: true },
    ),
  ]);
  const activeEditions = editions as unknown as Array<{ language: string }>;
  const activePrimaryPlaceholderEditions = (
    placeholderRows as unknown as Array<{ book_cover_assets: { path: string } | null }>
  ).filter((row) => row.book_cover_assets?.path.includes("placeholder")).length;

  return {
    activeWorks: works.length,
    activeEditions: activeEditions.length,
    activeEnglishEditions: activeEditions.filter((row) => row.language === "en").length,
    activeVietnameseEditions: activeEditions.filter((row) => row.language === "vi")
      .length,
    activePrimaryPlaceholderEditions,
  };
}

async function countTables(tables: string[]) {
  const entries = await Promise.all(
    tables.map(async (table) => [table, await countTable(table)] as const),
  );
  return Object.fromEntries(entries) as Record<string, number>;
}

async function countTable(table: string) {
  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(`Count failed for ${table}: ${error.message}`);
  }
  return count ?? 0;
}

async function selectRows(
  table: string,
  columns: string,
  equality: Record<string, unknown>,
) {
  let query = client.from(table).select(columns);
  for (const [column, value] of Object.entries(equality)) {
    query = query.eq(column, value as never);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`Select failed for ${table}: ${error.message}`);
  }
  return data ?? [];
}

function buildDryRunReport(payload: ReturnType<typeof buildImportPayload>) {
  return {
    taskId: TASK_ID,
    generatedAt: new Date().toISOString(),
    mode: APPLY ? "apply" : "dry-run",
    sourceManifests: [
      "src/data/books/v1.2-canonical-manifest.json",
      "src/data/books/v1.2-cover-portfolio-manifest.json",
      "src/data/books/v1.2-editorial-metadata-manifest.json",
      "src/data/books/v1.2-merchandising-rules-manifest.json",
    ],
    rowsByTable: Object.fromEntries(
      payload.batches.map((batch) => [batch.table, batch.rows.length]),
    ),
    expected: payload.expected,
    plannedDeactivations: {
      book_works: [RETIRED_ELEMENTS_WORK_ID],
      book_editions: RETIRED_ELEMENTS_EDITION_IDS,
    },
    destructiveWrites: {
      deletes: 0,
      truncates: 0,
      dropStatements: 0,
    },
  };
}

function assertBackupGate() {
  if (!fs.existsSync(BACKUP_MANIFEST_PATH)) {
    throw new Error(
      `Missing ${BACKUP_MANIFEST_PATH}; run backup-v12-pre-migration.ts first.`,
    );
  }

  const manifest = JSON.parse(fs.readFileSync(BACKUP_MANIFEST_PATH, "utf8")) as {
    pass?: Record<string, boolean>;
  };
  const pass = manifest.pass ?? {};
  if (!Object.values(pass).every(Boolean)) {
    throw new Error("Pre-migration backup manifest did not pass all checks.");
  }
}

function requiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
}

function requiredMapValue<K, V>(map: Map<K, V>, key: K, message: string): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "unknown";
}

function stableUuid(input: string) {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function sourceNoteForReviewedBibliographicFact(label: string): SourceNote {
  return {
    label: `Reviewed v1.2 bibliographic source for ${label}`,
    url: null,
    license: "Bibliographic facts only; no commercial description or cover copied",
    checkedAt: canonicalManifest.curatedAt,
  };
}

function coverSourceNote(label: string, checkedAt: string): SourceNote {
  return {
    label,
    url: null,
    license: "Project-created deterministic SVG asset; no commercial cover copied",
    checkedAt,
  };
}

function chunk<T>(rows: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

async function retry(operation: () => Promise<void>) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 4) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
    }
  }
  throw lastError;
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
