import Link from "next/link";

import { Container } from "@/components/ui";

export default function ProductNotFound() {
  return (
    <main className="bg-background py-case-2xl text-foreground">
      <Container className="flex min-h-[60vh] items-center">
        <section
          className="flex max-w-2xl flex-col gap-case-md"
          data-product-not-found
        >
          <p className="text-small font-medium uppercase text-text-muted">
            Product not found
          </p>
          <h1 className="text-heading-1 font-semibold text-foreground">
            This product is not available.
          </h1>
          <p className="max-w-xl text-body leading-7 text-text-muted">
            The product may have moved, been removed, or is no longer part of
            the current CaseFlow catalog.
          </p>
          <div className="flex flex-col gap-case-sm pt-case-sm sm:flex-row">
            <Link
              href="/#products"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Browse products
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Go home
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
