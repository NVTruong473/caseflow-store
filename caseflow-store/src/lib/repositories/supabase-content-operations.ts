import { assessContentQuality } from "@/lib/content/content-quality";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ContentQualityEvidenceStatus,
  ContentQualityRequirement,
} from "@/types/content-provenance";
import type { TableRow } from "@/types/supabase";

export type AdminContentQualitySummary = {
  editionId: string;
  qualityScore: number;
  releaseReady: boolean;
  blocking: {
    total: number;
    verified: number;
    missing: number;
    unverified: number;
    failures: string[];
  };
  optional: {
    total: number;
    applicable: number;
    verified: number;
    missing: number;
    unverified: number;
  };
  updatedAt: string | null;
};

type QualityRow = TableRow<"book_content_quality_checks">;

export async function listSupabaseAdminContentQualitySummaries(
  editionIds: string[] = [],
): Promise<Map<string, AdminContentQualitySummary>> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("book_content_quality_checks")
    .select("*")
    .order("edition_id", { ascending: true })
    .order("requirement", { ascending: true });

  if (editionIds.length > 0) {
    query = query.in("edition_id", editionIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to read content quality checks", { cause: error });
  }

  return summarizeContentQualityRows(data ?? []);
}

function summarizeContentQualityRows(rows: QualityRow[]) {
  const rowsByEditionId = new Map<string, QualityRow[]>();

  for (const row of rows) {
    const editionRows = rowsByEditionId.get(row.edition_id) ?? [];
    editionRows.push(row);
    rowsByEditionId.set(row.edition_id, editionRows);
  }

  return new Map(
    [...rowsByEditionId.entries()].map(([editionId, editionRows]) => {
      const assessment = assessContentQuality({
        editionId,
        evidence: editionRows.map((row) => ({
          note: row.note,
          provenanceRecordId: row.provenance_record_id,
          requirement: row.requirement as ContentQualityRequirement,
          status: row.status as ContentQualityEvidenceStatus,
        })),
      });
      const blockingMissing = assessment.checks.filter(
        (check) => check.level === "blocking" && check.status === "missing",
      );
      const blockingUnverified = assessment.checks.filter(
        (check) => check.level === "blocking" && check.status === "unverified",
      );
      const optionalMissing = assessment.checks.filter(
        (check) => check.level === "optional" && check.status === "missing",
      );
      const optionalUnverified = assessment.checks.filter(
        (check) => check.level === "optional" && check.status === "unverified",
      );

      return [
        editionId,
        {
          editionId,
          qualityScore: assessment.qualityScore,
          releaseReady: assessment.releaseReady,
          blocking: {
            total: assessment.blocking.total,
            verified: assessment.blocking.verified,
            missing: blockingMissing.length,
            unverified: blockingUnverified.length,
            failures: assessment.blocking.failures,
          },
          optional: {
            total: assessment.optional.total,
            applicable: assessment.optional.applicable,
            verified: assessment.optional.verified,
            missing: optionalMissing.length,
            unverified: optionalUnverified.length,
          },
          updatedAt: latestUpdatedAt(editionRows),
        } satisfies AdminContentQualitySummary,
      ] as const;
    }),
  );
}

function latestUpdatedAt(rows: QualityRow[]) {
  return rows.reduce<string | null>((latest, row) => {
    if (latest === null) return row.updated_at;

    return Date.parse(row.updated_at) > Date.parse(latest)
      ? row.updated_at
      : latest;
  }, null);
}
