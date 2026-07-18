import type { ISODateTimeString } from "@/types/domain";

export const PROVENANCE_ENTITY_TYPES = [
  "author",
  "translator",
  "publisher",
  "work",
  "edition",
  "cover-asset",
] as const;

export const PROVENANCE_CONTENT_KINDS = [
  "bibliographic-fact",
  "project-written-text",
  "media",
] as const;

export const PROVENANCE_RIGHTS_BASES = [
  "factual-data",
  "project-created",
  "generated-original",
  "licensed",
  "public-domain",
] as const;

export const PROVENANCE_REVIEW_STATUSES = [
  "draft",
  "needs-review",
  "approved",
  "rejected",
] as const;

export const EDITION_MATCH_CONFIDENCES = [
  "not-applicable",
  "low",
  "medium",
  "high",
  "exact",
] as const;

export const EDITION_SOURCE_FACT_FIELDS = [
  "display-title",
  "subtitle",
  "format",
  "publisher",
  "isbn-13",
  "isbn-10",
  "publication-year",
  "page-count",
  "dimensions",
  "weight-grams",
  "translators",
] as const;

export const BLOCKING_CONTENT_QUALITY_REQUIREMENTS = [
  "title",
  "authors",
  "language",
  "format",
  "price",
  "stock",
  "category",
  "bilingual-summary",
  "primary-cover",
  "source-review",
  "edition-facts-consistent",
  "rights-complete",
] as const;

export const OPTIONAL_CONTENT_QUALITY_REQUIREMENTS = [
  "isbn",
  "publisher",
  "translator",
  "page-count",
  "publication-date",
  "dimensions",
  "weight",
  "table-of-contents",
] as const;

export const CONTENT_QUALITY_EVIDENCE_STATUSES = [
  "verified",
  "missing",
  "unverified",
  "not-applicable",
] as const;

export type ProvenanceEntityType = (typeof PROVENANCE_ENTITY_TYPES)[number];
export type ProvenanceContentKind =
  (typeof PROVENANCE_CONTENT_KINDS)[number];
export type ProvenanceRightsBasis =
  (typeof PROVENANCE_RIGHTS_BASES)[number];
export type ProvenanceReviewStatus =
  (typeof PROVENANCE_REVIEW_STATUSES)[number];
export type EditionMatchConfidence =
  (typeof EDITION_MATCH_CONFIDENCES)[number];
export type EditionSourceFactField =
  (typeof EDITION_SOURCE_FACT_FIELDS)[number];
export type BlockingContentQualityRequirement =
  (typeof BLOCKING_CONTENT_QUALITY_REQUIREMENTS)[number];
export type OptionalContentQualityRequirement =
  (typeof OPTIONAL_CONTENT_QUALITY_REQUIREMENTS)[number];
export type ContentQualityRequirement =
  | BlockingContentQualityRequirement
  | OptionalContentQualityRequirement;
export type ContentQualityRequirementLevel = "blocking" | "optional";
export type ContentQualityEvidenceStatus =
  (typeof CONTENT_QUALITY_EVIDENCE_STATUSES)[number];

export type ProvenanceLicense = {
  name: string;
  url: string;
  termsSummary: string;
};

export type ProvenanceAttribution = {
  required: boolean;
  text: string | null;
  url: string | null;
  displayLocation: string | null;
};

export type CatalogProvenanceRecord = {
  id: string;
  entityType: ProvenanceEntityType;
  entityId: string;
  fieldKey: string;
  sourceLabel: string;
  sourceUrl: string | null;
  checkedAt: ISODateTimeString;
  contentKind: ProvenanceContentKind;
  rightsBasis: ProvenanceRightsBasis;
  rightsBasisNote: string;
  license: ProvenanceLicense | null;
  attribution: ProvenanceAttribution;
  reviewStatus: ProvenanceReviewStatus;
  reviewerNote: string | null;
  reviewedAt: ISODateTimeString | null;
  editionMatchConfidence: EditionMatchConfidence;
  sourceEditionKey: string | null;
};

export type EditionFieldProvenance = {
  field: EditionSourceFactField;
  provenance: CatalogProvenanceRecord;
};

export type EditionProvenanceSet = {
  editionId: string;
  facts: EditionFieldProvenance[];
};

export type PublicCatalogProvenance = {
  sourceLabel: string;
  sourceUrl: string | null;
  checkedAt: ISODateTimeString;
  contentKind: ProvenanceContentKind;
  rightsBasis: ProvenanceRightsBasis;
  license: ProvenanceLicense | null;
  attribution: ProvenanceAttribution;
  reviewStatus: "approved";
};

export type ContentQualityEvidence = {
  requirement: ContentQualityRequirement;
  status: ContentQualityEvidenceStatus;
  provenanceRecordId: string | null;
  note: string | null;
};

export type ContentQualityAssessmentInput = {
  editionId: string;
  evidence: ContentQualityEvidence[];
};

export type ContentQualityCheck = ContentQualityEvidence & {
  level: ContentQualityRequirementLevel;
};

export type ContentQualityAssessment = {
  editionId: string;
  qualityScore: number;
  releaseReady: boolean;
  blocking: {
    verified: number;
    total: number;
    failures: BlockingContentQualityRequirement[];
  };
  optional: {
    verified: number;
    applicable: number;
    total: number;
  };
  checks: ContentQualityCheck[];
};
