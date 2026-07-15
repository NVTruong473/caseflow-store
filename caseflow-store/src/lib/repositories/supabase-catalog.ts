import { mapCategoryRowToDomain, mapProductRowToDomain } from "@/lib/supabase/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CartValidationRequest } from "@/lib/validation/cart";
import type { ProductListQuery } from "@/lib/validation/products";
import type { Category, Product } from "@/types/domain";
import type { ValidatedCartData, ValidatedCartLine } from "@/types/catalog";

type CartValidationFailure = {
  status: 400 | 404 | 409;
  code: "VALIDATION_ERROR" | "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK";
  message: string;
};

export type SupabaseCartValidationResult =
  | { success: true; data: ValidatedCartData }
  | { success: false; error: CartValidationFailure };

export async function listSupabaseCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Failed to read catalog categories", { cause: error });
  }

  return data.map(mapCategoryRowToDomain);
}

export async function listSupabaseProducts(
  query: ProductListQuery,
): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true);

  if (error) {
    throw new Error("Failed to read catalog products", { cause: error });
  }

  let products = data.map(mapProductRowToDomain);

  if (query.category) {
    const categories = await listSupabaseCategories();
    const categoryId = categories.find(
      (category) => category.slug === query.category,
    )?.id;
    products = categoryId
      ? products.filter((product) => product.categoryId === categoryId)
      : [];
  }

  if (query.compatibility) {
    const compatibility = query.compatibility;
    products = products.filter((product) => {
      return compatibility === "Universal"
        ? product.compatibility.includes("Universal")
        : product.compatibility.includes(compatibility) ||
            product.compatibility.includes("Universal");
    });
  }

  if (query.featured !== undefined) {
    products = products.filter(
      (product) => product.isFeatured === query.featured,
    );
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

export async function getSupabaseProductBySlug(
  slug: string,
): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to read catalog product", { cause: error });
  }

  return data ? mapProductRowToDomain(data) : null;
}

export async function validateSupabaseCart(
  items: CartValidationRequest["items"],
): Promise<SupabaseCartValidationResult> {
  const quantitiesByProductId = new Map<string, number>();

  for (const item of items) {
    quantitiesByProductId.set(
      item.productId,
      (quantitiesByProductId.get(item.productId) ?? 0) + item.quantity,
    );
  }

  if (quantitiesByProductId.size === 0) {
    return {
      success: true,
      data: { items: [], subtotal: 0, currency: "VND" },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", [...quantitiesByProductId.keys()])
    .eq("is_active", true);

  if (error) {
    throw new Error("Failed to validate cart products", { cause: error });
  }

  const productsById = new Map(
    data.map(mapProductRowToDomain).map((product) => [product.id, product]),
  );
  const categories = await listSupabaseCategories();
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const lines: ValidatedCartLine[] = [];

  for (const [productId, quantity] of quantitiesByProductId) {
    const product = productsById.get(productId);

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
      category: categoriesById.get(product.categoryId) ?? null,
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

function sortProducts(
  products: Product[],
  sort: ProductListQuery["sort"],
): Product[] {
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
