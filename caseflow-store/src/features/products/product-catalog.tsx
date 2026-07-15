"use client";

import * as React from "react";

import { Button, Input } from "@/components/ui";
import {
  ProductEmptyState,
  ProductErrorState,
  ProductGridSkeleton,
} from "@/features/products/product-catalog-states";
import { ProductGrid } from "@/features/products/product-grid";
import type { ProductListQuery } from "@/lib/validation/products";
import type { Category, Product } from "@/types/domain";

type CategoryFilter = "all" | string;
type ProductSort = ProductListQuery["sort"];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A to Z" },
] satisfies Array<{ value: ProductSort; label: string }>;

function getProductWord(count: number) {
  return count === 1 ? "product" : "products";
}

export function ProductCatalog({
  categories,
  errorMessage,
  initialSearchQuery = "",
  isLoading = false,
  products,
}: {
  categories: Category[];
  errorMessage?: string | null;
  initialSearchQuery?: string;
  isLoading?: boolean;
  products: Product[];
}) {
  const [selectedCategoryId, setSelectedCategoryId] =
    React.useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);
  const [sortKey, setSortKey] = React.useState<ProductSort>("newest");

  const trimmedSearchQuery = searchQuery.trim();
  const normalizedSearchQuery = trimmedSearchQuery.toLocaleLowerCase();

  const searchedProducts = React.useMemo(() => {
    if (!normalizedSearchQuery) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLocaleLowerCase().includes(normalizedSearchQuery) ||
        product.description
          .toLocaleLowerCase()
          .includes(normalizedSearchQuery) ||
        product.slug.toLocaleLowerCase().includes(normalizedSearchQuery)
      );
    });
  }, [normalizedSearchQuery, products]);

  const productCounts = React.useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of searchedProducts) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }

    return counts;
  }, [searchedProducts]);

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );

  const visibleProducts = React.useMemo(() => {
    const categoryProducts =
      selectedCategoryId === "all"
        ? searchedProducts
        : searchedProducts.filter(
            (product) => product.categoryId === selectedCategoryId,
          );

    return [...categoryProducts].sort((first, second) => {
      switch (sortKey) {
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
  }, [searchedProducts, selectedCategoryId, sortKey]);

  const resultLabel =
    selectedCategoryId === "all"
      ? "Showing all accessories"
      : `Showing ${selectedCategory?.name ?? "selected category"}`;
  const searchLabel = trimmedSearchQuery
    ? ` matching "${trimmedSearchQuery}"`
    : "";
  const productWord = getProductWord(visibleProducts.length);
  const isCatalogUnavailable = isLoading || Boolean(errorMessage);
  const emptyTitle = trimmedSearchQuery
    ? "No products match your search"
    : "No products found";
  const emptyDescription = trimmedSearchQuery
    ? `No active products match "${trimmedSearchQuery}" in the selected category.`
    : "No active products are available for this category yet.";

  const resetFilters = React.useCallback(() => {
    setSearchQuery("");
    setSelectedCategoryId("all");
    setSortKey("newest");
  }, []);

  return (
    <div className="flex flex-col gap-case-lg">
      <div className="flex flex-col justify-between gap-case-md lg:flex-row lg:items-end">
        <div className="flex max-w-2xl flex-col gap-case-sm">
          <h2 className="text-heading-2 font-semibold text-foreground">
            All accessories
          </h2>
          <p className="text-body leading-7 text-text-muted">
            Browse the current catalog across protection, charging, cables,
            adapters, stands, and mounts.
          </p>
        </div>

        <p
          className="text-small font-medium text-text-muted"
          aria-live="polite"
          data-product-result-count={visibleProducts.length}
        >
          {isLoading ? (
            "Loading products..."
          ) : errorMessage ? (
            "Products unavailable"
          ) : (
            <>
              {resultLabel}
              {searchLabel}: {visibleProducts.length} {productWord}
            </>
          )}
        </p>
      </div>

      <div className="grid gap-case-md rounded-lg border border-border bg-surface p-case-md md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
        <Input
          id="product-search"
          type="search"
          label="Search products"
          placeholder="Case, charger, cable"
          value={searchQuery}
          data-product-search-input
          disabled={isCatalogUnavailable}
          onChange={(event) => setSearchQuery(event.target.value)}
        />

        <div className="flex flex-col gap-2">
          <label
            htmlFor="product-sort"
            className="text-small font-medium text-foreground"
          >
            Sort
          </label>
          <select
            id="product-sort"
            value={sortKey}
            data-product-sort-select
            disabled={isCatalogUnavailable}
            onChange={(event) => setSortKey(event.target.value as ProductSort)}
            className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted disabled:opacity-70"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {searchQuery ? (
          <Button
            type="button"
            variant="secondary"
            className="md:self-end"
            disabled={isCatalogUnavailable}
            onClick={() => setSearchQuery("")}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <div
        className="flex flex-wrap gap-case-sm"
        role="group"
        aria-label="Filter products by category"
      >
        <Button
          type="button"
          size="sm"
          variant={selectedCategoryId === "all" ? "primary" : "secondary"}
          aria-label={`All categories, ${searchedProducts.length} ${getProductWord(
            searchedProducts.length,
          )}`}
          aria-pressed={selectedCategoryId === "all"}
          data-category-filter="all"
          data-category-filter-count={searchedProducts.length}
          disabled={isCatalogUnavailable}
          onClick={() => setSelectedCategoryId("all")}
        >
          All
          <span className="text-current/75" aria-hidden="true">
            {searchedProducts.length}
          </span>
        </Button>

        {categories.map((category) => {
          const count = productCounts.get(category.id) ?? 0;
          const isSelected = selectedCategoryId === category.id;

          return (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={isSelected ? "primary" : "secondary"}
              aria-label={`${category.name}, ${count} ${getProductWord(
                count,
              )}`}
              aria-pressed={isSelected}
              data-category-filter={category.slug}
              data-category-filter-count={count}
              disabled={isCatalogUnavailable}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
              <span className="text-current/75" aria-hidden="true">
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      <div aria-busy={isLoading} aria-live="polite">
        {isLoading ? (
          <ProductGridSkeleton />
        ) : errorMessage ? (
          <ProductErrorState message={errorMessage} />
        ) : visibleProducts.length > 0 ? (
          <ProductGrid categories={categories} products={visibleProducts} />
        ) : (
          <ProductEmptyState
            title={emptyTitle}
            description={emptyDescription}
            onReset={resetFilters}
          />
        )}
      </div>
    </div>
  );
}
