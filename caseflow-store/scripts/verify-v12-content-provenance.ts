import fs from "node:fs";
import path from "node:path";

import { caseflowBooksSeed } from "../src/data/books/seed";
import { toBookCatalogApiItem } from "../src/lib/api/book-catalog";
import { toPublicCatalogProvenance } from "../src/lib/api/content-provenance";
import { assessContentQuality } from "../src/lib/content/content-quality";
import type { SupabaseBookCatalogRecord } from "../src/lib/repositories/supabase-books";
import {
  catalogProvenanceRecordSchema,
  contentQualityAssessmentInputSchema,
  contentQualityEvidenceSchema,
  editionProvenanceSetSchema,
} from "../src/lib/validation/content-provenance";
import {
  BLOCKING_CONTENT_QUALITY_REQUIREMENTS,
} from "../src/types/content-provenance";
import type {
  CatalogProvenanceRecord,
  ContentQualityEvidence,
  EditionSourceFactField,
} from "../src/types/content-provenance";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t04");
const CHECKED_AT = "2026-07-17T00:00:00.000Z";
const REVIEWED_AT = "2026-07-17T01:00:00.000Z";
const EDITION_ID = "00000000-0000-4000-8000-000000000001";
const INTERNAL_SENTINEL = "internal-review-note-must-never-be-public";

function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const validRecords = createValidRecords();
  const schemaChecks = runSchemaChecks(validRecords);
  const editionConsistencyChecks = runEditionConsistencyChecks();
  const contentQualityChecks = runContentQualityChecks();
  const serializationChecks = runSerializationChecks(validRecords.internal);
  const pass = {
    acceptsInternalMedia: schemaChecks.acceptsInternalMedia,
    acceptsGeneratedMedia: schemaChecks.acceptsGeneratedMedia,
    acceptsLicensedMedia: schemaChecks.acceptsLicensedMedia,
    acceptsPublicDomainMedia: schemaChecks.acceptsPublicDomainMedia,
    acceptsEditionFact: schemaChecks.acceptsEditionFact,
    rejectsIncompleteLicensedMedia:
      schemaChecks.rejectsIncompleteLicensedMedia,
    rejectsIncompletePublicDomainMedia:
      schemaChecks.rejectsIncompletePublicDomainMedia,
    rejectsContradictoryGeneratedMedia:
      schemaChecks.rejectsContradictoryGeneratedMedia,
    rejectsIncompleteAttribution: schemaChecks.rejectsIncompleteAttribution,
    rejectsIncompleteReview: schemaChecks.rejectsIncompleteReview,
    rejectsUnmatchedEditionFact: schemaChecks.rejectsUnmatchedEditionFact,
    rejectsSourceLessBibliographicFact:
      schemaChecks.rejectsSourceLessBibliographicFact,
    acceptsConsistentEditionFacts:
      editionConsistencyChecks.acceptsConsistentEditionFacts,
    rejectsMixedEditionFacts:
      editionConsistencyChecks.rejectsMixedEditionFacts,
    qualityRequiresProvenance:
      contentQualityChecks.qualityRequiresProvenance,
    blockingRequirementsCannotBeSkipped:
      contentQualityChecks.blockingRequirementsCannotBeSkipped,
    unverifiedFactsReceiveNoCredit:
      contentQualityChecks.unverifiedFactsReceiveNoCredit,
    completeBlockingChecklistIsReleaseReady:
      contentQualityChecks.completeBlockingChecklistIsReleaseReady,
    publicSerializerOmitsInternalFields:
      serializationChecks.publicSerializerOmitsInternalFields,
    nonApprovedProvenanceIsNotPublic:
      serializationChecks.nonApprovedProvenanceIsNotPublic,
    catalogSerializerDoesNotLeakInternalNotes:
      serializationChecks.catalogSerializerDoesNotLeakInternalNotes,
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    taskId: "V12-T04",
    generatedAt: new Date().toISOString(),
    migrationDecision: "additive-migration-required-but-not-created-in-v12-t04",
    schemaChecks,
    editionConsistencyChecks,
    contentQualityChecks,
    serializationChecks,
    pass,
    ok,
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "provenance-content-quality-check.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(
    JSON.stringify(
      {
        artifact: path.join(
          ARTIFACT_DIR,
          "provenance-content-quality-check.json",
        ),
        ok,
        pass,
        qualityScore: contentQualityChecks.assessment.qualityScore,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

function createValidRecords() {
  const internal = createRecord({
    id: "provenance-internal-cover",
    entityType: "cover-asset",
    entityId: "cover-internal",
    fieldKey: "primary-cover",
    sourceLabel: "CaseFlow Books design system",
    contentKind: "media",
    rightsBasis: "project-created",
    rightsBasisNote: "Original internal cover created for CaseFlow Books.",
  });
  const generated = createRecord({
    id: "provenance-generated-cover",
    entityType: "cover-asset",
    entityId: "cover-generated",
    fieldKey: "primary-cover",
    sourceLabel: "CaseFlow Books generated artwork pipeline",
    contentKind: "media",
    rightsBasis: "generated-original",
    rightsBasisNote:
      "Original generated artwork reviewed against protected-cover references.",
  });
  const licensed = createRecord({
    id: "provenance-licensed-cover",
    entityType: "cover-asset",
    entityId: "cover-licensed",
    fieldKey: "primary-cover",
    sourceLabel: "Example licensed media archive",
    sourceUrl: "https://example.com/licensed-cover",
    contentKind: "media",
    rightsBasis: "licensed",
    rightsBasisNote: "License terms permit local display with attribution.",
    license: {
      name: "Example Media License 1.0",
      url: "https://example.com/license",
      termsSummary: "Display and adaptation permitted with attribution.",
    },
    attribution: {
      required: true,
      text: "Artwork from Example Media Archive",
      url: "https://example.com/licensed-cover",
      displayLocation: "Book detail media attribution",
    },
  });
  const publicDomain = createRecord({
    id: "provenance-public-domain-cover",
    entityType: "cover-asset",
    entityId: "cover-public-domain",
    fieldKey: "primary-cover",
    sourceLabel: "Example public-domain archive",
    sourceUrl: "https://example.com/public-domain-cover",
    contentKind: "media",
    rightsBasis: "public-domain",
    rightsBasisNote:
      "The source record identifies the artwork as public domain.",
    license: {
      name: "Public Domain Mark 1.0",
      url: "https://creativecommons.org/publicdomain/mark/1.0/",
      termsSummary: "Source marks the artwork as free of known copyright.",
    },
    attribution: {
      required: false,
      text: "Source: Example public-domain archive",
      url: "https://example.com/public-domain-cover",
      displayLocation: "Book detail media attribution",
    },
  });
  const editionFact = createEditionFact("isbn-13", "open-library:olid:ol1m");

  return { internal, generated, licensed, publicDomain, editionFact };
}

function runSchemaChecks(records: ReturnType<typeof createValidRecords>) {
  return {
    acceptsInternalMedia: parses(records.internal),
    acceptsGeneratedMedia: parses(records.generated),
    acceptsLicensedMedia: parses(records.licensed),
    acceptsPublicDomainMedia: parses(records.publicDomain),
    acceptsEditionFact: parses(records.editionFact),
    rejectsIncompleteLicensedMedia: rejects({
      ...records.licensed,
      sourceUrl: null,
      license: null,
    }),
    rejectsIncompletePublicDomainMedia: rejects({
      ...records.publicDomain,
      license: null,
    }),
    rejectsContradictoryGeneratedMedia: rejects({
      ...records.generated,
      license: records.licensed.license,
    }),
    rejectsIncompleteAttribution: rejects({
      ...records.licensed,
      attribution: {
        ...records.licensed.attribution,
        text: null,
        displayLocation: null,
      },
    }),
    rejectsIncompleteReview: rejects({
      ...records.internal,
      reviewedAt: null,
    }),
    rejectsUnmatchedEditionFact: rejects({
      ...records.editionFact,
      sourceEditionKey: null,
      editionMatchConfidence: "not-applicable",
    }),
    rejectsSourceLessBibliographicFact: rejects({
      ...records.editionFact,
      sourceUrl: null,
    }),
  };
}

function runEditionConsistencyChecks() {
  const facts: EditionSourceFactField[] = [
    "isbn-13",
    "publisher",
    "page-count",
  ];
  const consistentSet = {
    editionId: EDITION_ID,
    facts: facts.map((field) => ({
      field,
      provenance: createEditionFact(field, "open-library:olid:ol1m"),
    })),
  };
  const mixedSet = {
    ...consistentSet,
    facts: [
      ...consistentSet.facts.slice(0, 2),
      {
        field: "page-count" as const,
        provenance: createEditionFact(
          "page-count",
          "google-books:volume:different-edition",
        ),
      },
    ],
  };

  return {
    acceptsConsistentEditionFacts:
      editionProvenanceSetSchema.safeParse(consistentSet).success,
    rejectsMixedEditionFacts:
      !editionProvenanceSetSchema.safeParse(mixedSet).success,
    consistentSourceEditionKey: "open-library:olid:ol1m",
  };
}

function runContentQualityChecks() {
  const verifiedBlockingEvidence =
    BLOCKING_CONTENT_QUALITY_REQUIREMENTS.map(
      (requirement, index) =>
        ({
          requirement,
          status: "verified",
          provenanceRecordId: `provenance-blocking-${index + 1}`,
          note: null,
        }) satisfies ContentQualityEvidence,
    );
  const evidence: ContentQualityEvidence[] = [
    ...verifiedBlockingEvidence,
    {
      requirement: "page-count",
      status: "verified",
      provenanceRecordId: "provenance-page-count",
      note: null,
    },
    {
      requirement: "isbn",
      status: "unverified",
      provenanceRecordId: null,
      note: "A candidate ISBN exists but is not edition-matched.",
    },
    {
      requirement: "translator",
      status: "not-applicable",
      provenanceRecordId: null,
      note: "The assessed edition is in the work's original language.",
    },
  ];
  const assessment = assessContentQuality({ editionId: EDITION_ID, evidence });
  const unverifiedIsNotCounted =
    assessment.checks.find((check) => check.requirement === "isbn")?.status ===
      "unverified" && assessment.optional.verified === 1;

  return {
    assessment,
    qualityRequiresProvenance: !contentQualityEvidenceSchema.safeParse({
      requirement: "isbn",
      status: "verified",
      provenanceRecordId: null,
      note: "A raw value exists but has no reviewed evidence.",
    }).success,
    blockingRequirementsCannotBeSkipped:
      !contentQualityAssessmentInputSchema.safeParse({
        editionId: EDITION_ID,
        evidence: [
          {
            requirement: "title",
            status: "not-applicable",
            provenanceRecordId: null,
            note: "Invalid attempt to skip a blocking requirement.",
          },
        ],
      }).success,
    unverifiedFactsReceiveNoCredit: unverifiedIsNotCounted,
    completeBlockingChecklistIsReleaseReady:
      assessment.releaseReady &&
      assessment.blocking.verified ===
        BLOCKING_CONTENT_QUALITY_REQUIREMENTS.length &&
      assessment.blocking.failures.length === 0,
  };
}

function runSerializationChecks(approvedRecord: CatalogProvenanceRecord) {
  const recordWithInternalNote = {
    ...approvedRecord,
    reviewerNote: INTERNAL_SENTINEL,
  };
  const publicProvenance = toPublicCatalogProvenance(recordWithInternalNote);
  const publicProvenanceJson = JSON.stringify(publicProvenance);
  const draftProvenance = toPublicCatalogProvenance({
    ...recordWithInternalNote,
    reviewStatus: "draft",
    reviewedAt: null,
  });
  const catalogJson = JSON.stringify(
    toBookCatalogApiItem(createCatalogRecordWithInternalNotes()),
  );

  return {
    publicSerializerOmitsInternalFields:
      publicProvenance !== null &&
      !publicProvenanceJson.includes(INTERNAL_SENTINEL) &&
      !publicProvenanceJson.includes("reviewerNote") &&
      !publicProvenanceJson.includes("sourceEditionKey") &&
      !publicProvenanceJson.includes("rightsBasisNote"),
    nonApprovedProvenanceIsNotPublic: draftProvenance === null,
    catalogSerializerDoesNotLeakInternalNotes:
      !catalogJson.includes(INTERNAL_SENTINEL) &&
      !catalogJson.includes("reviewerNote") &&
      !catalogJson.includes("sourceNote") &&
      !catalogJson.includes("internalProvenance"),
    publicKeys: publicProvenance ? Object.keys(publicProvenance).sort() : [],
  };
}

function createRecord(
  overrides: Partial<CatalogProvenanceRecord>,
): CatalogProvenanceRecord {
  return {
    id: "provenance-record",
    entityType: "cover-asset",
    entityId: "cover-asset",
    fieldKey: "primary-cover",
    sourceLabel: "CaseFlow Books",
    sourceUrl: null,
    checkedAt: CHECKED_AT,
    contentKind: "media",
    rightsBasis: "project-created",
    rightsBasisNote: "Original project-created content.",
    license: null,
    attribution: {
      required: false,
      text: null,
      url: null,
      displayLocation: null,
    },
    reviewStatus: "approved",
    reviewerNote: "Internal rights review completed.",
    reviewedAt: REVIEWED_AT,
    editionMatchConfidence: "not-applicable",
    sourceEditionKey: null,
    ...overrides,
  };
}

function createEditionFact(
  field: EditionSourceFactField,
  sourceEditionKey: string,
): CatalogProvenanceRecord {
  return createRecord({
    id: `provenance-${field}`,
    entityType: "edition",
    entityId: EDITION_ID,
    fieldKey: field,
    sourceLabel: "Reviewed bibliographic source",
    sourceUrl: "https://openlibrary.org/books/OL1M",
    contentKind: "bibliographic-fact",
    rightsBasis: "factual-data",
    rightsBasisNote:
      "Bibliographic fact matched to the identified source edition.",
    editionMatchConfidence: "exact",
    sourceEditionKey,
  });
}

function createCatalogRecordWithInternalNotes(): SupabaseBookCatalogRecord {
  const edition = caseflowBooksSeed.editions[0];
  const work = caseflowBooksSeed.works.find((item) => item.id === edition.workId);

  if (!work) {
    throw new Error("Seed edition is missing its work");
  }

  const publisher = caseflowBooksSeed.publishers.find(
    (item) => item.id === edition.publisherId,
  );
  const coverAsset = caseflowBooksSeed.coverAssets.find(
    (item) => item.id === edition.coverImageId,
  );

  const withInternalProvenance = <T extends object>(value: T) => ({
    ...value,
    internalProvenance: { reviewerNote: INTERNAL_SENTINEL },
  });

  return {
    edition: withInternalProvenance(edition),
    work: withInternalProvenance(work),
    authors: caseflowBooksSeed.authors
      .filter((author) => work.primaryAuthorIds.includes(author.id))
      .map(withInternalProvenance),
    categories: caseflowBooksSeed.categories
      .filter((category) => work.categoryIds.includes(category.id))
      .map(withInternalProvenance),
    translators: [],
    publisher: publisher ? withInternalProvenance(publisher) : null,
    coverAsset: coverAsset ? withInternalProvenance(coverAsset) : null,
  };
}

function parses(value: unknown): boolean {
  return catalogProvenanceRecordSchema.safeParse(value).success;
}

function rejects(value: unknown): boolean {
  return !catalogProvenanceRecordSchema.safeParse(value).success;
}

main();
