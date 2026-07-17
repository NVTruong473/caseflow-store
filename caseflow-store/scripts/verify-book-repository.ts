import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import { caseflowBooksSeed } from "../src/data/books/seed";
import {
  listSupabaseBookCatalog,
  listSupabaseBookCategories,
  listSupabaseRelatedBookEditions,
  getSupabaseBookEditionBySlug,
} from "../src/lib/repositories/supabase-books";
import {
  mapBookCategoryRowToDomain,
  mapBookEditionRowToDomain,
  mapBookWorkRowToDomain,
} from "../src/lib/supabase/book-mappers";
import type { Database, TableRow } from "../src/types/supabase";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d25-t01");
const env = loadEnv(".env.local");
const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const anonClient = createClient<Database>(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const mapperChecks = runMapperChecks();
  const categories = await listSupabaseBookCategories({ client: anonClient });
  const allRecords = await listSupabaseBookCatalog(
    { sort: "title-asc" },
    { client: anonClient },
  );
  const englishRecords = await listSupabaseBookCatalog(
    { language: "en" },
    { client: anonClient },
  );
  const vietnameseRecords = await listSupabaseBookCatalog(
    { language: "vi" },
    { client: anonClient },
  );
  const classicRecords = await listSupabaseBookCatalog(
    { category: "classic-literature" },
    { client: anonClient },
  );
  const authorRecords = await listSupabaseBookCatalog(
    { author: "jane-austen" },
    { client: anonClient },
  );
  const searchRecords = await listSupabaseBookCatalog(
    { q: "Pride", sort: "title-asc" },
    { client: anonClient },
  );
  const pagedRecords = await listSupabaseBookCatalog(
    { limit: 10, offset: 10, sort: "title-asc" },
    { client: anonClient },
  );
  const detailSlug = getSeedDetailSlug();
  const detail = await getSupabaseBookEditionBySlug(detailSlug, {
    client: anonClient,
  });
  const relatedRecords = detail
    ? await listSupabaseRelatedBookEditions(
        detail.work.id,
        { excludeEditionId: detail.edition.id },
        { client: anonClient },
      )
    : [];
  const legacyProductsCount = await countPublicRows("products");

  const report = {
    generatedAt: new Date().toISOString(),
    mapperChecks,
    repositoryChecks: {
      categories: categories.length,
      totalRecords: allRecords.length,
      languageCounts: {
        en: englishRecords.length,
        vi: vietnameseRecords.length,
      },
      classicRecords: classicRecords.length,
      janeAustenRecords: authorRecords.length,
      prideSearchRecords: searchRecords.length,
      pageSizeAtOffset10: pagedRecords.length,
      detail: detail
        ? {
            slug: detail.edition.slug,
            workSlug: detail.work.slug,
            authors: detail.authors.map((author) => author.slug),
            categories: detail.categories.map((category) => category.slug),
            coverPath: detail.coverAsset?.path ?? null,
          }
        : null,
      relatedRecords: relatedRecords.map((record) => ({
        slug: record.edition.slug,
        language: record.edition.language,
        format: record.edition.format,
      })),
      legacyProductsCount,
    },
  };
  const pass = {
    validRowsAccepted: mapperChecks.validRowsAccepted,
    invalidPriceRejected: mapperChecks.invalidPriceRejected,
    invalidLanguageRejected: mapperChecks.invalidLanguageRejected,
    invalidStockRejected: mapperChecks.invalidStockRejected,
    categoryCountMatchesSeed: categories.length === caseflowBooksSeed.categories.length,
    totalRecordsMatchesSeed: allRecords.length === caseflowBooksSeed.editions.length,
    languageCountsMatchSeed:
      englishRecords.length === 50 && vietnameseRecords.length === 50,
    filtersReturnExpectedRecords:
      classicRecords.length > 0 &&
      authorRecords.length === 2 &&
      searchRecords.some((record) => record.work.slug === "pride-and-prejudice"),
    paginationReturnsExpectedSize: pagedRecords.length === 10,
    detailReturnsJoinedBookData:
      detail !== null &&
      detail.authors.length > 0 &&
      detail.categories.length > 0 &&
      detail.coverAsset !== null,
    relatedLookupReturnsSiblingEdition:
      relatedRecords.length >= 1 &&
      relatedRecords.every(
        (record) =>
          detail !== null &&
          record.work.id === detail.work.id &&
          record.edition.id !== detail.edition.id,
      ),
    legacyPhoneProductsRemainReadable: legacyProductsCount === 16,
  };
  const ok = Object.values(pass).every(Boolean);
  const fullReport = { ...report, pass, ok };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "book-repository-check.json"),
    JSON.stringify(fullReport, null, 2) + "\n",
  );
  console.log(JSON.stringify({ ok, pass, repositoryChecks: report.repositoryChecks }, null, 2));

  if (!ok) {
    process.exitCode = 1;
  }
}

function runMapperChecks() {
  const category = caseflowBooksSeed.categories[0];
  const work = caseflowBooksSeed.works[0];
  const edition = caseflowBooksSeed.editions[0];
  const categoryRow = categoryToRow(category);
  const workRow = workToRow(work);
  const editionRow = editionToRow(edition);

  mapBookCategoryRowToDomain(categoryRow);
  mapBookWorkRowToDomain(workRow, {
    primaryAuthorIds: work.primaryAuthorIds,
    categoryIds: work.categoryIds,
  });
  mapBookEditionRowToDomain(editionRow, {
    translatorIds: edition.translatorIds,
  });

  return {
    validRowsAccepted: true,
    invalidPriceRejected: throws(() =>
      mapBookEditionRowToDomain({
        ...editionRow,
        price_vnd: -1,
      }),
    ),
    invalidLanguageRejected: throws(() =>
      mapBookEditionRowToDomain({
        ...editionRow,
        language: "fr",
      } as unknown as TableRow<"book_editions">),
    ),
    invalidStockRejected: throws(() =>
      mapBookEditionRowToDomain({
        ...editionRow,
        stock_quantity: -1,
      }),
    ),
  };
}

function categoryToRow(
  category: (typeof caseflowBooksSeed.categories)[number],
): TableRow<"book_categories"> {
  return {
    id: category.id,
    slug: category.slug,
    labels: category.labels,
    description: category.description,
    sort_order: category.sortOrder,
    is_active: category.isActive,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  };
}

function workToRow(
  work: (typeof caseflowBooksSeed.works)[number],
): TableRow<"book_works"> {
  return {
    id: work.id,
    slug: work.slug,
    title: work.title,
    original_title: work.originalTitle,
    localized_title: work.localizedTitle,
    original_language: work.originalLanguage,
    themes: work.themes,
    age_rating: work.ageRating,
    publication_era: work.publicationEra,
    canonical_summary: work.canonicalSummary,
    is_active: work.isActive,
    created_at: work.createdAt,
    updated_at: work.updatedAt,
  };
}

function editionToRow(
  edition: (typeof caseflowBooksSeed.editions)[number],
): TableRow<"book_editions"> {
  return {
    id: edition.id,
    work_id: edition.workId,
    slug: edition.slug,
    display_title: edition.displayTitle,
    localized_display_title: edition.localizedDisplayTitle,
    subtitle: edition.subtitle,
    language: edition.language,
    format: edition.format,
    publisher_id: edition.publisherId,
    isbn13: edition.isbn13,
    isbn10: edition.isbn10,
    publication_year: edition.publicationYear,
    page_count: edition.pageCount,
    dimensions: edition.dimensions,
    weight_grams: edition.weightGrams,
    cover_asset_id: edition.coverImageId,
    price_vnd: edition.priceVnd,
    compare_at_price_vnd: edition.compareAtPriceVnd,
    stock_quantity: edition.stockQuantity,
    low_stock_threshold: edition.lowStockThreshold,
    inventory_status: edition.inventoryStatus,
    summary: edition.summary,
    table_of_contents: edition.tableOfContents,
    sample_excerpt_policy: edition.sampleExcerptPolicy,
    is_featured: edition.isFeatured,
    is_active: edition.isActive,
    created_at: edition.createdAt,
    updated_at: edition.updatedAt,
  };
}

function getSeedDetailSlug(): string {
  const firstWork = caseflowBooksSeed.works[0];
  const edition = caseflowBooksSeed.editions.find(
    (item) => item.workId === firstWork.id && item.language === "en",
  );

  if (!edition) {
    throw new Error("Missing seed English detail edition");
  }

  return edition.slug;
}

async function countPublicRows(table: "products") {
  const { count, error } = await anonClient
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`Public count failed for ${table}: ${error.message}`);
  }

  return count ?? 0;
}

function throws(callback: () => unknown): boolean {
  try {
    callback();
    return false;
  } catch {
    return true;
  }
}

function loadEnv(filePath: string) {
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

function requiredEnv(key: string) {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing ${key}`);
  }

  return value;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
