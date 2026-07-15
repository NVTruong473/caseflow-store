import Link from "next/link";

import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
} from "@/components/ui";
import { ProductCatalog, ProductVisual } from "@/features/products";
import { formatVnd } from "@/lib/format/currency";
import {
  listSupabaseCategories,
  listSupabaseProducts,
} from "@/lib/repositories/supabase-catalog";

const compatibilityHighlights = [
  "iPhone 16",
  "iPhone 15",
  "Galaxy S25",
  "Galaxy S24",
  "Pixel 9",
  "Universal",
] as const;

export default async function Home() {
  const [categories, products] = await Promise.all([
    listSupabaseCategories(),
    listSupabaseProducts({ sort: "newest" }),
  ]);
  const featuredProducts = products
    .filter((product) => product.isFeatured)
    .slice(0, 3);
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const productStats = [
    { label: "Categories", value: categories.length.toString() },
    { label: "Products", value: products.length.toString() },
    {
      label: "Featured",
      value: products
        .filter((product) => product.isFeatured)
        .length.toString(),
    },
  ];

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border bg-surface">
        <Container className="grid gap-case-xl py-case-2xl lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div className="flex min-w-0 flex-col gap-case-lg">
            <div className="flex flex-col gap-case-sm">
              <Badge variant="primary">Phone accessories</Badge>
              <h1 className="max-w-3xl text-heading-1 font-semibold text-foreground">
                Accessories matched to the phone you use every day.
              </h1>
              <p className="max-w-2xl text-body leading-7 text-text-muted">
                Shop practical cases, screen protection, chargers, cables, and
                stands with simple compatibility labels for current iPhone,
                Galaxy, and Pixel models.
              </p>
            </div>

            <div className="flex flex-col gap-case-sm sm:flex-row">
              <Link
                href="#products"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Shop products
              </Link>
              <Link
                href="#compatibility"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Check compatibility
              </Link>
            </div>

            <dl className="grid max-w-xl grid-cols-3 gap-case-sm">
              {productStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-md border border-border bg-background px-3 py-3"
                >
                  <dt className="text-small text-text-muted">{stat.label}</dt>
                  <dd className="mt-1 text-heading-3 font-semibold text-foreground">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-background p-case-md">
            <div className="grid gap-case-sm">
              {featuredProducts.slice(0, 2).map((product) => {
                const category = categoryById.get(product.categoryId);

                return (
                  <div
                    key={product.id}
                    className="grid min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-case-md rounded-md border border-border bg-surface p-case-sm"
                  >
                    <ProductVisual categorySlug={category?.slug ?? "phone-cases"} />
                    <div className="flex min-w-0 flex-col justify-center gap-case-xs">
                      <Badge variant="neutral">{category?.name ?? "Accessory"}</Badge>
                      <p className="truncate font-semibold text-foreground">
                        {product.name}
                      </p>
                      <p className="text-small font-medium text-primary">
                        {formatVnd(product.price)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      <Container className="flex flex-col gap-case-2xl py-case-2xl">
        <section id="categories" className="flex flex-col gap-case-lg">
          <div className="flex max-w-2xl flex-col gap-case-sm">
            <h2 className="text-heading-2 font-semibold text-foreground">
              Shop by category
            </h2>
            <p className="text-body leading-7 text-text-muted">
              Start with the accessory type, then narrow choices by phone model
              and everyday use.
            </p>
          </div>

          <div className="grid gap-case-md sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <Card key={category.id} variant="interactive" className="h-full">
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="products">
          <ProductCatalog categories={categories} products={products} />
        </section>

        <section
          id="compatibility"
          className="grid gap-case-lg rounded-lg border border-border bg-surface p-case-lg lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
        >
          <div className="flex flex-col gap-case-sm">
            <h2 className="text-heading-2 font-semibold text-foreground">
              Compatibility first
            </h2>
            <p className="text-body leading-7 text-text-muted">
              Products carry simple model labels so matching a case, protector,
              charger, or stand starts from the device you already own.
            </p>
          </div>
          <div className="flex flex-wrap gap-case-sm">
            {compatibilityHighlights.map((label) => (
              <Badge key={label} variant={label === "Universal" ? "success" : "primary"} size="md">
                {label}
              </Badge>
            ))}
          </div>
        </section>

        <section id="support" className="grid gap-case-md md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Clear stock state</CardTitle>
              <CardDescription>
                Availability is visible before checkout so out-of-stock items
                are easy to avoid.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Guest checkout path</CardTitle>
              <CardDescription>
                Checkout is designed for quick orders without requiring account
                creation.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card id="checkout">
            <CardHeader>
              <CardTitle>Order workflow ready</CardTitle>
              <CardDescription>
                Order status labels are kept simple so confirmation, shipping,
                completion, and cancellation remain easy to scan.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </Container>
    </main>
  );
}
