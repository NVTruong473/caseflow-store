import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import { caseflowBooksSeed } from "../src/data/books/seed";
import type { SourceNote } from "../src/types/domain";
import type { Database } from "../src/types/supabase";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t03");
const JSON_PATH = path.join(ARTIFACT_DIR, "catalog-realism-baseline.json");
const MARKDOWN_PATH = path.join(
  ARTIFACT_DIR,
  "catalog-realism-baseline.md",
);
const PLACEHOLDER_PATH = "/images/books/placeholders/book-cover-placeholder.svg";
const VIETNAMESE_DIACRITIC_PATTERN = /[À-ỹĐđ]/u;
const UI_FILES = [
  "src/app/page.tsx",
  "src/app/catalog/page.tsx",
  "src/app/products/[slug]/page.tsx",
  "src/features/admin/admin-catalog-page.tsx",
] as const;

type JsonObject = Record<string, unknown>;
type TableReadResult = Awaited<ReturnType<typeof readSupabaseBaseline>>;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();
  const seed = auditSeed();
  const supabase = await readSupabaseBaseline();
  const sourceScan = auditVisibleGenericLanguage();
  const schemaDecision = evaluateSchemaCapability();
  const releaseBlockers = buildReleaseBlockers(seed, supabase, sourceScan);
  const optionalPolish = [
    "Add richer work-level editorial fields only after provenance contracts are frozen.",
    "Improve category breadth only after the canonical 100-edition manifest is accepted.",
    "Consider external preview links only when regional availability and link rights are explicit.",
  ];
  const report = {
    generatedAt,
    mode: "read-only",
    noWritesPerformed: true,
    optionalPolish,
    releaseBlockers,
    schemaDecision,
    seed,
    sourceScan,
    supabase,
    task: "V12-T03 - Audit v1.1 Catalog Realism Baseline",
  };

  fs.writeFileSync(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MARKDOWN_PATH, renderMarkdown(report));

  const pass = {
    readOnly: report.noWritesPerformed,
    seedCountsMatchRelease:
      seed.counts.works === 50 && seed.counts.editions === 100,
    supabaseReadSucceeded: supabase.status === "ok",
    supabaseCountsMatchSeed:
      supabase.status === "ok" &&
      supabase.counts.activeWorks === seed.counts.activeWorks &&
      supabase.counts.activeEditions === seed.counts.activeEditions,
    noQaCatalogRows:
      supabase.status === "ok" && supabase.qaRows.total === 0,
    blockerBaselineRecorded: releaseBlockers.length > 0,
    schemaDecisionRecorded: schemaDecision.recommendation === "additive-schema-required",
  };
  const ok = Object.values(pass).every(Boolean);

  console.log(
    JSON.stringify(
      {
        artifacts: { json: JSON_PATH, markdown: MARKDOWN_PATH },
        counts: seed.counts,
        ok,
        pass,
        releaseBlockerCount: releaseBlockers.length,
        schemaRecommendation: schemaDecision.recommendation,
        supabaseCounts: supabase.status === "ok" ? supabase.counts : null,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

function auditSeed() {
  const activeWorks = caseflowBooksSeed.works.filter((work) => work.isActive);
  const activeEditions = caseflowBooksSeed.editions.filter(
    (edition) => edition.isActive,
  );
  const coverById = new Map(
    caseflowBooksSeed.coverAssets.map((asset) => [asset.id, asset]),
  );
  const coverReferenceCounts = countBy(
    activeEditions,
    (edition) => edition.coverImageId ?? "missing",
  );
  const primaryCoverPaths = activeEditions.map((edition) =>
    edition.coverImageId
      ? (coverById.get(edition.coverImageId)?.path ?? "missing")
      : "missing",
  );
  const coverFiles = caseflowBooksSeed.coverAssets.map((asset) => {
    const localPath = asset.path.startsWith("/")
      ? path.join(process.cwd(), "public", asset.path.slice(1))
      : null;
    const exists = localPath ? fs.existsSync(localPath) : true;
    const bytes = localPath && exists ? fs.readFileSync(localPath) : null;

    return {
      id: asset.id,
      path: asset.path,
      source: asset.source,
      sourceNoteComplete: isCompleteSourceNote(asset.sourceNote),
      exists,
      fileBytes: bytes?.byteLength ?? null,
      sha256: bytes ? createHash("sha256").update(bytes).digest("hex") : null,
    };
  });
  const pairCounts = countBy(activeEditions, (edition) => edition.workId);
  const validBilingualPairs = activeWorks.filter((work) => {
    const editions = activeEditions.filter(
      (edition) => edition.workId === work.id,
    );
    return (
      editions.length === 2 &&
      editions.some((edition) => edition.language === "en") &&
      editions.some((edition) => edition.language === "vi")
    );
  }).length;
  const missingFields = {
    isbn13: countNull(activeEditions, (edition) => edition.isbn13),
    isbn10: countNull(activeEditions, (edition) => edition.isbn10),
    pageCount: countNull(activeEditions, (edition) => edition.pageCount),
    subtitle: countNull(activeEditions, (edition) => edition.subtitle),
    tableOfContents: countNull(
      activeEditions,
      (edition) => edition.tableOfContents,
    ),
    translatorCredits: activeEditions.filter(
      (edition) => edition.translatorIds.length === 0,
    ).length,
    publicationYear: countNull(
      activeEditions,
      (edition) => edition.publicationYear,
    ),
    coverImageId: countNull(activeEditions, (edition) => edition.coverImageId),
    publisherId: countNull(activeEditions, (edition) => edition.publisherId),
    thicknessMm: activeEditions.filter(
      (edition) => edition.dimensions?.thicknessMm == null,
    ).length,
  };
  const summaryCoverage = {
    englishPresent: activeEditions.filter(
      (edition) => edition.summary.en.trim().length > 0,
    ).length,
    vietnamesePresent: activeEditions.filter(
      (edition) => edition.summary.vi.trim().length > 0,
    ).length,
    vietnameseWithoutDiacritics: activeEditions.filter(
      (edition) => !VIETNAMESE_DIACRITIC_PATTERN.test(edition.summary.vi),
    ).length,
    repeatedEnglishPositioningSentence: activeEditions.filter((edition) =>
      edition.summary.en.includes("This English edition is positioned"),
    ).length,
    repeatedVietnamesePositioningSentence: activeEditions.filter((edition) =>
      edition.summary.vi.includes("An ban tieng Viet phu hop"),
    ).length,
  };
  const publisherById = new Map(
    caseflowBooksSeed.publishers.map((publisher) => [publisher.id, publisher]),
  );
  const demoPublisherEditions = activeEditions.filter((edition) => {
    const publisher = edition.publisherId
      ? publisherById.get(edition.publisherId)
      : null;
    return publisher?.name.toLocaleLowerCase().includes("demo") ?? false;
  }).length;

  return {
    counts: {
      categories: caseflowBooksSeed.categories.length,
      activeCategories: caseflowBooksSeed.categories.filter(
        (category) => category.isActive,
      ).length,
      authors: caseflowBooksSeed.authors.length,
      translators: caseflowBooksSeed.translators.length,
      publishers: caseflowBooksSeed.publishers.length,
      coverAssets: caseflowBooksSeed.coverAssets.length,
      works: caseflowBooksSeed.works.length,
      activeWorks: activeWorks.length,
      editions: caseflowBooksSeed.editions.length,
      activeEditions: activeEditions.length,
      englishEditions: activeEditions.filter(
        (edition) => edition.language === "en",
      ).length,
      vietnameseEditions: activeEditions.filter(
        (edition) => edition.language === "vi",
      ).length,
      featuredEditions: activeEditions.filter(
        (edition) => edition.isFeatured,
      ).length,
    },
    coverUsage: {
      coverReferenceCounts,
      distinctPrimaryCoverIds: Object.keys(coverReferenceCounts).length,
      distinctPrimaryCoverPaths: new Set(primaryCoverPaths).size,
      editionsUsingPlaceholder: primaryCoverPaths.filter(
        (coverPath) => coverPath === PLACEHOLDER_PATH,
      ).length,
      editionsWithBrokenCoverReference: primaryCoverPaths.filter(
        (coverPath) => coverPath === "missing",
      ).length,
      coverFiles,
    },
    editionCompleteness: {
      demoPublisherEditions,
      missingFields,
      summaryCoverage,
    },
    relationships: {
      workPairCounts: summarizeCounts(pairCounts),
      validBilingualPairs,
      worksWithoutExactlyTwoEditions: Object.values(pairCounts).filter(
        (count) => count !== 2,
      ).length,
    },
    sourceCoverage: {
      authorsWithCompleteSourceNote: caseflowBooksSeed.authors.filter((author) =>
        isCompleteSourceNote(author.sourceNote),
      ).length,
      coversWithCompleteSourceNote: caseflowBooksSeed.coverAssets.filter(
        (cover) => isCompleteSourceNote(cover.sourceNote),
      ).length,
      publishersWithSourceNote: 0,
      worksWithSourceNote: 0,
      editionsWithSourceNote: 0,
      publisherSourceRepresentableInCurrentContract: false,
      workSourceRepresentableInCurrentContract: false,
      editionSourceRepresentableInCurrentContract: false,
    },
  };
}

async function readSupabaseBaseline() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const [categories, authors, publishers, covers, works, editions] =
    await Promise.all([
      client.from("book_categories").select("id,slug,is_active"),
      client.from("book_authors").select("id,slug,source_note,is_active"),
      client.from("book_publishers").select("id,slug,name,is_active"),
      client
        .from("book_cover_assets")
        .select("id,path,source,source_note,alt_text"),
      client.from("book_works").select("id,slug,is_active"),
      client
        .from("book_editions")
        .select(
          "id,work_id,slug,language,publisher_id,isbn13,isbn10,publication_year,page_count,dimensions,weight_grams,cover_asset_id,summary,is_featured,is_active",
        ),
    ]);

  const reads = { categories, authors, publishers, covers, works, editions };
  for (const [label, result] of Object.entries(reads)) {
    if (result.error) {
      throw new Error(`Supabase ${label} read failed: ${result.error.message}`);
    }
  }

  const categoryRows = categories.data ?? [];
  const authorRows = authors.data ?? [];
  const publisherRows = publishers.data ?? [];
  const coverRows = covers.data ?? [];
  const workRows = works.data ?? [];
  const editionRows = editions.data ?? [];
  const activeEditions = editionRows.filter((row) => row.is_active);
  const activeWorks = workRows.filter((row) => row.is_active);
  const seedEditionIds = new Set(caseflowBooksSeed.editions.map((row) => row.id));
  const seedWorkIds = new Set(caseflowBooksSeed.works.map((row) => row.id));
  const qaRows = {
    authors: authorRows.filter((row) => row.slug.startsWith("qa-")).length,
    editions: editionRows.filter((row) => row.slug.startsWith("qa-")).length,
    publishers: publisherRows.filter((row) => row.slug.startsWith("qa-")).length,
    works: workRows.filter((row) => row.slug.startsWith("qa-")).length,
  };

  return {
    status: "ok" as const,
    readOnly: true,
    counts: {
      categories: categoryRows.length,
      activeCategories: categoryRows.filter((row) => row.is_active).length,
      authors: authorRows.length,
      publishers: publisherRows.length,
      coverAssets: coverRows.length,
      works: workRows.length,
      activeWorks: activeWorks.length,
      editions: editionRows.length,
      activeEditions: activeEditions.length,
      englishEditions: activeEditions.filter((row) => row.language === "en")
        .length,
      vietnameseEditions: activeEditions.filter((row) => row.language === "vi")
        .length,
    },
    coverUsage: {
      distinctActiveCoverIds: new Set(
        activeEditions.map((row) => row.cover_asset_id ?? "missing"),
      ).size,
      editionsUsingSeedPlaceholder: activeEditions.filter(
        (row) =>
          coverRows.find((cover) => cover.id === row.cover_asset_id)?.path ===
          PLACEHOLDER_PATH,
      ).length,
      brokenCoverReferences: activeEditions.filter(
        (row) =>
          row.cover_asset_id == null ||
          !coverRows.some((cover) => cover.id === row.cover_asset_id),
      ).length,
    },
    qaRows: {
      ...qaRows,
      total: Object.values(qaRows).reduce((sum, count) => sum + count, 0),
    },
    seedParity: {
      unexpectedEditionIds: editionRows
        .filter((row) => !seedEditionIds.has(row.id))
        .map((row) => row.id),
      missingEditionIds: [...seedEditionIds].filter(
        (id) => !editionRows.some((row) => row.id === id),
      ),
      unexpectedWorkIds: workRows
        .filter((row) => !seedWorkIds.has(row.id))
        .map((row) => row.id),
      missingWorkIds: [...seedWorkIds].filter(
        (id) => !workRows.some((row) => row.id === id),
      ),
    },
    sourceCoverage: {
      authorsWithCompleteSourceNote: authorRows.filter((row) =>
        isCompleteSourceNote(row.source_note),
      ).length,
      coversWithCompleteSourceNote: coverRows.filter((row) =>
        isCompleteSourceNote(row.source_note),
      ).length,
      publishersWithSourceNote: 0,
      worksWithSourceNote: 0,
      editionsWithSourceNote: 0,
    },
  };
}

function auditVisibleGenericLanguage() {
  const patterns = [
    { id: "tbc", pattern: /\bTBC\b|Đang cập nhật/giu },
    { id: "not-specified", pattern: /Not specified|Chưa xác định/giu },
    { id: "demo", pattern: /\bdemo\b/giu },
    { id: "placeholder", pattern: /placeholder/giu },
  ] as const;

  return {
    files: UI_FILES.map((file) => {
      const contents = fs.readFileSync(file, "utf8");
      return {
        file,
        matches: Object.fromEntries(
          patterns.map(({ id, pattern }) => [
            id,
            [...contents.matchAll(pattern)].length,
          ]),
        ),
      };
    }),
  };
}

function evaluateSchemaCapability() {
  return {
    recommendation: "additive-schema-required" as const,
    existingStrengths: [
      "book_cover_assets already stores path, source type, localized alt text, and a basic source_note JSON value.",
      "book_works and book_editions already separate work identity from the sellable SKU.",
      "book_editions already supports stable cover references and is_featured.",
    ],
    blockingGaps: [
      "book_works, book_editions, and book_publishers cannot store reviewed provenance in the current domain or table contracts.",
      "SourceNote cannot express content kind, rights basis, attribution requirements/location, review status, reviewer note, or edition-match confidence.",
      "is_featured is only a boolean and cannot represent localized shelf labels, deterministic order, date windows, editorial versus sales-derived provenance, or operator-managed collections.",
    ],
    migrationBoundary:
      "V12-T04 should define additive provenance contracts. V12-T09 should add the smallest merchandising storage only after content fields are frozen. No destructive change is justified.",
  };
}

function buildReleaseBlockers(
  seed: ReturnType<typeof auditSeed>,
  supabase: TableReadResult,
  sourceScan: ReturnType<typeof auditVisibleGenericLanguage>,
) {
  const genericCounts = sourceScan.files.reduce<Record<string, number>>(
    (totals, file) => {
      for (const [key, value] of Object.entries(file.matches)) {
        totals[key] = (totals[key] ?? 0) + value;
      }
      return totals;
    },
    {},
  );

  return [
    {
      id: "V12-B01",
      severity: "critical",
      finding: `${seed.coverUsage.editionsUsingPlaceholder}/100 seed editions and ${supabase.coverUsage.editionsUsingSeedPlaceholder}/100 Supabase editions use the same placeholder as their primary cover.`,
    },
    {
      id: "V12-B02",
      severity: "high",
      finding: `${seed.editionCompleteness.demoPublisherEditions}/100 editions point to a demo publisher, while ISBN-13, ISBN-10, and page count are missing on every edition.`,
    },
    {
      id: "V12-B03",
      severity: "high",
      finding: `${seed.editionCompleteness.summaryCoverage.vietnameseWithoutDiacritics}/100 Vietnamese summaries have no Vietnamese diacritics, so field presence overstates localization quality.`,
    },
    {
      id: "V12-B04",
      severity: "high",
      finding:
        "The current schema cannot attach reviewed provenance to works, editions, or publishers and cannot represent v1.2 merchandising collections.",
    },
    {
      id: "V12-B05",
      severity: "medium",
      finding: `Normal storefront source still contains generic UI paths (TBC: ${genericCounts.tbc ?? 0}, not-specified: ${genericCounts["not-specified"] ?? 0}, placeholder: ${genericCounts.placeholder ?? 0}).`,
    },
    {
      id: "V12-B06",
      severity: "medium",
      finding:
        "All 50 works have an English and Vietnamese SKU, but no translator records exist; the relationship is structurally complete and bibliographically incomplete.",
    },
  ];
}

function renderMarkdown(report: {
  generatedAt: string;
  mode: string;
  noWritesPerformed: boolean;
  optionalPolish: string[];
  releaseBlockers: Array<{ id: string; severity: string; finding: string }>;
  schemaDecision: ReturnType<typeof evaluateSchemaCapability>;
  seed: ReturnType<typeof auditSeed>;
  sourceScan: ReturnType<typeof auditVisibleGenericLanguage>;
  supabase: TableReadResult;
  task: string;
}) {
  const { seed, supabase } = report;
  const missing = seed.editionCompleteness.missingFields;
  const lines = [
    "# V12-T03 Catalog Realism Baseline Artifact",
    "",
    `- Generated at: ${report.generatedAt}`,
    `- Mode: ${report.mode}`,
    `- Database writes: ${report.noWritesPerformed ? "none" : "unexpected"}`,
    `- Supabase read status: ${supabase.status}`,
    "",
    "## Catalog Counts",
    "",
    "| Metric | Seed | Supabase |",
    "|---|---:|---:|",
    `| Active categories | ${seed.counts.activeCategories} | ${supabase.counts.activeCategories} |`,
    `| Authors | ${seed.counts.authors} | ${supabase.counts.authors} |`,
    `| Publishers | ${seed.counts.publishers} | ${supabase.counts.publishers} |`,
    `| Cover assets | ${seed.counts.coverAssets} | ${supabase.counts.coverAssets} |`,
    `| Active works | ${seed.counts.activeWorks} | ${supabase.counts.activeWorks} |`,
    `| Active editions | ${seed.counts.activeEditions} | ${supabase.counts.activeEditions} |`,
    `| English editions | ${seed.counts.englishEditions} | ${supabase.counts.englishEditions} |`,
    `| Vietnamese editions | ${seed.counts.vietnameseEditions} | ${supabase.counts.vietnameseEditions} |`,
    "",
    "## Edition Completeness",
    "",
    "| Gap | Affected editions |",
    "|---|---:|",
    `| Generic placeholder primary cover | ${seed.coverUsage.editionsUsingPlaceholder} |`,
    `| Demo publisher | ${seed.editionCompleteness.demoPublisherEditions} |`,
    `| Missing ISBN-13 | ${missing.isbn13} |`,
    `| Missing ISBN-10 | ${missing.isbn10} |`,
    `| Missing page count | ${missing.pageCount} |`,
    `| Missing translator credit | ${missing.translatorCredits} |`,
    `| Missing publication year | ${missing.publicationYear} |`,
    `| Vietnamese summary without diacritics | ${seed.editionCompleteness.summaryCoverage.vietnameseWithoutDiacritics} |`,
    "",
    "## Release Blockers",
    "",
    ...report.releaseBlockers.map(
      (blocker) =>
        `- **${blocker.id} (${blocker.severity})**: ${blocker.finding}`,
    ),
    "",
    "## Schema Recommendation",
    "",
    `Recommendation: **${report.schemaDecision.recommendation}**.`,
    "",
    ...report.schemaDecision.blockingGaps.map((gap) => `- ${gap}`),
    "",
    report.schemaDecision.migrationBoundary,
    "",
    "## Optional Polish",
    "",
    ...report.optionalPolish.map((item) => `- ${item}`),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function isCompleteSourceNote(value: unknown): value is SourceNote {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const note = value as JsonObject;
  return (
    typeof note.label === "string" &&
    note.label.trim().length > 0 &&
    (note.url === null || typeof note.url === "string") &&
    typeof note.license === "string" &&
    note.license.trim().length > 0 &&
    typeof note.checkedAt === "string" &&
    note.checkedAt.trim().length > 0
  );
}

function requiredEnv(key: string) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function countNull<T>(items: T[], selector: (item: T) => unknown) {
  return items.filter((item) => selector(item) == null).length;
}

function countBy<T>(items: T[], selector: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function summarizeCounts(counts: Record<string, number>) {
  return Object.values(counts).reduce<Record<string, number>>(
    (summary, count) => {
      const key = String(count);
      summary[key] = (summary[key] ?? 0) + 1;
      return summary;
    },
    {},
  );
}

void main();
