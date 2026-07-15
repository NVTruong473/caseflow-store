import Link from "next/link";

import { Badge, Card } from "@/components/ui";
import { formatVnd } from "@/lib/format/currency";
import type { Category, Product } from "@/types/domain";

import { ProductVisual } from "./product-visual";

export function ProductCard({
  category,
  product,
}: {
  category: Category;
  product: Product;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      aria-label={`View details for ${product.name}`}
      className="block h-full rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      data-product-card={product.slug}
    >
      <Card
        variant="interactive"
        className="flex h-full flex-col"
        padding="none"
      >
        <div className="aspect-square p-case-md">
          <ProductVisual categorySlug={category.slug} />
        </div>
        <div className="flex flex-1 flex-col gap-case-sm px-case-md pb-case-md">
          <div className="flex flex-wrap items-center gap-case-xs">
            <Badge variant="neutral">{category.name}</Badge>
            {product.stock > 0 ? (
              <Badge variant="success">In stock</Badge>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-case-xs">
            <h3 className="text-body font-semibold text-foreground">
              {product.name}
            </h3>
            <p className="line-clamp-2 text-small leading-6 text-text-muted">
              {product.description}
            </p>
          </div>
          <div className="flex items-end justify-between gap-case-sm">
            <p className="text-heading-3 font-semibold text-foreground">
              {formatVnd(product.price)}
            </p>
            <p className="text-small text-text-muted">{product.stock} left</p>
          </div>
          <p className="text-small font-medium text-primary">
            View details
          </p>
        </div>
      </Card>
    </Link>
  );
}
