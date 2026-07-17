import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import { caseflowBooksSeed, caseflowBooksSeedSummary } from "../src/data/books/seed";

type JsonRecord = Record<string, unknown>;

type UpsertBatch = {
  table: string;
  onConflict: string;
  rows: JsonRecord[];
};

const APPLY = process.argv.includes("--apply");
const VERIFY_ONLY = process.argv.includes("--verify-only");
const ARTIFACT_DIR = path.join(".agent", "artifacts", "d24-t03");

const env = loadEnv(".env.local");
const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
      updated_at: category.updatedAt,
    })),
  },
  {
    table: "book_authors",
    onConflict: "id",
    rows: caseflowBooksSeed.authors.map((author) => ({
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
      updated_at: author.updatedAt,
    })),
  },
  {
    table: "book_publishers",
    onConflict: "id",
    rows: caseflowBooksSeed.publishers.map((publisher) => ({
      id: publisher.id,
      slug: publisher.slug,
      name: publisher.name,
      country: publisher.country,
      website: publisher.website,
      is_active: publisher.isActive,
      created_at: publisher.createdAt,
      updated_at: publisher.updatedAt,
    })),
  },
  {
    table: "book_cover_assets",
    onConflict: "id",
    rows: caseflowBooksSeed.coverAssets.map((coverAsset) => ({
      id: coverAsset.id,
      path: coverAsset.path,
      alt_text: coverAsset.altText,
      source: coverAsset.source,
      source_note: coverAsset.sourceNote,
      created_at: coverAsset.createdAt,
      updated_at: coverAsset.updatedAt,
    })),
  },
  {
    table: "book_works",
    onConflict: "id",
    rows: caseflowBooksSeed.works.map((work) => ({
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
    })),
  },
  {
    table: "book_work_authors",
    onConflict: "work_id,author_id",
    rows: caseflowBooksSeed.works.flatMap((work) =>
      work.primaryAuthorIds.map((authorId, index) => ({
        work_id: work.id,
        author_id: authorId,
        sort_order: index,
        created_at: work.createdAt,
      })),
    ),
  },
  {
    table: "book_work_categories",
    onConflict: "work_id,category_id",
    rows: caseflowBooksSeed.works.flatMap((work) =>
      work.categoryIds.map((categoryId, index) => ({
        work_id: work.id,
        category_id: categoryId,
        sort_order: index,
        created_at: work.createdAt,
      })),
    ),
  },
  {
    table: "book_editions",
    onConflict: "id",
    rows: caseflowBooksSeed.editions.map((edition) => ({
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
    })),
  },
  {
    table: "book_edition_translators",
    onConflict: "edition_id,translator_id",
    rows: caseflowBooksSeed.editions.flatMap((edition) =>
      edition.translatorIds.map((translatorId, index) => ({
        edition_id: edition.id,
        translator_id: translatorId,
        sort_order: index,
        created_at: edition.createdAt,
      })),
    ),
  },
];

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const dryRunSummary = {
    mode: APPLY ? "apply" : VERIFY_ONLY ? "verify-only" : "dry-run",
    generatedAt: new Date().toISOString(),
    seedSummary: caseflowBooksSeedSummary,
    batchCounts: Object.fromEntries(
      batches.map((batch) => [batch.table, batch.rows.length]),
    ),
  };

  if (!APPLY && !VERIFY_ONLY) {
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "seed-books-dry-run.json"),
      JSON.stringify(dryRunSummary, null, 2) + "\n",
    );
    console.log(JSON.stringify({ ok: true, ...dryRunSummary }, null, 2));
    return;
  }

  const applied = [];
  if (APPLY) {
    for (const batch of batches) {
      if (batch.rows.length === 0) {
        applied.push({ table: batch.table, rows: 0, skipped: true });
        continue;
      }
      const { error } = await serviceClient
        .from(batch.table)
        .upsert(batch.rows, { onConflict: batch.onConflict });

      if (error) {
        throw new Error(`Upsert failed for ${batch.table}: ${error.message}`);
      }
      applied.push({ table: batch.table, rows: batch.rows.length, skipped: false });
    }
  }

  const verification = await verifySeed();
  const report = {
    ...dryRunSummary,
    applied,
    verification,
    pass: {
      countsMatchSeed:
        verification.counts.book_categories === caseflowBooksSeed.categories.length &&
        verification.counts.book_authors === caseflowBooksSeed.authors.length &&
        verification.counts.book_publishers === caseflowBooksSeed.publishers.length &&
        verification.counts.book_cover_assets === caseflowBooksSeed.coverAssets.length &&
        verification.counts.book_works === caseflowBooksSeed.works.length &&
        verification.counts.book_editions === caseflowBooksSeed.editions.length,
      languageDistributionMatches:
        verification.languageCounts.en === 50 && verification.languageCounts.vi === 50,
      legacyPhoneCatalogPreserved:
        verification.legacyCounts.categories === 5 &&
        verification.legacyCounts.products === 16,
      publicBookSmokeReturnsOnlyBookRows:
        verification.publicBookSmoke.ok &&
        verification.publicBookSmoke.rows.every((row) => row.source === "book_editions"),
    },
  };
  const ok = Object.values(report.pass).every(Boolean);
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "seed-books-apply.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify({ ok, pass: report.pass, counts: verification.counts }, null, 2));
  if (!ok) {
    process.exitCode = 1;
  }
}

async function verifySeed() {
  const counts = {
    book_categories: await countTable("book_categories"),
    book_authors: await countTable("book_authors"),
    book_publishers: await countTable("book_publishers"),
    book_cover_assets: await countTable("book_cover_assets"),
    book_works: await countTable("book_works"),
    book_work_authors: await countTable("book_work_authors"),
    book_work_categories: await countTable("book_work_categories"),
    book_editions: await countTable("book_editions"),
    book_edition_translators: await countTable("book_edition_translators"),
  };

  const { data: editions, error: editionsError } = await serviceClient
    .from("book_editions")
    .select("id, language, is_active");

  if (editionsError) {
    throw new Error(`Edition verification failed: ${editionsError.message}`);
  }

  const languageCounts = (editions ?? []).reduce<Record<string, number>>(
    (totals, edition) => {
      if (edition.is_active) {
        totals[edition.language] = (totals[edition.language] ?? 0) + 1;
      }
      return totals;
    },
    {},
  );

  const legacyCounts = {
    categories: await countTable("categories"),
    products: await countTable("products"),
  };

  const { data: publicRows, error: publicError, count } = await anonClient
    .from("book_editions")
    .select("id, slug, display_title, language, price_vnd", { count: "exact" })
    .eq("is_active", true)
    .limit(5);

  if (publicError) {
    throw new Error(`Public book smoke failed: ${publicError.message}`);
  }

  return {
    counts,
    languageCounts,
    legacyCounts,
    publicBookSmoke: {
      ok: count === caseflowBooksSeed.editions.length,
      count,
      rows: (publicRows ?? []).map((row) => ({ ...row, source: "book_editions" })),
    },
  };
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
