import type { Category, Product } from "@/types/domain";

export type ValidatedCartLine = {
  productId: string;
  product: Product;
  category: Category | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
};

export type ValidatedCartData = {
  items: ValidatedCartLine[];
  subtotal: number;
  currency: "VND";
};
