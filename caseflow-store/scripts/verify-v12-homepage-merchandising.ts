import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import {
  listSupabaseBookCatalog,
  type SupabaseBookCatalogRecord,
} from "../src/lib/repositories/supabase-books";
import {
  getResolvedMerchandisingShelf,
  listSupabaseMerchandisingShelves,
  resolveSupabaseMerchandisingShelves,
  type SupabaseResolvedMerchandisingShelf,
} from "../src/lib/repositories/supabase-merchandising";
import type { Database } from "../src/types/supabase";

const TASK_ID = "V12-T12";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t12");
const REPORT_PATH = path.join(
  ARTIFACT_DIR,
  "homepage-merchandising-check.json",
);
const MARKDOWN_PATH = path.join(
  ARTIFACT_DIR,
  "homepage-merchandising-check.md",
);
const PLACEHOLDER_COVER_PATH =
  "/images/books/placeholders/book-cover-placeholder.svg";
const REQUIRED_SHELVES = [
  "editor-picks",
  "weekend-starter-set",
  "vietnamese-editions",
  "english-editions",
  "promotion-ready",
  "paired-edition-comparison",
] as const;

loadEnvConfig(process.cwd());

const supabase = createClient<Database>(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  },
);

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const [records, shelves] = await Promise.all([
    listSupabaseBookCatalog({ sort: "newest" }, { client: supabase }),
    listSupabaseMerchandisingShelves({ client: supabase }),
  ]);
  const resolvedShelves = resolveSupabaseMerchandisingShelves(
    records,
    shelves,
    new Date(),
  );
  const report = buildReport(records, resolvedShelves);

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MARKDOWN_PATH, renderMarkdown(report));
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: report.ok,
        artifact: REPORT_PATH,
        pass: report.pass,
        selectedEditionCount: report.selectedEditionCount,
      },
      null,
      2,
    )}\n`,
  );

  if (!report.ok) {
    process.exitCode = 1;
  }
}

function buildReport(
  records: SupabaseBookCatalogRecord[],
  shelves: SupabaseResolvedMerchandisingShelf[],
) {
  const recordsByEditionId = new Map(
    records.map((record) => [record.edition.id, record]),
  );
  const requiredShelfReports = REQUIRED_SHELVES.map((slug) =>
    inspectRequiredShelf(slug, shelves, recordsByEditionId),
  );
  const editorPicks = requiredShelf(shelves, "editor-picks");
  const weekend = requiredShelf(shelves, "weekend-starter-set");
  const vietnamese = requiredShelf(shelves, "vietnamese-editions");
  const english = requiredShelf(shelves, "english-editions");
  const promotion = requiredShelf(shelves, "promotion-ready");
  const paired = requiredShelf(shelves, "paired-edition-comparison");
  const selectedRecords = [
    ...editorPicks.records.slice(0, 4),
    ...weekend.records.slice(0, 4),
    ...vietnamese.records.slice(0, 4),
    ...english.records.slice(0, 4),
    ...promotion.records.slice(0, 4),
    ...paired.records.slice(0, 6),
  ];
  const selectedEditionIds = new Set(
    selectedRecords.map((record) => record.edition.id),
  );
  const pass = {
    catalogHasExpectedScale: records.length === 100,
    activeShelvesPubliclyReadable: shelves.length >= 8,
    requiredShelvesResolve: requiredShelfReports.every((shelf) => shelf.ok),
    editorPicksRespectManualOrder: manualShelfMatchesOrder(
      editorPicks,
      recordsByEditionId,
      4,
    ),
    weekendRespectManualOrder: manualShelfMatchesOrder(
      weekend,
      recordsByEditionId,
      4,
    ),
    vietnameseShelfIsVietnamese: vietnamese.records.every(
      (record) => record.edition.language === "vi",
    ),
    englishShelfIsEnglish: english.records.every(
      (record) => record.edition.language === "en",
    ),
    promotionShelfUsesRealCompareAt: promotion.records.every(
      (record) => record.edition.compareAtPriceVnd !== null,
    ),
    pairedShelfHasEnglishVietnameseWorks: inspectPairedShelf(paired).ok,
    selectedHomepageDoesNotDumpCatalog:
      selectedEditionIds.size > 0 && selectedEditionIds.size < records.length,
    selectedCoversAreDistinctAndNotPlaceholder:
      inspectSelectedCovers(selectedRecords).ok,
    noOrderDerivedClaimsRendered: !shelves.some(
      (shelf) => shelf.shelf.sourceKind === "order-derived",
    ),
  };
  const ok = Object.values(pass).every(Boolean);

  return {
    taskId: TASK_ID,
    generatedAt: new Date().toISOString(),
    counts: {
      catalogRecords: records.length,
      resolvedShelves: shelves.length,
    },
    ok,
    pass,
    requiredShelves: requiredShelfReports,
    selectedEditionCount: selectedEditionIds.size,
    selectedSlugs: Array.from(selectedEditionIds)
      .map((editionId) => recordsByEditionId.get(editionId)?.edition.slug)
      .filter((slug): slug is string => Boolean(slug)),
  };
}

function inspectRequiredShelf(
  slug: (typeof REQUIRED_SHELVES)[number],
  shelves: SupabaseResolvedMerchandisingShelf[],
  recordsByEditionId: Map<string, SupabaseBookCatalogRecord>,
) {
  const shelf = getResolvedMerchandisingShelf(shelves, slug);

  if (!shelf) {
    return {
      slug,
      ok: false,
      reason: "missing-shelf",
    };
  }

  const missingEditionIds = shelf.editionIds.filter(
    (editionId) => !recordsByEditionId.has(editionId),
  );

  return {
    slug,
    ok:
      shelf.records.length >= Math.min(shelf.shelf.minItems, shelf.shelf.maxItems) &&
      missingEditionIds.length === 0 &&
      shelf.warnings.length === 0,
    sourceShelfSlug: shelf.sourceShelfSlug,
    usedFallback: shelf.usedFallback,
    warnings: shelf.warnings,
    records: shelf.records.map((record) => record.edition.slug),
    missingEditionIds,
  };
}

function manualShelfMatchesOrder(
  shelf: SupabaseResolvedMerchandisingShelf,
  recordsByEditionId: Map<string, SupabaseBookCatalogRecord>,
  limit: number,
) {
  const expectedSlugs = shelf.shelf.manualSlots
    .filter((slot) => slot.isActive)
    .sort((left, right) => left.position - right.position)
    .slice(0, limit)
    .map((slot) => recordsByEditionId.get(slot.editionId)?.edition.slug);
  const actualSlugs = shelf.records
    .slice(0, limit)
    .map((record) => record.edition.slug);

  return JSON.stringify(expectedSlugs) === JSON.stringify(actualSlugs);
}

function inspectPairedShelf(shelf: SupabaseResolvedMerchandisingShelf) {
  const languagesByWorkId = new Map<string, Set<string>>();

  for (const record of shelf.records) {
    const languages = languagesByWorkId.get(record.work.id) ?? new Set<string>();
    languages.add(record.edition.language);
    languagesByWorkId.set(record.work.id, languages);
  }

  const unpairedWorkIds = Array.from(languagesByWorkId)
    .filter(([, languages]) => !(languages.has("en") && languages.has("vi")))
    .map(([workId]) => workId);

  return {
    ok: unpairedWorkIds.length === 0 && languagesByWorkId.size >= 3,
    pairedWorkCount: languagesByWorkId.size,
    unpairedWorkIds,
  };
}

function inspectSelectedCovers(records: SupabaseBookCatalogRecord[]) {
  const coverPaths = records.map(
    (record) => record.coverAsset?.path ?? PLACEHOLDER_COVER_PATH,
  );
  const distinctCoverPaths = new Set(coverPaths);
  const placeholderSlugs = records
    .filter((record) => {
      return (
        !record.coverAsset ||
        record.coverAsset.path === PLACEHOLDER_COVER_PATH ||
        record.coverAsset.source === "placeholder"
      );
    })
    .map((record) => record.edition.slug);

  return {
    ok: placeholderSlugs.length === 0 && distinctCoverPaths.size >= 12,
    distinctCoverCount: distinctCoverPaths.size,
    placeholderSlugs,
  };
}

function requiredShelf(
  shelves: SupabaseResolvedMerchandisingShelf[],
  slug: (typeof REQUIRED_SHELVES)[number],
) {
  const shelf = getResolvedMerchandisingShelf(shelves, slug);

  if (!shelf) {
    throw new Error(`Required merchandising shelf not found: ${slug}`);
  }

  return shelf;
}

function renderMarkdown(report: ReturnType<typeof buildReport>) {
  const lines = [
    `# ${TASK_ID} Homepage Merchandising Check`,
    "",
    `- Generated: ${report.generatedAt}`,
    `- OK: ${report.ok ? "yes" : "no"}`,
    `- Catalog records: ${report.counts.catalogRecords}`,
    `- Resolved shelves: ${report.counts.resolvedShelves}`,
    `- Selected homepage editions: ${report.selectedEditionCount}`,
    "",
    "## Pass",
    ...Object.entries(report.pass).map(
      ([key, value]) => `- ${key}: ${value ? "pass" : "fail"}`,
    ),
    "",
    "## Required Shelves",
    ...report.requiredShelves.map(
      (shelf) =>
        `- ${shelf.slug}: ${shelf.ok ? "pass" : "fail"} (${shelf.records?.length ?? 0} records)`,
    ),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
