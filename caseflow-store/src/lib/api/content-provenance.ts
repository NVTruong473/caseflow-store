import type {
  CatalogProvenanceRecord,
  PublicCatalogProvenance,
} from "@/types/content-provenance";

export function toPublicCatalogProvenance(
  record: CatalogProvenanceRecord,
): PublicCatalogProvenance | null {
  if (record.reviewStatus !== "approved") {
    return null;
  }

  return {
    sourceLabel: record.sourceLabel,
    sourceUrl: record.sourceUrl,
    checkedAt: record.checkedAt,
    contentKind: record.contentKind,
    rightsBasis: record.rightsBasis,
    license: record.license,
    attribution: record.attribution,
    reviewStatus: "approved",
  };
}
