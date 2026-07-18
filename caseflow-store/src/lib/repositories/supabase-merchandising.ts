import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveMerchandisingShelf } from "@/lib/merchandising/shelves";
import type {
  SupabaseBookCatalogRecord,
  SupabaseBookRepositoryOptions,
} from "@/lib/repositories/supabase-books";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { merchandisingShelfSchema } from "@/lib/validation/merchandising";
import type { Database, TableRow, TableUpdate } from "@/types/supabase";
import type {
  MerchandisingCatalogEdition,
  MerchandisingManualSlot,
  MerchandisingResolvedShelf,
  MerchandisingShelf,
} from "@/types/merchandising";

export type SupabaseResolvedMerchandisingShelf = MerchandisingResolvedShelf & {
  shelf: MerchandisingShelf;
  records: SupabaseBookCatalogRecord[];
};

export type SupabaseAdminMerchandisingShelfUpdateInput = {
  isActive?: boolean;
  sortOrder?: number;
};

export async function listSupabaseMerchandisingShelves(
  options: SupabaseBookRepositoryOptions = {},
): Promise<MerchandisingShelf[]> {
  const supabase = await getSupabaseMerchandisingClient(options);
  const [shelfResult, itemResult] = await Promise.all([
    supabase
      .from("book_merchandising_shelves")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("slug", { ascending: true }),
    supabase
      .from("book_merchandising_shelf_items")
      .select("*")
      .order("position", { ascending: true })
      .order("edition_id", { ascending: true }),
  ]);

  throwIfSupabaseError("book merchandising shelves", shelfResult.error);
  throwIfSupabaseError("book merchandising shelf items", itemResult.error);

  return mapMerchandisingShelfRows(
    shelfResult.data ?? [],
    itemResult.data ?? [],
  );
}

export function resolveSupabaseMerchandisingShelves(
  records: SupabaseBookCatalogRecord[],
  shelves: MerchandisingShelf[],
  now = new Date(),
): SupabaseResolvedMerchandisingShelf[] {
  const catalogEditions = records.map(toMerchandisingCatalogEdition);
  const recordsByEditionId = new Map(
    records.map((record) => [record.edition.id, record]),
  );

  return [...shelves]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((shelf) => {
      const resolved = resolveMerchandisingShelf(
        shelf,
        shelves,
        catalogEditions,
        now,
      );
      const resolvedRecords = resolved.editionIds
        .map((editionId) => recordsByEditionId.get(editionId))
        .filter(
          (record): record is SupabaseBookCatalogRecord => Boolean(record),
        );

      return {
        ...resolved,
        shelf,
        records: resolvedRecords,
      };
    });
}

export function getResolvedMerchandisingShelf(
  shelves: SupabaseResolvedMerchandisingShelf[],
  shelfSlug: string,
): SupabaseResolvedMerchandisingShelf | null {
  return shelves.find((shelf) => shelf.shelfSlug === shelfSlug) ?? null;
}

export async function updateSupabaseAdminMerchandisingShelf(
  shelfId: string,
  input: SupabaseAdminMerchandisingShelfUpdateInput,
): Promise<MerchandisingShelf | null> {
  const supabase = createSupabaseAdminClient();
  const update: TableUpdate<"book_merchandising_shelves"> = {};

  if (input.isActive !== undefined) update.is_active = input.isActive;
  if (input.sortOrder !== undefined) update.sort_order = input.sortOrder;

  if (Object.keys(update).length === 0) {
    const shelves = await listSupabaseMerchandisingShelves({
      client: supabase,
    });

    return shelves.find((shelf) => shelf.id === shelfId) ?? null;
  }

  const { data, error } = await supabase
    .from("book_merchandising_shelves")
    .update(update)
    .eq("id", shelfId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error("Failed to update merchandising shelf", { cause: error });
  }

  if (!data) {
    return null;
  }

  const shelves = await listSupabaseMerchandisingShelves({
    client: supabase,
  });

  return shelves.find((shelf) => shelf.id === shelfId) ?? null;
}

function mapMerchandisingShelfRows(
  shelfRows: TableRow<"book_merchandising_shelves">[],
  itemRows: TableRow<"book_merchandising_shelf_items">[],
): MerchandisingShelf[] {
  const itemRowsByShelfId = new Map<
    string,
    TableRow<"book_merchandising_shelf_items">[]
  >();

  for (const itemRow of itemRows) {
    const shelfItems = itemRowsByShelfId.get(itemRow.shelf_id) ?? [];
    shelfItems.push(itemRow);
    itemRowsByShelfId.set(itemRow.shelf_id, shelfItems);
  }

  return shelfRows.map((row) =>
    merchandisingShelfSchema.parse({
      id: row.id,
      slug: row.slug,
      type: row.shelf_type,
      sourceKind: row.source_kind,
      labels: row.labels,
      description: row.description,
      inclusionRule: row.inclusion_rule,
      manualSlots: (itemRowsByShelfId.get(row.id) ?? []).map(
        mapMerchandisingShelfItemRow,
      ),
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      minItems: row.min_items,
      maxItems: row.max_items,
      fallback: row.fallback,
      requiredPermission: row.required_permission,
    }),
  );
}

function mapMerchandisingShelfItemRow(
  row: TableRow<"book_merchandising_shelf_items">,
): MerchandisingManualSlot {
  return {
    editionId: row.edition_id,
    position: row.position,
    isActive: row.is_active,
    note: row.note,
  };
}

function toMerchandisingCatalogEdition(
  record: SupabaseBookCatalogRecord,
): MerchandisingCatalogEdition {
  return {
    editionId: record.edition.id,
    workId: record.work.id,
    pairId: record.edition.pairId ?? record.work.id,
    slug: record.edition.slug,
    language: record.edition.language,
    title: record.edition.displayTitle,
    authors: record.authors.map((author) => author.name),
    categorySlugs: record.categories.map((category) => category.slug),
    priceVnd: record.edition.priceVnd,
    isFeatured: record.edition.isFeatured,
    promotionEligible: record.edition.compareAtPriceVnd !== null,
    inventoryStatus: record.edition.inventoryStatus,
    isActive: record.edition.isActive,
  };
}

async function getSupabaseMerchandisingClient(
  options: SupabaseBookRepositoryOptions,
): Promise<SupabaseClient<Database>> {
  return options.client ?? createSupabaseServerClient();
}

function throwIfSupabaseError(label: string, error: unknown) {
  if (error) {
    throw new Error(`Failed to read ${label}`, { cause: error });
  }
}
