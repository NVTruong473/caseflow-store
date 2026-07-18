import fs from "node:fs";
import path from "node:path";

import {
  bookAuthors,
  bookCategories,
  bookEditions,
  bookWorks,
} from "../src/data/books/seed";
import { canonicalVietnameseContentByWorkSlug } from "../src/data/books/v1.2-catalog-content";
import { canonicalCatalogManifestSchema } from "../src/lib/validation/canonical-catalog";
import type {
  CanonicalBibliographicFacts,
  CanonicalCatalogManifest,
  CanonicalCatalogWork,
  CanonicalEditionManifestItem,
} from "../src/types/canonical-catalog";
import type {
  BookCategorySlug,
  BookEdition,
  EditionLanguage,
} from "../src/types/domain";
import type {
  CatalogProvenanceRecord,
  EditionFieldProvenance,
  EditionSourceFactField,
} from "../src/types/content-provenance";

const TASK_ID = "V12-T05" as const;
const CURATED_AT = "2026-07-17T00:00:00.000Z";
const REVIEWED_AT = "2026-07-17T02:00:00.000Z";
const CANDIDATE_PATH = path.join(
  process.cwd(),
  ".agent/artifacts/v12-t05/open-library-edition-candidates.json",
);
const OUTPUT_PATH = path.join(
  process.cwd(),
  "src/data/books/v1.2-canonical-manifest.json",
);

type CandidateSource = {
  provider: string;
  key: string;
  url: string;
  title: string;
  subtitle: string | null;
  language: EditionLanguage;
  publishers: string[];
  publishDate: string | null;
  pageCount: number | null;
  physicalFormat: string | null;
  isbn10: string[];
  isbn13: string[];
  byStatement: string | null;
  weight: string | null;
  physicalDimensions: string | null;
  score: number;
};

type CandidateArtifact = {
  works: Array<{
    workSlug: string;
    editions: Record<EditionLanguage, { source: CandidateSource | null }>;
  }>;
};

type SourceOverride = CandidateSource & {
  sourceLabel: string;
  translatorNames?: string[];
  matchConfidence?: "medium" | "high" | "exact";
  reviewerNote: string;
};

const SOURCE_OVERRIDES: Record<string, SourceOverride> = {
  "wuthering-heights:en": manualGoogleSource({
    key: "3XBxMqWG72sC",
    title: "Wuthering Heights",
    language: "en",
    publishers: ["Scholastic Inc."],
    publishDate: "2003-03",
    pageCount: 418,
    isbn10: ["0439228913"],
    isbn13: ["9780439228916"],
    reviewerNote:
      "Exact standalone edition selected instead of a combined Wuthering Heights and Poems record.",
  }),
  "oliver-twist:en": manualGoogleSource({
    key: "8Lx8BgAAQBAJ",
    title: "Oliver Twist",
    language: "en",
    publishers: ["Open Road Media"],
    publishDate: "2015-02-24",
    pageCount: 466,
    isbn10: ["1504005554"],
    isbn13: ["9781504005555"],
    reviewerNote:
      "Full-length exact-title edition selected instead of the 64-page candidate.",
  }),
  "a-tale-of-two-cities:en": manualGoogleSource({
    key: "i6r6Oyf7RpAC",
    title: "A Tale of Two Cities",
    language: "en",
    publishers: ["Wordsworth Editions"],
    publishDate: "1993",
    pageCount: 356,
    isbn10: ["1853260398"],
    isbn13: ["9781853260391"],
    reviewerNote:
      "Full-length Wordsworth edition selected instead of the 96-page candidate.",
  }),
  "the-war-of-the-worlds:en": manualGoogleSource({
    key: "C55lAAAAMAAJ",
    title: "The War of the Worlds",
    language: "en",
    publishers: ["Penguin Classics"],
    publishDate: "2005-05-04",
    pageCount: 248,
    reviewerNote:
      "Standalone Penguin Classics edition selected instead of a Great Illustrated Classics record.",
  }),
  "alice-in-wonderland:en": manualGoogleSource({
    key: "ZdfWEAAAQBAJ",
    title: "Alice's Adventures in Wonderland",
    language: "en",
    publishers: ["Xist Publishing"],
    publishDate: "2017-11-01",
    pageCount: 93,
    isbn10: ["1532404433"],
    isbn13: ["9781532404436"],
    reviewerNote:
      "Exact standalone edition selected instead of a multi-work authoritative-text collection.",
  }),
  "the-wonderful-wizard-of-oz:en": manualGoogleSource({
    key: "LmKCDwAAQBAJ",
    title: "The Wonderful Wizard of Oz",
    language: "en",
    publishers: ["Simon and Schuster"],
    publishDate: "2017-05-09",
    pageCount: 356,
    isbn10: ["1944686894"],
    isbn13: ["9781944686895"],
    reviewerNote:
      "Exact standalone edition selected instead of a volume combined with Glinda of Oz.",
  }),
  "the-call-of-the-wild:en": manualGoogleSource({
    key: "j6L-qusnoTUC",
    title: "The Call of the Wild",
    language: "en",
    publishers: ["Scholastic Inc."],
    publishDate: "2000",
    pageCount: 190,
    isbn10: ["0439227143"],
    isbn13: ["9780439227148"],
    reviewerNote:
      "Exact standalone edition selected instead of a volume combined with White Fang.",
  }),
  "a-christmas-carol:en": manualGoogleSource({
    key: "mY2MEAAAQBAJ",
    title: "Penguin English Library A Christmas Carol",
    language: "en",
    publishers: ["Penguin English Library"],
    publishDate: "2012-12-25",
    isbn10: ["0141389478"],
    isbn13: ["9780141389479"],
    reviewerNote:
      "Exact Penguin English Library edition selected instead of a record with an unrelated bilingual subtitle.",
  }),
  "the-wealth-of-nations:en": manualGoogleSource({
    key: "0BshzCSOcx4C",
    title: "The Wealth of Nations",
    language: "en",
    publishers: ["Modern Library"],
    publishDate: "2000-11-01",
    pageCount: 1185,
    isbn10: ["0679641920"],
    isbn13: ["9780679641926"],
    reviewerNote:
      "Complete full-length edition selected instead of a Penguin Books 1-3 partial volume.",
  }),
  "jane-eyre:vi": manualGoogleSource({
    key: "jwXFxQEACAAJ",
    title: "Jane Eyre",
    language: "vi",
    publishers: ["Nhà Xuất Bản Văn Học"],
    publishDate: "2018",
    pageCount: 574,
    isbn10: ["6046954363"],
    isbn13: ["9786046954361"],
    reviewerNote:
      "Selected instead of the Open Library Kiều Giang adaptation so the item remains an edition of Jane Eyre.",
  }),
  "wuthering-heights:vi": manualRetailSource({
    provider: "minh-khai-books",
    key: "isbn-8935235241404",
    url: "https://minhkhai.com.vn/store2/index.aspx?isbn=8935235241404&q=view",
    sourceLabel: "Minh Khai Books",
    title: "Đồi Gió Hú (Tái Bản)",
    language: "vi",
    publishers: ["NXB Văn học"],
    publishDate: "3/2024",
    pageCount: 489,
    physicalFormat: "paperback",
    byStatement: "Emily Bronte; Dương Tường",
    translatorNames: ["Dương Tường"],
    reviewerNote:
      "Exact Vietnamese retail edition page selected instead of an Open Library record with an unusable publisher abbreviation.",
  }),
  "frankenstein:vi": manualOpenLibrarySource({
    key: "/books/OL54775364M",
    title: "Frankenstein (Vietnamese Edition)",
    language: "vi",
    publishers: ["CreateSpace Independent Publishing Platform"],
    publishDate: "2014",
    pageCount: 220,
    isbn13: ["9781502376039"],
    physicalFormat: null,
    reviewerNote:
      "Exact Vietnamese-language edition retained after the stricter candidate query omitted it.",
  }),
  "around-the-world-in-eighty-days:vi": manualRetailSource({
    provider: "fahasa",
    key: "vong-quanh-the-gioi-trong-80-ngay",
    url: "https://www.fahasa.com/vong-quanh-the-gioi-trong-80-ngay.html",
    sourceLabel: "Fahasa",
    title: "Vòng Quanh Thế Giới Trong 80 Ngày",
    language: "vi",
    publishers: ["NXB Văn Học"],
    physicalFormat: "paperback",
    byStatement: "Jules Gabriel Verne; Duy Lập",
    translatorNames: ["Duy Lập"],
    reviewerNote:
      "Exact Vietnamese retail edition page; optional identifiers remain null because the page did not expose them reliably.",
  }),
  "journey-to-the-center-of-the-earth:vi": manualGoogleSource({
    key: "FHzvtgAACAAJ",
    title: "Hành trình vào tâm trái đất",
    language: "vi",
    publishDate: "2007",
    pageCount: 429,
    reviewerNote:
      "Exact Vietnamese title and author match; the source exposes page count but no verified ISBN.",
  }),
  "the-war-of-the-worlds:vi": manualRetailSource({
    provider: "sach-tieng-viet",
    key: "chien-tranh-giua-cac-the-gioi-p253311645",
    url: "https://sachtiengviet.com/products/chien-tranh-giua-cac-the-gioi-p253311645",
    sourceLabel: "Sách Tiếng Việt",
    title: "Chiến Tranh Giữa Các Thế Giới",
    language: "vi",
    publishers: ["NXB Lao Động"],
    byStatement: "H. G. Wells",
    reviewerNote:
      "Exact Vietnamese retail edition page; store price and availability were deliberately not imported.",
  }),
  "the-brothers-karamazov:vi": manualGoogleSource({
    key: "r577zgEACAAJ",
    title: "Anh em nhà Karamazov",
    language: "vi",
    publishDate: "2021",
    pageCount: 845,
    isbn10: ["6045588568"],
    isbn13: ["9786045588567"],
    reviewerNote: "Exact Vietnamese edition with internally consistent ISBN and pagination.",
  }),
  "anna-karenina:vi": manualRetailSource({
    provider: "minh-khai-books",
    key: "isbn-8936049951046",
    url: "https://minhkhai.com.vn/store2/index.aspx?isbn=8936049951046&q=view",
    sourceLabel: "Minh Khai Books",
    title: "Anna Karenina",
    language: "vi",
    isbn13: ["8936049951046"],
    reviewerNote:
      "Whole-edition retail record selected over volume-one library records; optional facts not shown by this page remain null.",
  }),
  "the-metamorphosis:vi": manualRetailSource({
    provider: "nha-nam",
    key: "review-sach-hoa-than-franz-kafka-3",
    url: "https://nhanam.vn/review-sach-hoa-than-franz-kafka-3",
    sourceLabel: "Nhã Nam",
    title: "Hóa thân",
    language: "vi",
    byStatement: "Franz Kafka; Đức Tài dịch",
    translatorNames: ["Đức Tài"],
    matchConfidence: "high",
    reviewerNote:
      "Publisher page confirms the Vietnamese title and translator; ISBN, date, and page count remain null because this is not a full edition record.",
  }),
  "meditations:vi": manualGoogleSource({
    key: "PSrJ0QEACAAJ",
    title: "Suy tưởng",
    language: "vi",
    publishDate: "2025",
    isbn10: ["6044841553"],
    isbn13: ["9786044841557"],
    reviewerNote:
      "Exact Vietnamese edition; a source page count of zero is treated as unavailable rather than as a factual value.",
  }),
  "the-divine-comedy:vi": manualRetailSource({
    provider: "neta-books",
    key: "than-khuc-bia-cung",
    url: "https://www.netabooks.vn/than-khuc-bia-cung",
    sourceLabel: "NetaBooks",
    title: "Thần Khúc",
    language: "vi",
    physicalFormat: "hardcover",
    byStatement: "Dante Alighieri; Nguyễn Văn Hoàn dịch",
    translatorNames: ["Nguyễn Văn Hoàn"],
    reviewerNote:
      "Full three-part Vietnamese translation selected; unsupported ISBN and pagination remain null.",
  }),
  "the-odyssey:vi": manualRetailSource({
    provider: "vov-library",
    key: "book-2462",
    url: "https://thuvien.vov.gov.vn/Book.aspx?id=2462",
    sourceLabel: "Thư viện VOV",
    title: "Odyssey",
    language: "vi",
    publishers: ["NXB Thế giới"],
    publishDate: "2013",
    pageCount: 672,
    reviewerNote:
      "Exact Vietnamese library record with publisher, year, and page count; no ISBN is asserted.",
  }),
  "the-old-man-and-the-sea:en": manualGoogleSource({
    key: "NubsDwAAQBAJ",
    title: "The Old Man and the Sea",
    language: "en",
    publishers: ["Scribner"],
    publishDate: "2020-07-21",
    pageCount: 160,
    isbn10: ["1476787840"],
    isbn13: ["9781476787848"],
    reviewerNote: "Exact English Scribner edition with complete core bibliographic identifiers.",
  }),
  "the-old-man-and-the-sea:vi": manualGoogleSource({
    key: "nLyHzwEACAAJ",
    title: "Ông già và biển cả",
    language: "vi",
    publishDate: "2022",
    isbn10: ["6043498367"],
    isbn13: ["9786043498363"],
    reviewerNote:
      "Exact Vietnamese edition; a source page count of zero is treated as unavailable.",
  }),
};

const TRANSLATOR_OVERRIDES: Record<string, string[]> = {
  "pride-and-prejudice:vi": ["Diệp Minh Tâm"],
  "the-wonderful-wizard-of-oz:vi": ["Nguyễn Phương Liên"],
  "the-secret-garden:vi": ["Nguyễn Tuấn Khanh"],
  "adventures-of-huckleberry-finn:vi": ["Lương Thị Thận"],
  "crime-and-punishment:vi": ["Cao Xuân Hạo", "Cao Xuân Phổ"],
  "war-and-peace:vi": ["Nguyễn Hiến Lê"],
  "siddhartha:vi": ["Bùi Giáng"],
  "tao-te-ching:vi": ["Vũ Thế Ngọc"],
  "don-quixote:vi": ["Trương Đắc Vị"],
};

function main() {
  const candidateArtifact = JSON.parse(
    fs.readFileSync(CANDIDATE_PATH, "utf8"),
  ) as CandidateArtifact;
  const candidateByKey = new Map<string, CandidateSource | null>();
  for (const work of candidateArtifact.works) {
    for (const language of ["en", "vi"] as const) {
      candidateByKey.set(
        `${work.workSlug}:${language}`,
        work.editions[language].source,
      );
    }
  }

  const authorNameById = new Map(
    bookAuthors.map((author) => [author.id, author.name]),
  );
  const categorySlugById = new Map(
    bookCategories.map((category) => [category.id, category.slug]),
  );
  const retainedWorks = bookWorks.filter(
    (work) => work.slug !== "the-elements-of-style",
  );
  const works: CanonicalCatalogWork[] = [];
  const editions: CanonicalEditionManifestItem[] = [];

  retainedWorks.forEach((work, index) => {
    const authors = work.primaryAuthorIds.map((authorId) =>
      required(authorNameById.get(authorId), `Missing author ${authorId}`),
    );
    const categorySlugs = work.categoryIds.map((categoryId) =>
      required(categorySlugById.get(categoryId), `Missing category ${categoryId}`),
    );
    const content = required(
      canonicalVietnameseContentByWorkSlug[work.slug],
      `Missing Vietnamese content for ${work.slug}`,
    );
    const pairId = stableUuid(6_000 + index);
    const pairEditions = (["en", "vi"] as const).map((language) =>
      required(
        bookEditions.find(
          (edition) => edition.workId === work.id && edition.language === language,
        ),
        `Missing ${language} edition for ${work.slug}`,
      ),
    );

    works.push({
      id: work.id,
      slug: work.slug,
      title: { en: work.title, vi: content.title },
      authors,
      categorySlugs,
      summary: { en: work.canonicalSummary.en, vi: content.summary },
      editionIds: [pairEditions[0].id, pairEditions[1].id],
    });

    pairEditions.forEach((seedEdition) => {
      editions.push(
        buildEdition({
          workSlug: work.slug,
          workId: work.id,
          pairId,
          pairedEditionId: required(
            pairEditions.find((edition) => edition.language !== seedEdition.language),
            `Missing pair for ${seedEdition.slug}`,
          ).id,
          englishTitle: work.title,
          vietnameseTitle: content.title,
          englishSummary: work.canonicalSummary.en,
          vietnameseSummary: content.summary,
          authors,
          categorySlugs,
          seedEdition,
          source: resolveSource(
            work.slug,
            seedEdition.language,
            candidateByKey,
          ),
          ordinal: editions.length,
        }),
      );
    });
  });

  appendOldManAndTheSea({ works, editions });

  const manifest: CanonicalCatalogManifest = {
    taskId: TASK_ID,
    version: "1.2",
    curatedAt: CURATED_AT,
    policyDocument: "docs/v1.2-provenance-content-quality-contracts.md",
    runtimeStatus: "curated-not-yet-imported",
    works,
    editions,
    compatibility: buildCompatibilityEntries(),
  };

  const parsed = canonicalCatalogManifestSchema.parse(manifest);
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(parsed, null, 2)}\n`);
  process.stdout.write(
    `Wrote ${parsed.works.length} works and ${parsed.editions.length} editions to ${path.relative(process.cwd(), OUTPUT_PATH)}\n`,
  );
}

function buildEdition(input: {
  workSlug: string;
  workId: string;
  pairId: string;
  pairedEditionId: string;
  englishTitle: string;
  vietnameseTitle: string;
  englishSummary: string;
  vietnameseSummary: string;
  authors: string[];
  categorySlugs: BookCategorySlug[];
  seedEdition: BookEdition;
  source: SourceOverride;
  ordinal: number;
}): CanonicalEditionManifestItem {
  const bibliographic = buildBibliographicFacts(input.source);
  const languageLabel = input.seedEdition.language === "en" ? "English" : "Vietnamese";
  const languageLabelVi = input.seedEdition.language === "en" ? "tiếng Anh" : "tiếng Việt";
  const provenance = buildProvenance(
    input.seedEdition.id,
    bibliographic,
    input.ordinal,
  );

  return {
    id: input.seedEdition.id,
    workId: input.workId,
    pairId: input.pairId,
    pairedEditionId: input.pairedEditionId,
    slug: input.seedEdition.slug,
    language: input.seedEdition.language,
    displayTitle: { en: input.englishTitle, vi: input.vietnameseTitle },
    authors: input.authors,
    categorySlugs: input.categorySlugs,
    summary: { en: input.englishSummary, vi: input.vietnameseSummary },
    merchandisingRationale: {
      en: `${languageLabel} edition of ${input.englishTitle} for readers comparing the work across both catalog languages.`,
      vi: `Ấn bản ${languageLabelVi} của ${input.vietnameseTitle}, dành cho độc giả muốn đọc và đối chiếu tác phẩm ở cả hai ngôn ngữ trong danh mục.`,
    },
    bibliographic,
    store: {
      dataOwner: "caseflow-books",
      basis: "editorial-merchandising-decision",
      format: input.seedEdition.format,
      priceVnd: input.seedEdition.priceVnd,
      compareAtPriceVnd: input.seedEdition.compareAtPriceVnd,
      stockQuantity: input.seedEdition.stockQuantity,
      lowStockThreshold: 10,
      inventoryStatus: input.seedEdition.inventoryStatus,
      availability:
        input.seedEdition.inventoryStatus === "out-of-stock"
          ? "temporarily-unavailable"
          : input.seedEdition.inventoryStatus === "preorder"
            ? "preorder"
            : "available",
      promotionEligible: input.seedEdition.compareAtPriceVnd !== null,
      isFeatured: input.seedEdition.isFeatured,
    },
    provenance,
  };
}

function buildBibliographicFacts(source: SourceOverride): CanonicalBibliographicFacts {
  return {
    sourceEditionKey: `${source.provider}:${source.key}`
      .toLowerCase()
      .replace(/[^a-z0-9._:/-]+/g, "-"),
    sourceLabel: source.sourceLabel,
    sourceUrl: source.url,
    checkedAt: CURATED_AT,
    matchConfidence: source.matchConfidence ?? "high",
    sourceTitle: source.title,
    subtitle: source.subtitle,
    publisherName: normalizePublisherName(source.publishers[0] ?? null),
    translatorNames: source.translatorNames ?? [],
    isbn13: source.isbn13.find(isValidIsbn13) ?? null,
    isbn10: source.isbn10.find(isValidIsbn10) ?? null,
    publicationYear: parsePublicationYear(source.publishDate),
    pageCount:
      source.pageCount !== null && source.pageCount > 0 ? source.pageCount : null,
    dimensions: null,
    weightGrams: null,
    sourcePhysicalFormat: source.physicalFormat,
    reviewerNote: source.reviewerNote,
  };
}

function buildProvenance(
  editionId: string,
  facts: CanonicalBibliographicFacts,
  ordinal: number,
) {
  const factValues: Array<[EditionSourceFactField, unknown]> = [
    ["display-title", facts.sourceTitle],
    ["subtitle", facts.subtitle],
    ["format", facts.sourcePhysicalFormat],
    ["publisher", facts.publisherName],
    ["isbn-13", facts.isbn13],
    ["isbn-10", facts.isbn10],
    ["publication-year", facts.publicationYear],
    ["page-count", facts.pageCount],
    ["dimensions", facts.dimensions],
    ["weight-grams", facts.weightGrams],
    ["translators", facts.translatorNames.length > 0 ? facts.translatorNames : null],
  ];
  const provenanceFacts = factValues
    .filter(([, value]) => value !== null)
    .map(([field], factIndex): EditionFieldProvenance => ({
      field,
      provenance: buildProvenanceRecord({
        id: stableUuid(10_000 + ordinal * 20 + factIndex),
        editionId,
        field,
        facts,
      }),
    }));

  return { editionId, facts: provenanceFacts };
}

function buildProvenanceRecord(input: {
  id: string;
  editionId: string;
  field: EditionSourceFactField;
  facts: CanonicalBibliographicFacts;
}): CatalogProvenanceRecord {
  return {
    id: input.id,
    entityType: "edition",
    entityId: input.editionId,
    fieldKey: input.field,
    sourceLabel: input.facts.sourceLabel,
    sourceUrl: input.facts.sourceUrl,
    checkedAt: input.facts.checkedAt,
    contentKind: "bibliographic-fact",
    rightsBasis: "factual-data",
    rightsBasisNote:
      "Edition-level factual metadata was reviewed from the named source; no description or cover artwork was copied.",
    license: null,
    attribution: {
      required: false,
      text: null,
      url: null,
      displayLocation: null,
    },
    reviewStatus: "approved",
    reviewerNote: input.facts.reviewerNote,
    reviewedAt: REVIEWED_AT,
    editionMatchConfidence: input.facts.matchConfidence,
    sourceEditionKey: input.facts.sourceEditionKey,
  };
}

function appendOldManAndTheSea(input: {
  works: CanonicalCatalogWork[];
  editions: CanonicalEditionManifestItem[];
}) {
  const workId = stableUuid(7_000);
  const pairId = stableUuid(7_050);
  const englishEditionId = stableUuid(7_100);
  const vietnameseEditionId = stableUuid(7_200);
  const content = required(
    canonicalVietnameseContentByWorkSlug["the-old-man-and-the-sea"],
    "Missing Vietnamese content for The Old Man and the Sea",
  );
  const englishSummary =
    "An aging fisherman's solitary struggle at sea becomes a spare study of endurance, craft, dignity, and loss.";
  const baseEdition: Omit<BookEdition, "id" | "slug" | "language"> = {
    workId,
    displayTitle: "The Old Man and the Sea",
    localizedDisplayTitle: {
      en: "The Old Man and the Sea",
      vi: content.title,
    },
    subtitle: null,
    format: "paperback",
    translatorIds: [],
    publisherId: null,
    isbn13: null,
    isbn10: null,
    publicationYear: null,
    pageCount: null,
    dimensions: null,
    weightGrams: null,
    coverImageId: null,
    priceVnd: 219_000,
    compareAtPriceVnd: null,
    stockQuantity: 18,
    lowStockThreshold: 5,
    inventoryStatus: "in-stock",
    summary: { en: englishSummary, vi: content.summary },
    tableOfContents: null,
    sampleExcerptPolicy: null,
    pairId,
    pairedEditionId: null,
    reasonToRead: null,
    displayFacts: [],
    omittedOptionalFactKeys: [],
    sourceEditionKey: null,
    sourceReviewStatus: null,
    isFeatured: true,
    isActive: true,
    createdAt: CURATED_AT,
    updatedAt: CURATED_AT,
  };
  const categorySlugs: BookCategorySlug[] = ["classic-literature", "fiction"];

  input.works.push({
    id: workId,
    slug: "the-old-man-and-the-sea",
    title: { en: "The Old Man and the Sea", vi: content.title },
    authors: ["Ernest Hemingway"],
    categorySlugs,
    summary: { en: englishSummary, vi: content.summary },
    editionIds: [englishEditionId, vietnameseEditionId],
  });

  const seedEditions: BookEdition[] = [
    {
      ...baseEdition,
      id: englishEditionId,
      slug: "the-old-man-and-the-sea-english-paperback",
      language: "en",
    },
    {
      ...baseEdition,
      id: vietnameseEditionId,
      slug: "the-old-man-and-the-sea-vietnamese-paperback",
      language: "vi",
      priceVnd: 129_000,
      stockQuantity: 26,
      isFeatured: false,
    },
  ];

  seedEditions.forEach((seedEdition) => {
    input.editions.push(
      buildEdition({
        workSlug: "the-old-man-and-the-sea",
        workId,
        pairId,
        pairedEditionId:
          seedEdition.language === "en" ? vietnameseEditionId : englishEditionId,
        englishTitle: "The Old Man and the Sea",
        vietnameseTitle: content.title,
        englishSummary,
        vietnameseSummary: content.summary,
        authors: ["Ernest Hemingway"],
        categorySlugs,
        seedEdition,
        source: required(
          SOURCE_OVERRIDES[`the-old-man-and-the-sea:${seedEdition.language}`],
          `Missing source for ${seedEdition.slug}`,
        ),
        ordinal: input.editions.length,
      }),
    );
  });
}

function buildCompatibilityEntries(): CanonicalCatalogManifest["compatibility"] {
  const work = required(
    bookWorks.find((candidate) => candidate.slug === "the-elements-of-style"),
    "Missing legacy Elements of Style work",
  );
  const editions = bookEditions.filter((edition) => edition.workId === work.id);
  const reason = {
    en: "Retired because no trustworthy Vietnamese counterpart was found; retained only for historical order and link compatibility.",
    vi: "Ngừng bán vì chưa tìm được ấn bản tiếng Việt đáng tin cậy; định danh cũ chỉ được giữ cho lịch sử đơn hàng và liên kết.",
  };

  return [
    {
      legacyEntityType: "work",
      legacyId: work.id,
      legacySlug: work.slug,
      behavior: "retired-to-catalog",
      targetSlug: null,
      reason,
    },
    ...editions.map((edition) => ({
      legacyEntityType: "edition" as const,
      legacyId: edition.id,
      legacySlug: edition.slug,
      behavior: "retired-to-catalog" as const,
      targetSlug: null,
      reason,
    })),
  ];
}

function resolveSource(
  workSlug: string,
  language: EditionLanguage,
  candidateByKey: Map<string, CandidateSource | null>,
): SourceOverride {
  const key = `${workSlug}:${language}`;
  const override = SOURCE_OVERRIDES[key];
  if (override) return override;

  const candidate = required(
    candidateByKey.get(key) ?? undefined,
    `Missing source-reviewed candidate for ${key}`,
  );
  return {
    ...candidate,
    sourceLabel:
      candidate.provider === "open-library"
        ? "Open Library"
        : "Google Books",
    translatorNames: TRANSLATOR_OVERRIDES[key] ?? [],
    matchConfidence: "high",
    reviewerNote:
      "Selected after title, author, language, and edition-level metadata review; unsupported optional facts remain null.",
  };
}

function manualGoogleSource(
  input: Partial<SourceOverride> &
    Pick<SourceOverride, "key" | "title" | "language" | "reviewerNote">,
): SourceOverride {
  return {
    provider: "google-books",
    url: `https://books.google.com/books?id=${encodeURIComponent(input.key)}`,
    sourceLabel: "Google Books",
    subtitle: null,
    publishers: [],
    publishDate: null,
    pageCount: null,
    physicalFormat: null,
    isbn10: [],
    isbn13: [],
    byStatement: null,
    weight: null,
    physicalDimensions: null,
    score: 0,
    matchConfidence: "exact",
    ...input,
  };
}

function manualOpenLibrarySource(
  input: Partial<SourceOverride> &
    Pick<SourceOverride, "key" | "title" | "language" | "reviewerNote">,
): SourceOverride {
  return {
    provider: "open-library",
    url: `https://openlibrary.org${input.key}`,
    sourceLabel: "Open Library",
    subtitle: null,
    publishers: [],
    publishDate: null,
    pageCount: null,
    physicalFormat: null,
    isbn10: [],
    isbn13: [],
    byStatement: null,
    weight: null,
    physicalDimensions: null,
    score: 0,
    matchConfidence: "exact",
    ...input,
  };
}

function manualRetailSource(
  input: Partial<SourceOverride> &
    Pick<
      SourceOverride,
      | "provider"
      | "key"
      | "url"
      | "sourceLabel"
      | "title"
      | "language"
      | "reviewerNote"
    >,
): SourceOverride {
  return {
    subtitle: null,
    publishers: [],
    publishDate: null,
    pageCount: null,
    physicalFormat: null,
    isbn10: [],
    isbn13: [],
    byStatement: null,
    weight: null,
    physicalDimensions: null,
    score: 0,
    matchConfidence: "exact",
    ...input,
  };
}

function parsePublicationYear(value: string | null) {
  const match = value?.match(/(?:^|\D)(1\d{3}|20\d{2})(?:\D|$)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function isValidIsbn13(value: string) {
  if (!/^(978|979)\d{10}$/.test(value)) return false;
  const expected = Number(value[12]);
  const sum = value
    .slice(0, 12)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === expected;
}

function isValidIsbn10(value: string) {
  if (!/^\d{9}[\dX]$/.test(value)) return false;
  const sum = value.split("").reduce((total, character, index) => {
    const digit = character === "X" ? 10 : Number(character);
    return total + digit * (10 - index);
  }, 0);
  return sum % 11 === 0;
}

function normalizePublisherName(value: string | null) {
  if (value === null) return null;
  const trimmed = value.trim();
  const replacements: Record<string, string> = {
    "Nhà xuá̂t bản Văn học": "Nhà xuất bản Văn học",
    "Nhà Xuất Bản Văn Học": "Nhà xuất bản Văn học",
    "NXB Văn Học": "NXB Văn học",
    "Nha Nam": "Nhã Nam",
  };
  return replacements[trimmed] ?? trimmed;
}

function stableUuid(value: number) {
  return `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

void main();
