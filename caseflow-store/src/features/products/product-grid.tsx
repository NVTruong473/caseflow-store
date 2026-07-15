import { ProductCard } from "@/features/products/product-card";
import type { Category, Product } from "@/types/domain";

export function ProductGrid({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  return (
    <div className="grid gap-case-md sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => {
        const category = categoryById.get(product.categoryId);

        if (!category) {
          return null;
        }

        return (
          <ProductCard
            key={product.id}
            category={category}
            product={product}
          />
        );
      })}
    </div>
  );
}
