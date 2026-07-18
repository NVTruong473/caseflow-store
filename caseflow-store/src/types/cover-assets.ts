import type {
  BookCategorySlug,
  EditionLanguage,
  ISODateTimeString,
  LocalizedText,
} from "@/types/domain";
import type { CatalogProvenanceRecord } from "@/types/content-provenance";

export const COVER_PIPELINE_STATUSES = [
  "pilot",
  "approved-for-batch",
] as const;

export const COVER_ARTWORK_KINDS = ["project-created-vector"] as const;

export const COVER_ASPECT_RATIOS = ["2:3"] as const;

export type CoverPipelineStatus = (typeof COVER_PIPELINE_STATUSES)[number];
export type CoverArtworkKind = (typeof COVER_ARTWORK_KINDS)[number];
export type CoverAspectRatio = (typeof COVER_ASPECT_RATIOS)[number];

export type CoverPipelineDimensions = {
  width: number;
  height: number;
};

export type CoverPipelineContrastRatios = {
  titleOnPanel: number;
  authorOnPanel: number;
  badgeOnAccent: number;
};

export type CoverPipelineTextBlocks = {
  titleLines: string[];
  authorLine: string;
  languageLabel: "English edition" | "Vietnamese edition";
};

export type CoverPipelineSource = {
  artworkKind: CoverArtworkKind;
  rightsBasis: "project-created";
  sourceLabel: string;
  generationMethod: string;
  commercialCoverReferenceUsed: false;
  referenceImageUrls: [];
};

export type CoverPipelineReview = {
  status: "approved";
  checkedAt: ISODateTimeString;
  reviewerNote: string;
};

export type CoverPipelineAsset = {
  id: string;
  editionId: string;
  workId: string;
  pairId: string;
  editionSlug: string;
  language: EditionLanguage;
  title: string;
  authors: string[];
  categorySlugs: BookCategorySlug[];
  artFamilyKey: string;
  conceptKey: string;
  path: string;
  dimensions: CoverPipelineDimensions;
  aspectRatio: CoverAspectRatio;
  generatedAt: ISODateTimeString;
  fileSizeBytes: number;
  checksumSha256: string;
  sizeBudgetBytes: number;
  backgroundColor: string;
  panelColor: string;
  textColor: string;
  accentColor: string;
  contrastRatios: CoverPipelineContrastRatios;
  textBlocks: CoverPipelineTextBlocks;
  altText: LocalizedText;
  source: CoverPipelineSource;
  provenance: CatalogProvenanceRecord;
  review: CoverPipelineReview;
};

export type CoverPipelineManifest = {
  taskId: "V12-T06" | "V12-T07";
  version: "1.2";
  generatedAt: ISODateTimeString;
  pipelineStatus: CoverPipelineStatus;
  assetBasePath: string;
  fallbackPath: string;
  contactSheetPath: string;
  previewHtmlPath: string;
  dimensions: CoverPipelineDimensions;
  aspectRatio: CoverAspectRatio;
  sizeBudgetBytes: number;
  minContrastRatio: number;
  textRenderer: "deterministic-svg-text";
  commercialCoverPolicy: string;
  pilotSelectionRationale: string;
  assets: CoverPipelineAsset[];
};
