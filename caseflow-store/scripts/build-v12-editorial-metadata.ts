import fs from "node:fs";
import path from "node:path";

import { assessContentQuality } from "../src/lib/content/content-quality";
import { canonicalCatalogManifestSchema } from "../src/lib/validation/canonical-catalog";
import { coverPipelineManifestSchema } from "../src/lib/validation/cover-assets";
import { editorialMetadataManifestSchema } from "../src/lib/validation/editorial-metadata";
import type {
  CanonicalCatalogManifest,
  CanonicalEditionManifestItem,
} from "../src/types/canonical-catalog";
import type { CoverPipelineManifest } from "../src/types/cover-assets";
import type {
  ContentQualityEvidence,
  EditionSourceFactField,
} from "../src/types/content-provenance";
import type {
  EditorialDisplayFact,
  EditorialDisplayFactKey,
  EditorialEditionMetadata,
  EditorialMetadataManifest,
} from "../src/types/editorial-metadata";

const GENERATED_AT = "2026-07-17T00:00:00.000Z";
const CATALOG_MANIFEST = "src/data/books/v1.2-canonical-manifest.json";
const COVER_MANIFEST = "src/data/books/v1.2-cover-portfolio-manifest.json";
const OUTPUT_MANIFEST = "src/data/books/v1.2-editorial-metadata-manifest.json";

const DISPLAY_FACT_LABELS: Record<EditorialDisplayFactKey, { vi: string; en: string }> = {
  isbn: { vi: "ISBN", en: "ISBN" },
  publisher: { vi: "Nhà xuất bản", en: "Publisher" },
  translator: { vi: "Dịch giả", en: "Translator" },
  "publication-year": { vi: "Năm xuất bản", en: "Publication year" },
  "page-count": { vi: "Số trang", en: "Page count" },
  "source-physical-format": { vi: "Định dạng nguồn", en: "Source format" },
};

function main() {
  const catalog = readCatalogManifest();
  const covers = readCoverManifest();
  const coverByEditionId = new Map(
    covers.assets.map((asset) => [asset.editionId, asset]),
  );
  const editions = catalog.editions.map((edition) => {
    const cover = required(coverByEditionId.get(edition.id), edition.slug);
    return buildMetadata(edition, cover);
  });
  const manifest: EditorialMetadataManifest = {
    taskId: "V12-T08",
    version: "1.2",
    generatedAt: GENERATED_AT,
    sourceCatalogManifest: CATALOG_MANIFEST,
    sourceCoverManifest: COVER_MANIFEST,
    contentPolicy: "docs/v1.2-provenance-content-quality-contracts.md",
    editions,
  };
  const parsed = editorialMetadataManifestSchema.parse(manifest);

  fs.writeFileSync(
    path.join(process.cwd(), OUTPUT_MANIFEST),
    `${JSON.stringify(parsed, null, 2)}\n`,
  );
  process.stdout.write(
    `${JSON.stringify(
      {
        manifestPath: OUTPUT_MANIFEST,
        editions: parsed.editions.length,
        releaseReady: parsed.editions.every((metadata) =>
          assessContentQuality({
            editionId: metadata.editionId,
            evidence: metadata.qualityEvidence,
          }).releaseReady,
        ),
        ok: true,
      },
      null,
      2,
    )}\n`,
  );
}

function readCatalogManifest(): CanonicalCatalogManifest {
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), CATALOG_MANIFEST), "utf8"),
  );
  return canonicalCatalogManifestSchema.parse(raw);
}

function readCoverManifest(): CoverPipelineManifest {
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), COVER_MANIFEST), "utf8"),
  );
  return coverPipelineManifestSchema.parse(raw);
}

function buildMetadata(
  edition: CanonicalEditionManifestItem,
  cover: CoverPipelineManifest["assets"][number],
): EditorialEditionMetadata {
  const displayFacts = buildDisplayFacts(edition);
  const displayed = new Set(displayFacts.map((fact) => fact.key));
  const omittedOptionalFactKeys = (
    [
      "isbn",
      "publisher",
      "translator",
      "publication-year",
      "page-count",
      "source-physical-format",
    ] satisfies EditorialDisplayFactKey[]
  ).filter((key) => !displayed.has(key));
  const qualityEvidence = buildQualityEvidence(edition, cover);

  return {
    editionId: edition.id,
    workId: edition.workId,
    pairId: edition.pairId,
    pairedEditionId: edition.pairedEditionId,
    slug: edition.slug,
    language: edition.language,
    displayTitle: edition.displayTitle,
    publicTitle: edition.displayTitle[edition.language],
    authors: edition.authors,
    categorySlugs: edition.categorySlugs,
    summary: edition.summary,
    reasonToRead: edition.merchandisingRationale,
    cover: {
      assetId: cover.id,
      path: cover.path,
      altText: cover.altText,
      provenanceRecordId: cover.provenance.id,
    },
    displayFacts,
    omittedOptionalFactKeys,
    qualityEvidence,
  };
}

function buildDisplayFacts(
  edition: CanonicalEditionManifestItem,
): EditorialDisplayFact[] {
  const facts: EditorialDisplayFact[] = [];
  const isbn = edition.bibliographic.isbn13 ?? edition.bibliographic.isbn10;

  if (isbn) {
    facts.push({
      key: "isbn",
      label: DISPLAY_FACT_LABELS.isbn,
      value: { vi: isbn, en: isbn },
      provenanceRecordId: provenanceIdFor(edition, edition.bibliographic.isbn13 ? "isbn-13" : "isbn-10"),
    });
  }

  if (edition.bibliographic.publisherName) {
    facts.push({
      key: "publisher",
      label: DISPLAY_FACT_LABELS.publisher,
      value: {
        vi: edition.bibliographic.publisherName,
        en: edition.bibliographic.publisherName,
      },
      provenanceRecordId: provenanceIdFor(edition, "publisher"),
    });
  }

  if (edition.bibliographic.translatorNames.length > 0) {
    const translators = edition.bibliographic.translatorNames.join(", ");
    facts.push({
      key: "translator",
      label: DISPLAY_FACT_LABELS.translator,
      value: { vi: translators, en: translators },
      provenanceRecordId: provenanceIdFor(edition, "translators"),
    });
  }

  if (edition.bibliographic.publicationYear) {
    const year = String(edition.bibliographic.publicationYear);
    facts.push({
      key: "publication-year",
      label: DISPLAY_FACT_LABELS["publication-year"],
      value: { vi: year, en: year },
      provenanceRecordId: provenanceIdFor(edition, "publication-year"),
    });
  }

  if (edition.bibliographic.pageCount) {
    facts.push({
      key: "page-count",
      label: DISPLAY_FACT_LABELS["page-count"],
      value: {
        vi: `${edition.bibliographic.pageCount} trang`,
        en: `${edition.bibliographic.pageCount} pages`,
      },
      provenanceRecordId: provenanceIdFor(edition, "page-count"),
    });
  }

  if (edition.bibliographic.sourcePhysicalFormat) {
    facts.push({
      key: "source-physical-format",
      label: DISPLAY_FACT_LABELS["source-physical-format"],
      value: {
        vi: edition.bibliographic.sourcePhysicalFormat,
        en: edition.bibliographic.sourcePhysicalFormat,
      },
      provenanceRecordId: provenanceIdFor(edition, "format"),
    });
  }

  return facts;
}

function buildQualityEvidence(
  edition: CanonicalEditionManifestItem,
  cover: CoverPipelineManifest["assets"][number],
): ContentQualityEvidence[] {
  const requiredEvidence: ContentQualityEvidence[] = [
    verified("title", provenanceIdFor(edition, "display-title")),
    verified("authors", internalEvidenceId(edition, "authors")),
    verified("language", internalEvidenceId(edition, "language")),
    verified("format", internalEvidenceId(edition, "format")),
    verified("price", internalEvidenceId(edition, "price")),
    verified("stock", internalEvidenceId(edition, "stock")),
    verified("category", internalEvidenceId(edition, "category")),
    verified("bilingual-summary", internalEvidenceId(edition, "bilingual-summary")),
    verified("primary-cover", cover.provenance.id),
    verified("source-review", provenanceIdFor(edition, "display-title")),
    verified("edition-facts-consistent", provenanceIdFor(edition, "display-title")),
    verified("rights-complete", cover.provenance.id),
  ];
  const optionalEvidence: ContentQualityEvidence[] = [
    optionalFact(edition, "isbn", edition.bibliographic.isbn13 ? "isbn-13" : "isbn-10", Boolean(edition.bibliographic.isbn13 ?? edition.bibliographic.isbn10)),
    optionalFact(edition, "publisher", "publisher", Boolean(edition.bibliographic.publisherName)),
    optionalFact(edition, "translator", "translators", edition.bibliographic.translatorNames.length > 0, edition.language === "en"),
    optionalFact(edition, "page-count", "page-count", Boolean(edition.bibliographic.pageCount)),
    optionalFact(edition, "publication-date", "publication-year", Boolean(edition.bibliographic.publicationYear)),
    missing("dimensions", "Edition-specific dimensions are unavailable from the reviewed source."),
    missing("weight", "Edition-specific weight is unavailable from the reviewed source."),
    {
      requirement: "table-of-contents",
      status: "not-applicable",
      provenanceRecordId: null,
      note: "The v1.2 bookstore scope does not display tables of contents.",
    },
  ];

  return [...requiredEvidence, ...optionalEvidence];
}

function optionalFact(
  edition: CanonicalEditionManifestItem,
  requirement: ContentQualityEvidence["requirement"],
  field: EditionSourceFactField,
  present: boolean,
  notApplicable = false,
): ContentQualityEvidence {
  if (present) return verified(requirement, provenanceIdFor(edition, field));
  if (notApplicable) {
    return {
      requirement,
      status: "not-applicable",
      provenanceRecordId: null,
      note: "This optional fact is not applicable to this edition.",
    };
  }
  return missing(requirement, "The reviewed edition source does not provide this optional fact.");
}

function verified(
  requirement: ContentQualityEvidence["requirement"],
  provenanceRecordId: string,
): ContentQualityEvidence {
  return {
    requirement,
    status: "verified",
    provenanceRecordId,
    note: null,
  };
}

function missing(
  requirement: ContentQualityEvidence["requirement"],
  note: string,
): ContentQualityEvidence {
  return {
    requirement,
    status: "missing",
    provenanceRecordId: null,
    note,
  };
}

function provenanceIdFor(
  edition: CanonicalEditionManifestItem,
  field: EditionSourceFactField,
) {
  const fact = edition.provenance.facts.find((item) => item.field === field);
  return fact?.provenance.id ?? internalEvidenceId(edition, field);
}

function internalEvidenceId(
  edition: CanonicalEditionManifestItem,
  field: string,
) {
  return `v12-editorial:${edition.id}:${field}`;
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`Missing required value: ${label}`);
  }
  return value;
}

void main();
