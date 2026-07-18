import { contentQualityAssessmentInputSchema } from "@/lib/validation/content-provenance";
import {
  BLOCKING_CONTENT_QUALITY_REQUIREMENTS,
  OPTIONAL_CONTENT_QUALITY_REQUIREMENTS,
} from "@/types/content-provenance";
import type {
  BlockingContentQualityRequirement,
  ContentQualityAssessment,
  ContentQualityAssessmentInput,
  ContentQualityCheck,
  ContentQualityEvidence,
  ContentQualityRequirement,
  ContentQualityRequirementLevel,
} from "@/types/content-provenance";

const requirementLevels = new Map<
  ContentQualityRequirement,
  ContentQualityRequirementLevel
>([
  ...BLOCKING_CONTENT_QUALITY_REQUIREMENTS.map(
    (requirement) => [requirement, "blocking"] as const,
  ),
  ...OPTIONAL_CONTENT_QUALITY_REQUIREMENTS.map(
    (requirement) => [requirement, "optional"] as const,
  ),
]);

export function assessContentQuality(
  rawInput: ContentQualityAssessmentInput,
): ContentQualityAssessment {
  const input = contentQualityAssessmentInputSchema.parse(rawInput);
  const suppliedEvidence = new Map(
    input.evidence.map((evidence) => [evidence.requirement, evidence]),
  );

  const checks = [...requirementLevels].map(([requirement, level]) => {
    const evidence =
      suppliedEvidence.get(requirement) ?? createMissingEvidence(requirement);

    return {
      ...evidence,
      level,
    } satisfies ContentQualityCheck;
  });

  const blockingChecks = checks.filter((check) => check.level === "blocking");
  const optionalChecks = checks.filter((check) => check.level === "optional");
  const applicableChecks = checks.filter(
    (check) => check.status !== "not-applicable",
  );
  const verifiedChecks = applicableChecks.filter(
    (check) => check.status === "verified",
  );
  const blockingFailures = blockingChecks
    .filter((check) => check.status !== "verified")
    .map(
      (check) => check.requirement as BlockingContentQualityRequirement,
    );

  return {
    editionId: input.editionId,
    qualityScore:
      applicableChecks.length === 0
        ? 0
        : Math.round((verifiedChecks.length / applicableChecks.length) * 100),
    releaseReady: blockingFailures.length === 0,
    blocking: {
      verified: blockingChecks.length - blockingFailures.length,
      total: blockingChecks.length,
      failures: blockingFailures,
    },
    optional: {
      verified: optionalChecks.filter((check) => check.status === "verified")
        .length,
      applicable: optionalChecks.filter(
        (check) => check.status !== "not-applicable",
      ).length,
      total: optionalChecks.length,
    },
    checks,
  };
}

function createMissingEvidence(
  requirement: ContentQualityRequirement,
): ContentQualityEvidence {
  return {
    requirement,
    status: "missing",
    provenanceRecordId: null,
    note: "No verified evidence supplied",
  };
}
