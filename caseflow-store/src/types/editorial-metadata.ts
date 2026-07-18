import type {
  BookCategorySlug,
  EditionLanguage,
  ISODateTimeString,
  LocalizedText,
} from "@/types/domain";
import type { ContentQualityEvidence } from "@/types/content-provenance";

export const EDITORIAL_DISPLAY_FACT_KEYS = [
  "isbn",
  "publisher",
  "translator",
  "publication-year",
  "page-count",
  "source-physical-format",
] as const;

export type EditorialDisplayFactKey =
  (typeof EDITORIAL_DISPLAY_FACT_KEYS)[number];

export type EditorialDisplayFact = {
  key: EditorialDisplayFactKey;
  label: LocalizedText;
  value: LocalizedText;
  provenanceRecordId: string;
};

export type EditorialEditionMetadata = {
  editionId: string;
  workId: string;
  pairId: string;
  pairedEditionId: string;
  slug: string;
  language: EditionLanguage;
  displayTitle: LocalizedText;
  publicTitle: string;
  authors: string[];
  categorySlugs: BookCategorySlug[];
  summary: LocalizedText;
  reasonToRead: LocalizedText;
  cover: {
    assetId: string;
    path: string;
    altText: LocalizedText;
    provenanceRecordId: string;
  };
  displayFacts: EditorialDisplayFact[];
  omittedOptionalFactKeys: EditorialDisplayFactKey[];
  qualityEvidence: ContentQualityEvidence[];
};

export type EditorialMetadataManifest = {
  taskId: "V12-T08";
  version: "1.2";
  generatedAt: ISODateTimeString;
  sourceCatalogManifest: string;
  sourceCoverManifest: string;
  contentPolicy: string;
  editions: EditorialEditionMetadata[];
};
