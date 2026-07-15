"use client";

import * as React from "react";

import { Badge, Button } from "@/components/ui";
import { ProductCatalog } from "@/features/products";
import type { Category, Product } from "@/types/domain";

type CatalogPreviewState = "empty" | "loading" | "error";

const previewStates = [
  { value: "empty", label: "Empty" },
  { value: "loading", label: "Loading" },
  { value: "error", label: "Error" },
] satisfies Array<{ value: CatalogPreviewState; label: string }>;

export function CatalogStatePreview({
  categories,
  initialState,
  products,
}: {
  categories: Category[];
  initialState: CatalogPreviewState;
  products: Product[];
}) {
  const [state, setState] = React.useState<CatalogPreviewState>(initialState);
  const isLoading = state === "loading";
  const isError = state === "error";

  return (
    <div className="flex flex-col gap-case-xl">
      <header className="flex flex-col gap-case-sm border-b border-border pb-case-lg">
        <Badge variant="primary">D07-T05 preview</Badge>
        <div className="flex max-w-3xl flex-col gap-case-sm">
          <h1 className="text-heading-1 font-semibold">
            Product catalog states
          </h1>
          <p className="text-body leading-7 text-text-muted">
            Visual QA surface for catalog loading, empty, and error states.
          </p>
        </div>
      </header>

      <div
        className="flex flex-wrap gap-case-sm"
        role="group"
        aria-label="Choose catalog state preview"
      >
        {previewStates.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={state === option.value ? "primary" : "secondary"}
            aria-pressed={state === option.value}
            data-catalog-state-preview={option.value}
            onClick={() => setState(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <ProductCatalog
        key={state}
        categories={categories}
        products={isLoading || isError ? [] : products}
        initialSearchQuery={state === "empty" ? "zzzz" : ""}
        isLoading={isLoading}
        errorMessage={
          isError
            ? "Product data could not be loaded from the catalog source."
            : null
        }
      />
    </div>
  );
}
