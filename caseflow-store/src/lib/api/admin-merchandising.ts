import type {
  SupabaseResolvedMerchandisingShelf,
} from "@/lib/repositories/supabase-merchandising";
import type { LocalizedText } from "@/types/domain";
import type {
  MerchandisingPermission,
  MerchandisingRuleKind,
  MerchandisingShelfType,
  MerchandisingSourceKind,
} from "@/types/merchandising";

export type AdminMerchandisingShelfApiItem = {
  id: string;
  type: "admin-merchandising-shelf";
  slug: string;
  labels: LocalizedText;
  description: LocalizedText;
  shelfType: MerchandisingShelfType;
  sourceKind: MerchandisingSourceKind;
  ruleKind: MerchandisingRuleKind;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  sortOrder: number;
  minItems: number;
  maxItems: number;
  manualSlotCount: number;
  activeManualSlotCount: number;
  resolvedEditionCount: number;
  usedFallback: boolean;
  warnings: string[];
  requiredPermission: MerchandisingPermission;
};

export function toAdminMerchandisingShelfApiItems(
  resolvedShelves: SupabaseResolvedMerchandisingShelf[],
): AdminMerchandisingShelfApiItem[] {
  return resolvedShelves.map(({ editionIds, shelf, usedFallback, warnings }) => ({
    id: shelf.id,
    type: "admin-merchandising-shelf",
    slug: shelf.slug,
    labels: shelf.labels,
    description: shelf.description,
    shelfType: shelf.type,
    sourceKind: shelf.sourceKind,
    ruleKind: shelf.inclusionRule.kind,
    startsAt: shelf.startsAt,
    endsAt: shelf.endsAt,
    isActive: shelf.isActive,
    sortOrder: shelf.sortOrder,
    minItems: shelf.minItems,
    maxItems: shelf.maxItems,
    manualSlotCount: shelf.manualSlots.length,
    activeManualSlotCount: shelf.manualSlots.filter((slot) => slot.isActive)
      .length,
    resolvedEditionCount: editionIds.length,
    usedFallback,
    warnings,
    requiredPermission: shelf.requiredPermission,
  }));
}
