import type { SupabaseBookCatalogRecord } from "@/lib/repositories/supabase-books";
import type {
  BookAuthor,
  InventoryAdjustment,
  InventoryStatus,
} from "@/types/domain";

export type AdminInventoryEditionApiItem = {
  id: string;
  title: string;
  slug: string;
  authors: Pick<BookAuthor, "id" | "name" | "slug">[];
  language: "en" | "vi";
  format: string;
  isActive: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  inventoryStatus: InventoryStatus;
  publicPath: string;
};

export type AdminInventoryAdjustmentApiItem = {
  id: string;
  editionId: string;
  quantityDelta: number;
  reason: string;
  createdByUserId: string;
  createdAt: string;
};

export function toAdminInventoryEditionApiItem(
  record: SupabaseBookCatalogRecord,
): AdminInventoryEditionApiItem {
  return {
    id: record.edition.id,
    title: record.edition.displayTitle,
    slug: record.edition.slug,
    authors: record.authors.map((author) => ({
      id: author.id,
      name: author.name,
      slug: author.slug,
    })),
    language: record.edition.language,
    format: record.edition.format,
    isActive: record.edition.isActive,
    stockQuantity: record.edition.stockQuantity,
    lowStockThreshold: record.edition.lowStockThreshold,
    inventoryStatus: record.edition.inventoryStatus,
    publicPath: `/products/${record.edition.slug}`,
  };
}

export function toAdminInventoryAdjustmentApiItem(
  adjustment: InventoryAdjustment,
): AdminInventoryAdjustmentApiItem {
  return {
    id: adjustment.id,
    editionId: adjustment.editionId,
    quantityDelta: adjustment.quantityDelta,
    reason: adjustment.reason,
    createdByUserId: adjustment.createdByUserId,
    createdAt: adjustment.createdAt,
  };
}
