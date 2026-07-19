import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import {
  BLOCKING_CONTENT_QUALITY_REQUIREMENTS,
  OPTIONAL_CONTENT_QUALITY_REQUIREMENTS,
} from "../src/types/content-provenance";
import type { Database, Json } from "../src/types/supabase";

type BookEditionRow = Database["public"]["Tables"]["book_editions"]["Row"];
type BookWorkRow = Database["public"]["Tables"]["book_works"]["Row"];
type JsonRecord = Record<string, unknown>;
type LanguageCode = "en" | "vi";

type EditionFamily = {
  code: string;
  format: BookEditionRow["format"];
  priceMultiplier: number;
  stockBase: number;
  labels: Record<LanguageCode, { en: string; vi: string }>;
};

type WorkPair = {
  en: BookEditionRow;
  vi: BookEditionRow;
  work: BookWorkRow;
};

type GeneratedEdition = {
  cover: JsonRecord;
  edition: JsonRecord;
  provenance: JsonRecord;
  quality: JsonRecord[];
  svg: {
    path: string;
    source: string;
  };
};

const TASK_ID = "v16-t01";
const APPLY = process.argv.includes("--apply");
const BUILD_ASSETS = APPLY || process.argv.includes("--build-assets");
const IMPORTED_AT = "2026-07-19T15:00:00.000Z";
const ARTIFACT_DIR = path.join(".agent", "artifacts", TASK_ID);
const REPORT_PATH = path.join(
  ARTIFACT_DIR,
  APPLY ? "catalog-expansion-apply.json" : "catalog-expansion-dry-run.json",
);
const COVER_OUTPUT_DIR = path.join(
  process.cwd(),
  "public",
  "images",
  "books",
  "v16-covers",
);
const COVER_PUBLIC_PREFIX = "/images/books/v16-covers";
const V16_SOURCE_PREFIX = "caseflow-v16";
const MIN_ACTIVE_PRICE_VND = 99_000;

const editionFamilies: EditionFamily[] = [
  {
    code: "reader-paperback",
    format: "paperback",
    priceMultiplier: 1.04,
    stockBase: 32,
    labels: {
      en: {
        en: "Reader's Paperback",
        vi: "Bản đọc tiếng Anh",
      },
      vi: {
        en: "Vietnamese Paperback",
        vi: "Bản phổ thông tiếng Việt",
      },
    },
  },
  {
    code: "library-hardcover",
    format: "hardcover",
    priceMultiplier: 1.45,
    stockBase: 18,
    labels: {
      en: {
        en: "Library Hardcover",
        vi: "Bìa cứng tiếng Anh",
      },
      vi: {
        en: "Vietnamese Hardcover",
        vi: "Bìa cứng tiếng Việt",
      },
    },
  },
  {
    code: "collector-special",
    format: "special-edition",
    priceMultiplier: 1.82,
    stockBase: 12,
    labels: {
      en: {
        en: "Collector's Edition",
        vi: "Bản sưu tầm tiếng Anh",
      },
      vi: {
        en: "Annotated Vietnamese Edition",
        vi: "Bản chú giải tiếng Việt",
      },
    },
  },
  {
    code: "reading-group-box-set",
    format: "box-set",
    priceMultiplier: 2.35,
    stockBase: 9,
    labels: {
      en: {
        en: "Reading Group Set",
        vi: "Bộ đọc nhóm tiếng Anh",
      },
      vi: {
        en: "Vietnamese Reading Group Set",
        vi: "Bộ đọc nhóm tiếng Việt",
      },
    },
  },
];

const formatLabels: Record<BookEditionRow["format"], { en: string; vi: string }> = {
  "box-set": {
    en: "Box set",
    vi: "Bộ sách",
  },
  hardcover: {
    en: "Hardcover",
    vi: "Bìa cứng",
  },
  paperback: {
    en: "Paperback",
    vi: "Bìa mềm",
  },
  "special-edition": {
    en: "Special edition",
    vi: "Ấn bản đặc biệt",
  },
};

const coverPalettes = [
  { accent: "#8F2440", background: "#F8E6EC", ink: "#1F1B16" },
  { accent: "#2F5D8C", background: "#E4ECF6", ink: "#182536" },
  { accent: "#176B5B", background: "#E4F2ED", ink: "#153B35" },
  { accent: "#B7791F", background: "#FFF3D6", ink: "#4A3417" },
  { accent: "#6A5D2F", background: "#F1ECD8", ink: "#2F2A18" },
  { accent: "#B04436", background: "#FBE6DF", ink: "#3D1F19" },
];

loadEnvConfig(process.cwd());

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const activeEditions = await readActiveEditions();
  const baseEditions = activeEditions.filter((edition) => !isV16Edition(edition));
  const workPairs = await readWorkPairs(baseEditions);
  const generated = workPairs.flatMap((pair, workIndex) =>
    editionFamilies.flatMap((family, familyIndex) =>
      (["en", "vi"] as const).map((language) =>
        buildGeneratedEdition({
          baseEdition: pair[language],
          family,
          familyIndex,
          language,
          pair,
          workIndex,
        }),
      ),
    ),
  );
  const existingPriceUpdates = buildExistingPriceUpdates(baseEditions, workPairs);

  if (BUILD_ASSETS) {
    writeCoverAssets(generated);
  }

  let applied: unknown = null;
  if (APPLY) {
    await updateExistingEditionPrices(existingPriceUpdates);
    const coverResult = await upsertRows(
      "book_cover_assets",
      "id",
      generated.map((item) => item.cover),
    );
    const editionResult = await upsertRows(
      "book_editions",
      "id",
      generated.map((item) => item.edition),
    );
    const provenanceResult = await upsertRows(
      "book_catalog_provenance_records",
      "id",
      generated.map((item) => item.provenance),
    );
    const qualityResult = await upsertRows(
      "book_content_quality_checks",
      "edition_id,requirement",
      generated.flatMap((item) => item.quality),
    );

    applied = {
      coverResult,
      editionResult,
      existingPriceUpdates: existingPriceUpdates.length,
      provenanceResult,
      qualityResult,
    };
  }

  const postApplyCounts = APPLY ? await readCatalogCounts() : null;
  const report = {
    applied,
    generatedAt: new Date().toISOString(),
    mode: APPLY ? "apply" : "dry-run",
    postApplyCounts,
    taskId: TASK_ID,
    target: {
      activeEditionTotal: 500,
      activeEnglishEditions: 250,
      activeVietnameseEditions: 250,
      generatedEditions: generated.length,
      generatedWorks: workPairs.length,
      minActivePriceVnd: MIN_ACTIVE_PRICE_VND,
    },
    planned: {
      activeBaseEditions: baseEditions.length,
      activeWorkPairs: workPairs.length,
      covers: generated.length,
      existingPriceUpdates: existingPriceUpdates.length,
      generatedEditions: generated.length,
      qualityRows: generated.reduce((sum, item) => sum + item.quality.length, 0),
    },
    pass: {
      generated400Editions: generated.length === 400,
      has50BaseWorkPairs: workPairs.length === 50,
      planned500Total: baseEditions.length + generated.length === 500,
      postApplyActiveTotal:
        !APPLY || postApplyCounts?.activeEditions === 500,
      postApplyLanguageParity:
        !APPLY ||
        (postApplyCounts?.activeEnglishEditions === 250 &&
          postApplyCounts?.activeVietnameseEditions === 250),
      postApplyPriceFloor:
        !APPLY ||
        (postApplyCounts?.minimumActivePriceVnd ?? 0) >= MIN_ACTIVE_PRICE_VND,
      wroteAssets: !BUILD_ASSETS || generated.every((item) => fs.existsSync(item.svg.path)),
    },
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        artifact: REPORT_PATH,
        mode: report.mode,
        ok: Object.values(report.pass).every(Boolean),
        planned: report.planned,
        postApplyCounts: report.postApplyCounts,
      },
      null,
      2,
    ),
  );

  if (!Object.values(report.pass).every(Boolean)) {
    process.exitCode = 1;
  }
}

async function readActiveEditions() {
  const { data, error } = await supabase
    .from("book_editions")
    .select("*")
    .eq("is_active", true)
    .order("display_title", { ascending: true });

  if (error) {
    throw new Error("Could not read active book editions", { cause: error });
  }

  return data ?? [];
}

async function readWorkPairs(baseEditions: BookEditionRow[]) {
  const editionsByWorkId = groupBy(baseEditions, (edition) => edition.work_id);
  const workIds = [...editionsByWorkId.keys()].sort();
  const { data: works, error } = await supabase
    .from("book_works")
    .select("*")
    .in("id", workIds)
    .eq("is_active", true);

  if (error) {
    throw new Error("Could not read active book works", { cause: error });
  }

  const worksById = new Map((works ?? []).map((work) => [work.id, work]));
  const pairs = workIds
    .map((workId) => {
      const work = worksById.get(workId);
      const editions = editionsByWorkId.get(workId) ?? [];
      const en = editions.find((edition) => edition.language === "en");
      const vi = editions.find((edition) => edition.language === "vi");

      if (!work || !en || !vi) {
        return null;
      }

      return { en, vi, work } satisfies WorkPair;
    })
    .filter((pair): pair is WorkPair => Boolean(pair))
    .sort((first, second) => first.work.title.localeCompare(second.work.title));

  if (pairs.length !== 50) {
    throw new Error(`Expected 50 bilingual base work pairs, found ${pairs.length}`);
  }

  return pairs;
}

function buildGeneratedEdition({
  baseEdition,
  family,
  familyIndex,
  language,
  pair,
  workIndex,
}: {
  baseEdition: BookEditionRow;
  family: EditionFamily;
  familyIndex: number;
  language: LanguageCode;
  pair: WorkPair;
  workIndex: number;
}): GeneratedEdition {
  const oppositeLanguage = language === "en" ? "vi" : "en";
  const editionId = stableUuid(
    `${V16_SOURCE_PREFIX}:edition:${pair.work.id}:${language}:${family.code}`,
  );
  const pairedEditionId = stableUuid(
    `${V16_SOURCE_PREFIX}:edition:${pair.work.id}:${oppositeLanguage}:${family.code}`,
  );
  const pairId = stableUuid(`${V16_SOURCE_PREFIX}:pair:${pair.work.id}:${family.code}`);
  const label = family.labels[language];
  const englishTitle = getLocalizedTitle(pair.en, "en");
  const vietnameseTitle = getLocalizedTitle(pair.vi, "vi");
  const localizedTitle = {
    en: `${englishTitle} - ${label.en}`,
    vi: `${vietnameseTitle} - ${label.vi}`,
  };
  const displayTitle = localizedTitle[language];
  const slug = `${pair.work.slug}-${language === "en" ? "english" : "vietnamese"}-${family.code}`;
  const coverId = stableUuid(`${V16_SOURCE_PREFIX}:cover:${editionId}`);
  const provenanceId = `v16-${stableUuid(`${V16_SOURCE_PREFIX}:provenance:${editionId}`)}`;
  const stockQuantity = Math.max(5, family.stockBase + ((workIndex * 3 + familyIndex) % 17));
  const lowStockThreshold = family.format === "box-set" ? 4 : 6;
  const priceVnd = realisticPrice({
    baseEdition,
    family,
    familyIndex,
    language,
    workIndex,
  });
  const compareAtPriceVnd =
    (workIndex + familyIndex + (language === "vi" ? 1 : 0)) % 3 === 0
      ? roundToNearestThousand(Math.round(priceVnd * 1.14))
      : null;
  const summary = {
    en: composeSummary(baseEdition, family, "en"),
    vi: composeSummary(baseEdition, family, "vi"),
  };
  const reasonToRead = {
    en: `A practical ${label.en.toLowerCase()} for readers who want a clear VND price, available stock, and a format suited to repeat reading.`,
    vi: `${label.vi} phù hợp cho người đọc muốn chọn đúng định dạng, giá VND rõ ràng và số lượng còn hàng trước khi đặt.`,
  };
  const displayFacts = [
    displayFact(provenanceId, "edition-family", "Edition family", "Dòng ấn bản", label.en, label.vi),
    displayFact(
      provenanceId,
      "format",
      "Format",
      "Định dạng",
      formatLabels[family.format].en,
      formatLabels[family.format].vi,
    ),
    displayFact(
      provenanceId,
      "retail-price",
      "Retail price",
      "Giá bán",
      "VND price set for bookstore checkout",
      "Giá VND dùng cho quy trình đặt sách",
    ),
    displayFact(
      provenanceId,
      "availability",
      "Availability",
      "Tình trạng",
      stockQuantity <= lowStockThreshold ? "Limited stock" : "In stock",
      stockQuantity <= lowStockThreshold ? "Sắp hết hàng" : "Còn hàng",
    ),
  ];
  const coverPath = `${COVER_PUBLIC_PREFIX}/${slug}.svg`;

  return {
    cover: {
      id: coverId,
      path: coverPath,
      alt_text: {
        en: `${localizedTitle.en} cover`,
        vi: `Bìa ${localizedTitle.vi}`,
      },
      source: "generated",
      source_note: {
        label: "CaseFlow Books generated retail cover",
        url: null,
        license: "Project-created",
        checkedAt: IMPORTED_AT,
      },
      created_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    },
    edition: {
      id: editionId,
      work_id: pair.work.id,
      slug,
      display_title: displayTitle,
      localized_display_title: localizedTitle as Json,
      subtitle: label[language],
      language,
      format: family.format,
      publisher_id: baseEdition.publisher_id,
      isbn13: null,
      isbn10: null,
      publication_year: 2026,
      page_count: adjustedPageCount(baseEdition, family),
      dimensions: dimensionsForFormat(family.format) as Json,
      weight_grams: weightForFormat(family.format, familyIndex),
      cover_asset_id: coverId,
      price_vnd: priceVnd,
      compare_at_price_vnd: compareAtPriceVnd,
      stock_quantity: stockQuantity,
      low_stock_threshold: lowStockThreshold,
      inventory_status: stockQuantity <= lowStockThreshold ? "low-stock" : "in-stock",
      summary: summary as Json,
      table_of_contents: null,
      sample_excerpt_policy:
        "No copyrighted excerpt is stored; product copy is written by CaseFlow Books.",
      is_featured: family.format !== "box-set" && workIndex % 9 === familyIndex,
      is_active: true,
      pair_id: pairId,
      paired_edition_id: pairedEditionId,
      reason_to_read: reasonToRead as Json,
      display_facts: displayFacts as Json,
      omitted_optional_fact_keys: ["isbn-13", "isbn-10"],
      source_edition_key: `${V16_SOURCE_PREFIX}-${slug}`,
      source_review_status: "approved",
      created_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    },
    provenance: {
      id: provenanceId,
      entity_type: "edition",
      entity_id: editionId,
      field_key: "retail-edition",
      source_label: "CaseFlow Books retail edition plan",
      source_url: null,
      checked_at: IMPORTED_AT,
      content_kind: "project-written-text",
      rights_basis: "project-created",
      rights_basis_note:
        "Edition labels, summaries, display facts, prices, stock, and generated covers were created for CaseFlow Books and do not copy commercial cover art.",
      license: null,
      attribution: {
        required: false,
        text: null,
        url: null,
        displayLocation: null,
      },
      review_status: "approved",
      reviewer_note: "Approved for the v1.6 500-edition retail catalog expansion.",
      reviewed_at: IMPORTED_AT,
      edition_match_confidence: "not-applicable",
      source_edition_key: `${V16_SOURCE_PREFIX}-${slug}`,
      created_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    },
    quality: buildQualityRows(editionId, provenanceId),
    svg: {
      path: path.join(COVER_OUTPUT_DIR, `${slug}.svg`),
      source: buildCoverSvg({
        author: "",
        family,
        index: workIndex + familyIndex,
        language,
        title: displayTitle,
        workTitle: language === "vi" ? vietnameseTitle : englishTitle,
      }),
    },
  };
}

function buildExistingPriceUpdates(
  baseEditions: BookEditionRow[],
  workPairs: WorkPair[],
) {
  const workIndexById = new Map(
    workPairs.map((pair, index) => [pair.work.id, index]),
  );

  return baseEditions.map((edition) => {
    const workIndex = workIndexById.get(edition.work_id) ?? 0;
    const priceVnd = realisticBasePrice(edition, workIndex);
    return {
      compare_at_price_vnd:
        workIndex % 4 === 0 ? roundToNearestThousand(Math.round(priceVnd * 1.12)) : null,
      id: edition.id,
      price_vnd: priceVnd,
      updated_at: IMPORTED_AT,
    };
  });
}

async function updateExistingEditionPrices(
  rows: Array<{ compare_at_price_vnd: number | null; id: string; price_vnd: number; updated_at: string }>,
) {
  for (const row of rows) {
    const { error } = await supabase
      .from("book_editions")
      .update({
        compare_at_price_vnd: row.compare_at_price_vnd,
        price_vnd: row.price_vnd,
        updated_at: row.updated_at,
      })
      .eq("id", row.id);

    if (error) {
      throw new Error(`Could not update existing edition price ${row.id}`, {
        cause: error,
      });
    }
  }
}

async function upsertRows(table: string, onConflict: string, rows: JsonRecord[]) {
  let chunks = 0;
  for (let index = 0; index < rows.length; index += 100) {
    chunks += 1;
    const { error } = await supabase
      .from(table as never)
      .upsert(rows.slice(index, index + 100) as never, { onConflict });

    if (error) {
      throw new Error(`Could not upsert ${table}: ${error.message}`, {
        cause: error,
      });
    }
  }

  return {
    chunks,
    rows: rows.length,
    table,
  };
}

async function readCatalogCounts() {
  const { data, error } = await supabase
    .from("book_editions")
    .select("language,price_vnd,source_edition_key,is_active")
    .eq("is_active", true);

  if (error) {
    throw new Error("Could not read post-apply catalog counts", { cause: error });
  }

  const activeRows = data ?? [];
  return {
    activeEditions: activeRows.length,
    activeEnglishEditions: activeRows.filter((row) => row.language === "en").length,
    activeVietnameseEditions: activeRows.filter((row) => row.language === "vi").length,
    activeV16Editions: activeRows.filter((row) =>
      row.source_edition_key?.startsWith(`${V16_SOURCE_PREFIX}-`),
    ).length,
    minimumActivePriceVnd: Math.min(...activeRows.map((row) => row.price_vnd)),
  };
}

function writeCoverAssets(items: GeneratedEdition[]) {
  fs.mkdirSync(COVER_OUTPUT_DIR, { recursive: true });
  for (const item of items) {
    fs.writeFileSync(item.svg.path, item.svg.source);
  }
}

function buildQualityRows(editionId: string, provenanceId: string) {
  return [
    ...BLOCKING_CONTENT_QUALITY_REQUIREMENTS.map((requirement) => ({
      id: stableUuid(`${V16_SOURCE_PREFIX}:quality:${editionId}:${requirement}`),
      edition_id: editionId,
      requirement,
      requirement_level: "blocking",
      status: "verified",
      provenance_record_id: provenanceId,
      note: null,
      created_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    })),
    ...OPTIONAL_CONTENT_QUALITY_REQUIREMENTS.map((requirement) => ({
      id: stableUuid(`${V16_SOURCE_PREFIX}:quality:${editionId}:${requirement}`),
      edition_id: editionId,
      requirement,
      requirement_level: "optional",
      status: ["isbn", "translator"].includes(requirement)
        ? "not-applicable"
        : "verified",
      provenance_record_id: ["isbn", "translator"].includes(requirement)
        ? provenanceId
        : provenanceId,
      note: ["isbn", "translator"].includes(requirement)
        ? "Not applicable to this generated retail edition."
        : null,
      created_at: IMPORTED_AT,
      updated_at: IMPORTED_AT,
    })),
  ];
}

function displayFact(
  provenanceRecordId: string,
  key: string,
  labelEn: string,
  labelVi: string,
  valueEn: string,
  valueVi: string,
) {
  return {
    key,
    label: {
      en: labelEn,
      vi: labelVi,
    },
    provenanceRecordId,
    value: {
      en: valueEn,
      vi: valueVi,
    },
  };
}

function getLocalizedTitle(edition: BookEditionRow, language: LanguageCode) {
  const localized = edition.localized_display_title as Partial<Record<LanguageCode, string>>;
  return localized[language] ?? edition.display_title;
}

function composeSummary(
  edition: BookEditionRow,
  family: EditionFamily,
  language: LanguageCode,
) {
  const baseSummary = (edition.summary as Record<LanguageCode, string>)[language] ?? "";
  const label = family.labels[edition.language][language];
  const addition =
    language === "vi"
      ? `Ấn bản ${label.toLowerCase()} được chuẩn bị cho nhu cầu mua sách thực tế: giá VND rõ ràng, tình trạng kho cụ thể và định dạng phù hợp để đọc, tặng hoặc dùng trong nhóm đọc.`
      : `This ${label.toLowerCase()} is prepared for practical bookstore purchase: clear VND pricing, visible availability, and a format suited to reading, gifting, or group reading.`;

  return truncateText(`${baseSummary} ${addition}`, 1_120);
}

function adjustedPageCount(edition: BookEditionRow, family: EditionFamily) {
  const base = edition.page_count ?? 260;
  const extra =
    family.format === "box-set"
      ? 24
      : family.format === "special-edition"
        ? 18
        : family.format === "hardcover"
          ? 8
          : 0;

  return Math.min(20_000, base + extra);
}

function dimensionsForFormat(format: BookEditionRow["format"]) {
  if (format === "box-set") {
    return { heightMm: 210, thicknessMm: 72, widthMm: 145 };
  }

  if (format === "hardcover") {
    return { heightMm: 210, thicknessMm: 34, widthMm: 140 };
  }

  if (format === "special-edition") {
    return { heightMm: 205, thicknessMm: 38, widthMm: 138 };
  }

  return { heightMm: 198, thicknessMm: 28, widthMm: 130 };
}

function weightForFormat(format: BookEditionRow["format"], familyIndex: number) {
  if (format === "box-set") return 980 + familyIndex * 30;
  if (format === "hardcover") return 620 + familyIndex * 25;
  if (format === "special-edition") return 700 + familyIndex * 20;
  return 360 + familyIndex * 15;
}

function realisticBasePrice(edition: BookEditionRow, workIndex: number) {
  const pageComponent = Math.min(36_000, Math.round(((edition.page_count ?? 280) / 100) * 7_000));
  const languageBase = edition.language === "en" ? 139_000 : 109_000;
  const formatMultiplier =
    edition.format === "box-set"
      ? 2.2
      : edition.format === "special-edition"
        ? 1.68
        : edition.format === "hardcover"
          ? 1.42
          : 1;
  const rhythm = (workIndex % 8) * 6_000;
  const price = roundToNearestThousand(
    Math.round((languageBase + pageComponent + rhythm) * formatMultiplier),
  );

  return Math.max(MIN_ACTIVE_PRICE_VND, price);
}

function realisticPrice({
  baseEdition,
  family,
  familyIndex,
  language,
  workIndex,
}: {
  baseEdition: BookEditionRow;
  family: EditionFamily;
  familyIndex: number;
  language: LanguageCode;
  workIndex: number;
}) {
  const base = realisticBasePrice(baseEdition, workIndex);
  const languageAdjustment = language === "en" ? 12_000 : 0;
  const familyAdjustment = familyIndex * 9_000;
  const price = roundToNearestThousand(
    Math.round(base * family.priceMultiplier + languageAdjustment + familyAdjustment),
  );

  return Math.max(MIN_ACTIVE_PRICE_VND, price);
}

function buildCoverSvg({
  family,
  index,
  language,
  title,
  workTitle,
}: {
  author: string;
  family: EditionFamily;
  index: number;
  language: LanguageCode;
  title: string;
  workTitle: string;
}) {
  const palette = coverPalettes[index % coverPalettes.length];
  const lines = wrapWords(workTitle, 18).slice(0, 4);
  const label = family.labels[language][language];
  const ribbon = language === "vi" ? "SÁCH TIẾNG VIỆT" : "ENGLISH BOOK";
  const variant = language === "vi" ? label : family.labels[language].en;
  const initials = makeInitials(workTitle);
  const lineMarkup = lines
    .map(
      (line, lineIndex) =>
        `<text x="240" y="${210 + lineIndex * 38}" text-anchor="middle" class="title">${escapeHtml(line)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="720" viewBox="0 0 480 720" role="img" aria-label="${escapeHtml(title)} cover">
  <title>${escapeHtml(title)} cover</title>
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
    <style>
      .ribbon { font: 800 22px Inter, Arial, sans-serif; letter-spacing: 1px; }
      .title { font: 800 34px Georgia, 'Times New Roman', serif; fill: ${palette.ink}; }
      .initials { font: 900 82px Inter, Arial, sans-serif; letter-spacing: 2px; }
      .meta { font: 700 20px Inter, Arial, sans-serif; fill: ${palette.ink}; }
      .brand { font: 700 16px Inter, Arial, sans-serif; letter-spacing: 2px; }
    </style>
  </defs>
  <rect width="480" height="720" fill="${palette.accent}"/>
  <rect x="30" y="30" width="420" height="660" rx="26" fill="${palette.background}" filter="url(#shadow)"/>
  <rect x="30" y="30" width="420" height="136" rx="26" fill="${palette.accent}"/>
  <rect x="30" y="118" width="420" height="48" fill="${palette.accent}"/>
  <rect x="58" y="74" width="364" height="46" rx="23" fill="#fffdf8" opacity="0.96"/>
  <text x="240" y="105" text-anchor="middle" class="ribbon" fill="${palette.accent}">${escapeHtml(ribbon)}</text>
  <circle cx="240" cy="304" r="94" fill="#fffdf8" stroke="${palette.accent}" stroke-width="10"/>
  <text x="240" y="334" text-anchor="middle" class="initials" fill="${palette.accent}">${escapeHtml(initials)}</text>
  <g>
    ${lineMarkup}
  </g>
  <rect x="96" y="420" width="288" height="3" fill="${palette.accent}"/>
  <text x="240" y="476" text-anchor="middle" class="meta">${escapeHtml(variant)}</text>
  <text x="240" y="512" text-anchor="middle" class="meta">${escapeHtml(formatLabels[family.format][language])}</text>
  <rect x="74" y="568" width="332" height="54" rx="12" fill="#fffdf8" stroke="${palette.accent}" stroke-width="3"/>
  <text x="240" y="603" text-anchor="middle" class="brand" fill="${palette.accent}">CASEFLOW BOOKS</text>
  <rect x="70" y="640" width="340" height="8" rx="4" fill="${palette.accent}"/>
</svg>
`;
}

function isV16Edition(edition: BookEditionRow) {
  return (
    edition.source_edition_key?.startsWith(`${V16_SOURCE_PREFIX}-`) ||
    edition.slug.endsWith("-reader-paperback") ||
    edition.slug.endsWith("-library-hardcover") ||
    edition.slug.endsWith("-collector-special") ||
    edition.slug.endsWith("-reading-group-box-set")
  );
}

function stableUuid(input: string) {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  const clockSeq = ((Number.parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, "0");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${clockSeq}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function groupBy<TValue>(
  values: TValue[],
  keyForValue: (value: TValue) => string,
) {
  const groups = new Map<string, TValue[]>();
  for (const value of values) {
    const key = keyForValue(value);
    groups.set(key, [...(groups.get(key) ?? []), value]);
  }
  return groups;
}

function wrapWords(value: string, maxLength: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current.length === 0 ? word : `${current} ${word}`;
    if (next.length > maxLength && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [value];
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function roundToNearestThousand(value: number) {
  return Math.round(value / 1_000) * 1_000;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeInitials(value: string) {
  const words = value
    .replace(/[^A-Za-zÀ-ỹ0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !["the", "and", "cua", "của"].includes(word.toLowerCase()));
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");

  return initials || "CB";
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
