import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Container } from "@/components/ui";
import { ProductPurchaseControls, ProductVisual } from "@/features/products";
import { formatVnd } from "@/lib/format/currency";
import {
  getSupabaseProductBySlug,
  listSupabaseCategories,
} from "@/lib/repositories/supabase-catalog";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getSupabaseProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found - CaseFlow Store",
    };
  }

  return {
    title: `${product.name} - CaseFlow Store`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getSupabaseProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const category = (await listSupabaseCategories()).find(
    (item) => item.id === product.categoryId,
  );

  if (!category) {
    notFound();
  }

  const isInStock = product.stock > 0;

  return (
    <main className="bg-background py-case-2xl text-foreground">
      <Container className="flex flex-col gap-case-xl">
        <Link
          href="/#products"
          className="text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to products
        </Link>

        <section
          className="grid gap-case-xl lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:items-start"
          data-product-detail={product.slug}
        >
          <div
            className="aspect-square rounded-lg border border-border bg-surface p-case-md"
            role="img"
            aria-label={`${product.name} product image`}
            data-product-detail-image
          >
            <ProductVisual categorySlug={category.slug} />
          </div>

          <div className="flex min-w-0 flex-col gap-case-lg">
            <div className="flex flex-col gap-case-sm">
              <div className="flex flex-wrap gap-case-xs">
                <Badge variant="primary">{category.name}</Badge>
                <Badge variant={isInStock ? "success" : "error"}>
                  {isInStock ? "In stock" : "Out of stock"}
                </Badge>
              </div>
              <h1 className="text-heading-1 font-semibold text-foreground">
                {product.name}
              </h1>
              <p
                className="max-w-2xl text-body leading-7 text-text-muted"
                data-product-detail-description
              >
                {product.description}
              </p>
            </div>

            <div className="grid gap-case-md sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface p-case-lg">
                <p className="text-small font-medium uppercase text-text-muted">
                  Price
                </p>
                <p
                  className="mt-case-sm text-heading-2 font-semibold text-foreground"
                  data-product-detail-price
                >
                  {formatVnd(product.price)}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface p-case-lg">
                <p className="text-small font-medium uppercase text-text-muted">
                  Availability
                </p>
                <p
                  className="mt-case-sm text-heading-3 font-semibold text-foreground"
                  data-product-detail-stock={product.stock}
                >
                  {product.stock} left
                </p>
              </div>
            </div>

            <ProductPurchaseControls
              productId={product.id}
              productName={product.name}
              stock={product.stock}
            />

            <div className="rounded-lg border border-border bg-surface p-case-lg">
              <h2 className="text-heading-3 font-semibold text-foreground">
                Compatibility
              </h2>
              <div className="mt-case-md flex flex-wrap gap-case-sm">
                {product.compatibility.map((label) => (
                  <Badge
                    key={label}
                    variant={label === "Universal" ? "success" : "primary"}
                    size="md"
                    data-product-detail-compatibility={label}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-case-lg">
              <h2 className="text-heading-3 font-semibold text-foreground">
                Category
              </h2>
              <p className="mt-case-sm font-medium text-foreground">
                {category.name}
              </p>
              <p className="mt-case-xs max-w-xl text-body leading-7 text-text-muted">
                {category.description}
              </p>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
