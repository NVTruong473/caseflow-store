"use client";

import { Button, Card, ErrorMessage, Skeleton } from "@/components/ui";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid gap-case-md sm:grid-cols-2 lg:grid-cols-4"
      data-product-loading-state
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          padding="none"
          className="flex h-full flex-col"
          aria-hidden="true"
        >
          <div className="aspect-square p-case-md">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="flex flex-1 flex-col gap-case-sm px-case-md pb-case-md">
            <div className="flex gap-case-xs">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex flex-1 flex-col gap-case-xs">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex items-end justify-between gap-case-sm">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ProductEmptyState({
  description,
  onReset,
  title,
}: {
  description: string;
  onReset: () => void;
  title: string;
}) {
  return (
    <div
      className="flex min-h-64 flex-col items-start justify-center gap-case-md rounded-lg border border-dashed border-border bg-surface p-case-lg"
      data-product-empty-state
    >
      <div className="flex max-w-xl flex-col gap-case-sm">
        <p className="text-heading-3 font-semibold text-foreground">{title}</p>
        <p className="text-body leading-7 text-text-muted">{description}</p>
      </div>
      <Button type="button" variant="secondary" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  );
}

export function ProductErrorState({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-64 flex-col items-start justify-center gap-case-md rounded-lg border border-error bg-surface p-case-lg"
      data-product-error-state
    >
      <div className="flex max-w-xl flex-col gap-case-sm">
        <p className="text-heading-3 font-semibold text-foreground">
          Product catalog is unavailable
        </p>
        <ErrorMessage>{message}</ErrorMessage>
        <p className="text-body leading-7 text-text-muted">
          Refresh the page or try again after the catalog service responds.
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={() => window.location.reload()}
      >
        Retry
      </Button>
    </div>
  );
}
