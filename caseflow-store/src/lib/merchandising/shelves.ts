import {
  MERCHANDISING_MANAGEMENT_PERMISSION,
} from "@/types/merchandising";
import type {
  MerchandisingCatalogEdition,
  MerchandisingManifest,
  MerchandisingMutationActor,
  MerchandisingResolvedShelf,
  MerchandisingShelf,
} from "@/types/merchandising";

export function canMutateMerchandisingShelf(
  actor: MerchandisingMutationActor,
): boolean {
  return (
    (actor.role === "admin" || actor.role === "staff") &&
    actor.permissions.includes(MERCHANDISING_MANAGEMENT_PERMISSION)
  );
}

export function resolveMerchandisingShelf(
  shelf: MerchandisingShelf,
  allShelves: MerchandisingShelf[],
  editions: MerchandisingCatalogEdition[],
  now = new Date("2026-07-17T00:00:00.000Z"),
): MerchandisingResolvedShelf {
  const warnings: string[] = [];
  const editionIds = resolveShelfEditionIds(shelf, editions, warnings);
  const activeEditionIds = editionIds
    .filter((editionId) => editions.some((edition) => edition.editionId === editionId))
    .slice(0, shelf.maxItems);
  const isShelfActive = isActiveInWindow(shelf, now);

  if (!isShelfActive) {
    return {
      shelfSlug: shelf.slug,
      sourceShelfSlug: shelf.slug,
      usedFallback: false,
      editionIds: [],
      warnings: ["shelf-inactive"],
    };
  }

  if (activeEditionIds.length >= shelf.minItems) {
    return {
      shelfSlug: shelf.slug,
      sourceShelfSlug: shelf.slug,
      usedFallback: false,
      editionIds: activeEditionIds,
      warnings,
    };
  }

  if (
    shelf.fallback.kind === "use-shelf" &&
    shelf.fallback.fallbackShelfSlug !== null
  ) {
    const fallback = allShelves.find(
      (candidate) => candidate.slug === shelf.fallback.fallbackShelfSlug,
    );
    if (fallback) {
      const fallbackResult = resolveMerchandisingShelf(
        fallback,
        allShelves,
        editions,
        now,
      );
      return {
        shelfSlug: shelf.slug,
        sourceShelfSlug: fallbackResult.sourceShelfSlug,
        usedFallback: true,
        editionIds: fallbackResult.editionIds.slice(0, shelf.maxItems),
        warnings: [...warnings, "fallback-used", ...fallbackResult.warnings],
      };
    }
  }

  return {
    shelfSlug: shelf.slug,
    sourceShelfSlug: shelf.slug,
    usedFallback: false,
    editionIds: [],
    warnings: [...warnings, "minimum-items-not-met"],
  };
}

export function resolveMerchandisingManifest(
  manifest: MerchandisingManifest,
  editions: MerchandisingCatalogEdition[],
): MerchandisingResolvedShelf[] {
  return [...manifest.shelves]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((shelf) => resolveMerchandisingShelf(shelf, manifest.shelves, editions));
}

function resolveShelfEditionIds(
  shelf: MerchandisingShelf,
  editions: MerchandisingCatalogEdition[],
  warnings: string[],
): string[] {
  const activeEditions = editions.filter((edition) => edition.isActive);

  switch (shelf.inclusionRule.kind) {
    case "manual-edition-list":
      return shelf.manualSlots
        .filter((slot) => slot.isActive)
        .sort((left, right) => left.position - right.position)
        .map((slot) => slot.editionId);
    case "catalog-filter":
      return sortEditions(
        activeEditions.filter((edition) => matchesFilter(edition, shelf)),
        shelf.inclusionRule.sort,
      ).map((edition) => edition.editionId);
    case "paired-editions":
      return resolvePairedEditionIds(activeEditions);
    case "order-derived":
      warnings.push("order-derived-disabled-until-first-party-query-runs");
      return [];
  }
}

function resolvePairedEditionIds(
  editions: MerchandisingCatalogEdition[],
): string[] {
  const editionsByPairId = new Map<string, MerchandisingCatalogEdition[]>();

  for (const edition of editions) {
    const pairEditions = editionsByPairId.get(edition.pairId) ?? [];
    pairEditions.push(edition);
    editionsByPairId.set(edition.pairId, pairEditions);
  }

  return Array.from(editionsByPairId.values())
    .map((pairEditions) => {
      const english = pairEditions.find((edition) => edition.language === "en");
      const vietnamese = pairEditions.find((edition) => edition.language === "vi");

      return english && vietnamese ? [english, vietnamese] : null;
    })
    .filter((pair): pair is [MerchandisingCatalogEdition, MerchandisingCatalogEdition] =>
      Boolean(pair),
    )
    .sort((left, right) => {
      return left[0].title.localeCompare(right[0].title);
    })
    .flatMap(([english, vietnamese]) => [
      english.editionId,
      vietnamese.editionId,
    ]);
}

function matchesFilter(
  edition: MerchandisingCatalogEdition,
  shelf: MerchandisingShelf,
) {
  if (shelf.inclusionRule.kind !== "catalog-filter") return false;
  const filters = shelf.inclusionRule.filters;

  if (
    filters.categorySlugs.length > 0 &&
    !filters.categorySlugs.some((slug) => edition.categorySlugs.includes(slug))
  ) {
    return false;
  }

  if (filters.languages.length > 0 && !filters.languages.includes(edition.language)) {
    return false;
  }

  if (
    filters.featuredOnly !== null &&
    edition.isFeatured !== filters.featuredOnly
  ) {
    return false;
  }

  if (
    filters.promotionEligible !== null &&
    edition.promotionEligible !== filters.promotionEligible
  ) {
    return false;
  }

  if (
    filters.inventoryStatuses.length > 0 &&
    !filters.inventoryStatuses.includes(edition.inventoryStatus)
  ) {
    return false;
  }

  return true;
}

function sortEditions(
  editions: MerchandisingCatalogEdition[],
  sort: Exclude<MerchandisingShelf["inclusionRule"], { kind: "order-derived" }>["sort"],
) {
  return [...editions].sort((left, right) => {
    if (sort === "price-asc") {
      return left.priceVnd - right.priceVnd || left.title.localeCompare(right.title);
    }
    if (sort === "featured-then-title") {
      return Number(right.isFeatured) - Number(left.isFeatured) ||
        left.title.localeCompare(right.title);
    }
    if (sort === "stock-asc") {
      return inventoryRank(left.inventoryStatus) - inventoryRank(right.inventoryStatus) ||
        left.title.localeCompare(right.title);
    }
    return left.title.localeCompare(right.title);
  });
}

function inventoryRank(status: MerchandisingCatalogEdition["inventoryStatus"]) {
  if (status === "low-stock") return 0;
  if (status === "in-stock") return 1;
  if (status === "preorder") return 2;
  if (status === "out-of-stock") return 3;
  return 4;
}

function isActiveInWindow(shelf: MerchandisingShelf, now: Date) {
  if (!shelf.isActive) return false;
  const nowMs = now.getTime();
  if (shelf.startsAt !== null && Date.parse(shelf.startsAt) > nowMs) return false;
  if (shelf.endsAt !== null && Date.parse(shelf.endsAt) <= nowMs) return false;
  return true;
}
