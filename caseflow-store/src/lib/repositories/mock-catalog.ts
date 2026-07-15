import { mockCategories, mockProducts } from "@/data/mock/catalog";
import type { Category, Product } from "@/types/domain";
import type { ProductListQuery } from "@/lib/validation/products";
import type { CartValidationRequest } from "@/lib/validation/cart";

type CartValidationLine = {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
};

type CartValidationSuccess = {
  items: CartValidationLine[];
  subtotal: number;
  currency: "VND";
};

type CartValidationFailure = {
  status: 400 | 404 | 409;
  code: "VALIDATION_ERROR" | "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK";
  message: string;
};

type CartValidationResult =
  | { success: true; data: CartValidationSuccess }
  | { success: false; error: CartValidationFailure };

const activeCategoryIds = new Set(
  mockCategories.filter((category) => category.isActive).map((category) => category.id),
);

const categoryIdBySlug = new Map(
  mockCategories.map((category) => [category.slug, category.id]),
);

export function listMockProducts(query: ProductListQuery): Product[] {
  let products = listActiveMockProducts();

  if (query.category) {
    const categoryId = categoryIdBySlug.get(query.category);
    products = categoryId
      ? products.filter((product) => product.categoryId === categoryId)
      : [];
  }

  if (query.compatibility) {
    const compatibility = query.compatibility;

    products = products.filter((product) => {
      if (compatibility === "Universal") {
        return product.compatibility.includes("Universal");
      }

      return (
        product.compatibility.includes(compatibility) ||
        product.compatibility.includes("Universal")
      );
    });
  }

  if (query.featured !== undefined) {
    products = products.filter((product) => product.isFeatured === query.featured);
  }

  if (query.q) {
    const normalizedQuery = query.q.toLocaleLowerCase();
    products = products.filter((product) => {
      return (
        product.name.toLocaleLowerCase().includes(normalizedQuery) ||
        product.description.toLocaleLowerCase().includes(normalizedQuery) ||
        product.slug.toLocaleLowerCase().includes(normalizedQuery)
      );
    });
  }

  return sortProducts(products, query.sort);
}

export function getMockProductBySlug(slug: string): Product | null {
  return listActiveMockProducts().find((product) => product.slug === slug) ?? null;
}

export function validateMockCart(
  items: CartValidationRequest["items"],
): CartValidationResult {
  const quantitiesByProductId = new Map<string, number>();

  for (const item of items) {
    quantitiesByProductId.set(
      item.productId,
      (quantitiesByProductId.get(item.productId) ?? 0) + item.quantity,
    );
  }

  const lines: CartValidationLine[] = [];

  for (const [productId, quantity] of quantitiesByProductId) {
    const product = getMockProductById(productId);

    if (!product) {
      return {
        success: false,
        error: {
          status: 404,
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found or unavailable",
        },
      };
    }

    if (quantity > product.stock) {
      return {
        success: false,
        error: {
          status: 409,
          code: "OUT_OF_STOCK",
          message: "Requested quantity exceeds available stock",
        },
      };
    }

    lines.push({
      productId,
      product,
      quantity,
      unitPrice: product.price,
      lineTotal: product.price * quantity,
      availableStock: product.stock,
    });
  }

  return {
    success: true,
    data: {
      items: lines,
      subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
      currency: "VND",
    },
  };
}

export function listMockCategories(): Category[] {
  return mockCategories
    .filter((category) => category.isActive)
    .sort((first, second) => {
      return first.sortOrder - second.sortOrder || first.name.localeCompare(second.name);
    });
}

function listActiveMockProducts(): Product[] {
  return mockProducts.filter(
    (product) => product.isActive && activeCategoryIds.has(product.categoryId),
  );
}

function getMockProductById(productId: string): Product | null {
  return listActiveMockProducts().find((product) => product.id === productId) ?? null;
}

function sortProducts(products: Product[], sort: ProductListQuery["sort"]): Product[] {
  return [...products].sort((first, second) => {
    switch (sort) {
      case "price-asc":
        return first.price - second.price;
      case "price-desc":
        return second.price - first.price;
      case "name-asc":
        return first.name.localeCompare(second.name);
      case "newest":
      default:
        return Date.parse(second.createdAt) - Date.parse(first.createdAt);
    }
  });
}
