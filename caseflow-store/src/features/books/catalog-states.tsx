import Link from "next/link";

import { Card, Skeleton } from "@/components/ui";
import type { Language } from "@/lib/i18n/language";

const catalogStateCopy = {
  en: {
    browseFeatured: "Browse featured books",
    clearFilters: "Clear filters",
    emptyDescription:
      "Try a broader search, remove one or more filters, or return to the featured shelf.",
    emptyTitle: "No editions match these filters",
    errorDescription:
      "The catalog could not be loaded right now. Try again or return to the storefront.",
    errorTitle: "Book catalog is unavailable",
    loadingDescription:
      "Preparing book editions, prices, stock states, and cover assets.",
    loadingTitle: "Loading catalog",
    retry: "Try again",
  },
  vi: {
    browseFeatured: "Xem sách nổi bật",
    clearFilters: "Xóa bộ lọc",
    emptyDescription:
      "Hãy mở rộng từ khóa, bỏ bớt bộ lọc hoặc quay lại kệ sách nổi bật.",
    emptyTitle: "Không có ấn bản phù hợp",
    errorDescription:
      "Catalog hiện không tải được. Hãy thử lại hoặc quay về trang cửa hàng.",
    errorTitle: "Không tải được catalog sách",
    loadingDescription:
      "Đang chuẩn bị ấn bản, giá, tồn kho và bìa sách.",
    loadingTitle: "Đang tải catalog",
    retry: "Thử lại",
  },
} as const;

export function BookCatalogLoadingState({
  count = 8,
  language,
}: {
  count?: number;
  language: Language;
}) {
  const copy = catalogStateCopy[language];

  return (
    <section
      className="flex flex-col gap-case-lg"
      data-book-catalog-loading-state
    >
      <div className="rounded-lg border border-border bg-surface p-case-lg">
        <div className="flex max-w-2xl flex-col gap-case-sm">
          <p className="text-heading-3 font-semibold text-foreground">
            {copy.loadingTitle}
          </p>
          <p className="text-body leading-7 text-text-muted">
            {copy.loadingDescription}
          </p>
        </div>
      </div>

      <div className="grid gap-case-md sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, index) => (
          <Card
            key={index}
            padding="none"
            className="flex h-full flex-col"
            aria-hidden="true"
          >
            <div className="aspect-[3/4] p-case-md">
              <Skeleton className="h-full w-full" />
            </div>
            <div className="flex flex-1 flex-col gap-case-sm px-case-md pb-case-md">
              <div className="flex gap-case-xs">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-auto h-7 w-28" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function BookCatalogEmptyState({ language }: { language: Language }) {
  const copy = catalogStateCopy[language];

  return (
    <section
      className="flex min-h-64 flex-col items-start justify-center gap-case-md rounded-lg border border-dashed border-border bg-surface p-case-lg"
      data-book-catalog-empty-state
    >
      <div className="flex max-w-2xl flex-col gap-case-sm">
        <p className="text-heading-3 font-semibold text-foreground">
          {copy.emptyTitle}
        </p>
        <p className="text-body leading-7 text-text-muted">
          {copy.emptyDescription}
        </p>
      </div>
      <div className="flex flex-col gap-case-sm sm:flex-row">
        <Link
          href="/catalog"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {copy.clearFilters}
        </Link>
        <Link
          href="/#featured"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {copy.browseFeatured}
        </Link>
      </div>
    </section>
  );
}

export function BookCatalogErrorState({
  language,
  retryHref = "/catalog",
}: {
  language: Language;
  retryHref?: string;
}) {
  const copy = catalogStateCopy[language];

  return (
    <section
      className="flex min-h-64 flex-col items-start justify-center gap-case-md rounded-lg border border-error bg-surface p-case-lg"
      data-book-catalog-error-state
    >
      <div className="flex max-w-2xl flex-col gap-case-sm">
        <p className="text-heading-3 font-semibold text-foreground">
          {copy.errorTitle}
        </p>
        <p className="text-body leading-7 text-text-muted">
          {copy.errorDescription}
        </p>
      </div>
      <Link
        href={retryHref}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {copy.retry}
      </Link>
    </section>
  );
}
