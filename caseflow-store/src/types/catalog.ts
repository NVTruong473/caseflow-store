import type { BookFormat, EditionLanguage, InventoryStatus } from "@/types/domain";

export type ValidatedCartCategory = {
  id: string;
  labels?: {
    en: string;
    vi: string;
  };
  name: string;
  slug: string;
};

export type ValidatedCartProduct = {
  authors: string[];
  coverAlt: string;
  coverPath: string;
  format: BookFormat;
  id: string;
  inventoryStatus: InventoryStatus;
  language: EditionLanguage;
  name: string;
  price: number;
  slug: string;
  stock: number;
};

export type ValidatedCartLine = {
  availableStock: number;
  categories: ValidatedCartCategory[];
  category: ValidatedCartCategory | null;
  editionId: string;
  lineTotal: number;
  productId: string;
  product: ValidatedCartProduct;
  quantity: number;
  unitPrice: number;
};

export type ValidatedCartData = {
  currency: "VND";
  items: ValidatedCartLine[];
  subtotal: number;
};
