import { z } from "zod";

import {
  BLOCKING_CONTENT_QUALITY_REQUIREMENTS,
  CONTENT_QUALITY_EVIDENCE_STATUSES,
  EDITION_MATCH_CONFIDENCES,
  EDITION_SOURCE_FACT_FIELDS,
  OPTIONAL_CONTENT_QUALITY_REQUIREMENTS,
  PROVENANCE_CONTENT_KINDS,
  PROVENANCE_ENTITY_TYPES,
  PROVENANCE_REVIEW_STATUSES,
  PROVENANCE_RIGHTS_BASES,
} from "@/types/content-provenance";
import type {
  CatalogProvenanceRecord,
  ContentQualityAssessmentInput,
  ContentQualityEvidence,
  EditionProvenanceSet,
  ProvenanceAttribution,
  ProvenanceLicense,
} from "@/types/content-provenance";
import {
  idSchema,
  isoDateTimeStringSchema,
  nonEmptyStringSchema,
} from "@/lib/validation/domain";

export const provenanceEntityTypeSchema = z.enum(PROVENANCE_ENTITY_TYPES);
export const provenanceContentKindSchema = z.enum(PROVENANCE_CONTENT_KINDS);
export const provenanceRightsBasisSchema = z.enum(PROVENANCE_RIGHTS_BASES);
export const provenanceReviewStatusSchema = z.enum(
  PROVENANCE_REVIEW_STATUSES,
);
export const editionMatchConfidenceSchema = z.enum(
  EDITION_MATCH_CONFIDENCES,
);
export const editionSourceFactFieldSchema = z.enum(EDITION_SOURCE_FACT_FIELDS);

export const provenanceLicenseSchema = z.object({
  name: nonEmptyStringSchema.max(160),
  url: z.string().trim().url().max(500),
  termsSummary: nonEmptyStringSchema.max(1_000),
}) satisfies z.ZodType<ProvenanceLicense>;

export const provenanceAttributionSchema = z
  .object({
    required: z.boolean(),
    text: z.string().trim().min(1).max(500).nullable(),
    url: z.string().trim().url().max(500).nullable(),
    displayLocation: z.string().trim().min(1).max(160).nullable(),
  })
  .superRefine((attribution, context) => {
    if (attribution.required && attribution.text === null) {
      context.addIssue({
        code: "custom",
        path: ["text"],
        message: "Required attribution must include display text",
      });
    }

    if (attribution.required && attribution.displayLocation === null) {
      context.addIssue({
        code: "custom",
        path: ["displayLocation"],
        message: "Required attribution must identify its display location",
      });
    }
  }) satisfies z.ZodType<ProvenanceAttribution>;

const sourceEditionKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(180)
  .regex(
    /^[a-z0-9][a-z0-9._:/-]*$/,
    "sourceEditionKey must be a stable lowercase provider identifier",
  );

export const catalogProvenanceRecordSchema = z
  .object({
    id: idSchema,
    entityType: provenanceEntityTypeSchema,
    entityId: idSchema,
    fieldKey: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sourceLabel: nonEmptyStringSchema.max(200),
    sourceUrl: z.string().trim().url().max(500).nullable(),
    checkedAt: isoDateTimeStringSchema,
    contentKind: provenanceContentKindSchema,
    rightsBasis: provenanceRightsBasisSchema,
    rightsBasisNote: nonEmptyStringSchema.max(1_000),
    license: provenanceLicenseSchema.nullable(),
    attribution: provenanceAttributionSchema,
    reviewStatus: provenanceReviewStatusSchema,
    reviewerNote: z.string().trim().min(1).max(2_000).nullable(),
    reviewedAt: isoDateTimeStringSchema.nullable(),
    editionMatchConfidence: editionMatchConfidenceSchema,
    sourceEditionKey: sourceEditionKeySchema.nullable(),
  })
  .superRefine((record, context) => {
    if (
      record.contentKind === "bibliographic-fact" &&
      record.rightsBasis !== "factual-data"
    ) {
      context.addIssue({
        code: "custom",
        path: ["rightsBasis"],
        message: "Bibliographic facts must use the factual-data rights basis",
      });
    }

    if (
      record.contentKind === "bibliographic-fact" &&
      record.sourceUrl === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "Bibliographic facts require a stable source URL",
      });
    }

    if (
      record.contentKind === "project-written-text" &&
      record.rightsBasis !== "project-created"
    ) {
      context.addIssue({
        code: "custom",
        path: ["rightsBasis"],
        message: "Project-written text must use the project-created rights basis",
      });
    }

    if (
      record.contentKind === "media" &&
      record.rightsBasis === "factual-data"
    ) {
      context.addIssue({
        code: "custom",
        path: ["rightsBasis"],
        message: "Media cannot use the factual-data rights basis",
      });
    }

    if (
      record.rightsBasis === "generated-original" &&
      record.contentKind !== "media"
    ) {
      context.addIssue({
        code: "custom",
        path: ["contentKind"],
        message: "Generated-original provenance is reserved for media",
      });
    }

    if (
      (record.rightsBasis === "licensed" ||
        record.rightsBasis === "public-domain") &&
      record.contentKind !== "media"
    ) {
      context.addIssue({
        code: "custom",
        path: ["contentKind"],
        message: "Licensed and public-domain rights bases are reserved for media",
      });
    }

    if (
      record.rightsBasis === "licensed" ||
      record.rightsBasis === "public-domain"
    ) {
      if (record.sourceUrl === null) {
        context.addIssue({
          code: "custom",
          path: ["sourceUrl"],
          message: "Licensed and public-domain media require a stable source URL",
        });
      }

      if (record.license === null) {
        context.addIssue({
          code: "custom",
          path: ["license"],
          message: "Licensed and public-domain media require complete rights data",
        });
      }
    }

    if (
      (record.rightsBasis === "project-created" ||
        record.rightsBasis === "generated-original" ||
        record.rightsBasis === "factual-data") &&
      record.license !== null
    ) {
      context.addIssue({
        code: "custom",
        path: ["license"],
        message: "This rights basis must not carry an external license record",
      });
    }

    const reviewIsComplete =
      record.reviewStatus === "approved" || record.reviewStatus === "rejected";

    if (reviewIsComplete && record.reviewedAt === null) {
      context.addIssue({
        code: "custom",
        path: ["reviewedAt"],
        message: "Approved and rejected records require a review timestamp",
      });
    }

    if (!reviewIsComplete && record.reviewedAt !== null) {
      context.addIssue({
        code: "custom",
        path: ["reviewedAt"],
        message: "Draft and needs-review records cannot claim a completed review",
      });
    }

    const isEditionFact =
      record.entityType === "edition" &&
      record.contentKind === "bibliographic-fact";

    if (isEditionFact) {
      if (record.sourceEditionKey === null) {
        context.addIssue({
          code: "custom",
          path: ["sourceEditionKey"],
          message: "Edition facts require a stable source-edition key",
        });
      }

      if (record.editionMatchConfidence === "not-applicable") {
        context.addIssue({
          code: "custom",
          path: ["editionMatchConfidence"],
          message: "Edition facts require an explicit match confidence",
        });
      }
    } else {
      if (record.sourceEditionKey !== null) {
        context.addIssue({
          code: "custom",
          path: ["sourceEditionKey"],
          message: "Only edition bibliographic facts may use sourceEditionKey",
        });
      }

      if (record.editionMatchConfidence !== "not-applicable") {
        context.addIssue({
          code: "custom",
          path: ["editionMatchConfidence"],
          message: "Edition match confidence is not applicable to this content",
        });
      }
    }
  }) satisfies z.ZodType<CatalogProvenanceRecord>;

export const editionProvenanceSetSchema = z
  .object({
    editionId: idSchema,
    facts: z
      .array(
        z.object({
          field: editionSourceFactFieldSchema,
          provenance: catalogProvenanceRecordSchema,
        }),
      )
      .min(1)
      .max(EDITION_SOURCE_FACT_FIELDS.length),
  })
  .superRefine((set, context) => {
    const fields = new Set<string>();
    const sourceEditionKeys = new Set<string>();

    set.facts.forEach((fact, index) => {
      if (fields.has(fact.field)) {
        context.addIssue({
          code: "custom",
          path: ["facts", index, "field"],
          message: "Each edition fact field may have only one primary record",
        });
      }
      fields.add(fact.field);

      if (
        fact.provenance.entityType !== "edition" ||
        fact.provenance.entityId !== set.editionId
      ) {
        context.addIssue({
          code: "custom",
          path: ["facts", index, "provenance", "entityId"],
          message: "Fact provenance must target the assessed edition",
        });
      }

      if (fact.provenance.fieldKey !== fact.field) {
        context.addIssue({
          code: "custom",
          path: ["facts", index, "provenance", "fieldKey"],
          message: "Fact field and provenance fieldKey must match",
        });
      }

      if (fact.provenance.contentKind !== "bibliographic-fact") {
        context.addIssue({
          code: "custom",
          path: ["facts", index, "provenance", "contentKind"],
          message: "Edition source facts must use bibliographic provenance",
        });
      }

      if (fact.provenance.sourceEditionKey !== null) {
        sourceEditionKeys.add(fact.provenance.sourceEditionKey);
      }
    });

    if (sourceEditionKeys.size > 1) {
      context.addIssue({
        code: "custom",
        path: ["facts"],
        message: "Edition facts cannot mix values from different source editions",
      });
    }
  }) satisfies z.ZodType<EditionProvenanceSet>;

const contentQualityRequirementSchema = z.enum([
  ...BLOCKING_CONTENT_QUALITY_REQUIREMENTS,
  ...OPTIONAL_CONTENT_QUALITY_REQUIREMENTS,
]);

export const contentQualityEvidenceSchema = z
  .object({
    requirement: contentQualityRequirementSchema,
    status: z.enum(CONTENT_QUALITY_EVIDENCE_STATUSES),
    provenanceRecordId: idSchema.nullable(),
    note: z.string().trim().min(1).max(500).nullable(),
  })
  .superRefine((evidence, context) => {
    if (
      evidence.status === "verified" &&
      evidence.provenanceRecordId === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["provenanceRecordId"],
        message: "Verified quality evidence requires a provenance record",
      });
    }

    if (
      (evidence.status === "missing" ||
        evidence.status === "not-applicable") &&
      evidence.provenanceRecordId !== null
    ) {
      context.addIssue({
        code: "custom",
        path: ["provenanceRecordId"],
        message: "Missing or non-applicable evidence cannot cite provenance",
      });
    }

    if (
      (evidence.status === "unverified" ||
        evidence.status === "not-applicable") &&
      evidence.note === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Unverified and non-applicable evidence require an explanation",
      });
    }
  }) satisfies z.ZodType<ContentQualityEvidence>;

export const contentQualityAssessmentInputSchema = z
  .object({
    editionId: idSchema,
    evidence: z.array(contentQualityEvidenceSchema).max(40),
  })
  .superRefine((input, context) => {
    const requirements = new Set<string>();

    input.evidence.forEach((evidence, index) => {
      if (requirements.has(evidence.requirement)) {
        context.addIssue({
          code: "custom",
          path: ["evidence", index, "requirement"],
          message: "Quality requirements cannot be duplicated",
        });
      }
      requirements.add(evidence.requirement);

      if (
        evidence.status === "not-applicable" &&
        BLOCKING_CONTENT_QUALITY_REQUIREMENTS.includes(
          evidence.requirement as (typeof BLOCKING_CONTENT_QUALITY_REQUIREMENTS)[number],
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["evidence", index, "status"],
          message: "Blocking requirements cannot be marked not-applicable",
        });
      }
    });
  }) satisfies z.ZodType<ContentQualityAssessmentInput>;
