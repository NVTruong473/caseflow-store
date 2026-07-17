import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Container } from "@/components/ui";
import {
  BookCatalogEmptyState,
  BookCatalogErrorState,
  BookCatalogLoadingState,
} from "@/features/books/catalog-states";
import type { Language } from "@/lib/i18n/language";
import { getRequestLanguage } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Catalog State Preview - CaseFlow Books",
  robots: {
    index: false,
    follow: false,
  },
};

type CatalogStatePreviewPageProps = {
  searchParams: Promise<{
    state?: string | string[];
  }>;
};

type CatalogPreviewState = "empty" | "loading" | "error";

const previewStates = ["empty", "loading", "error"] as const;

const previewCopy = {
  en: {
    description:
      "Visual QA surface for CaseFlow Books catalog loading, empty, and error states.",
    eyebrow: "Catalog state preview",
    title: "Book catalog states",
    states: {
      empty: "Empty",
      error: "Error",
      loading: "Loading",
    },
  },
  vi: {
    description:
      "Màn hình kiểm tra giao diện cho trạng thái tải, rỗng và lỗi của catalog CaseFlow Books.",
    eyebrow: "Preview trạng thái catalog",
    title: "Trạng thái catalog sách",
    states: {
      empty: "Rỗng",
      error: "Lỗi",
      loading: "Đang tải",
    },
  },
} as const;

function parsePreviewState(value: string | string[] | undefined) {
  const state = Array.isArray(value) ? value[0] : value;

  return previewStates.includes(state as CatalogPreviewState)
    ? (state as CatalogPreviewState)
    : "empty";
}

export default async function CatalogStatePreviewPage({
  searchParams,
}: CatalogStatePreviewPageProps) {
  const params = await searchParams;
  const language = await getRequestLanguage();
  const state = parsePreviewState(params.state);
  const copy = previewCopy[language];

  return (
    <main className="min-h-screen bg-background py-case-xl text-foreground">
      <Container className="flex flex-col gap-case-xl">
        <header className="flex flex-col gap-case-sm border-b border-border pb-case-lg">
          <Badge variant="primary">{copy.eyebrow}</Badge>
          <div className="flex max-w-3xl flex-col gap-case-sm">
            <h1 className="text-heading-1 font-semibold">{copy.title}</h1>
            <p className="text-body leading-7 text-text-muted">
              {copy.description}
            </p>
          </div>
        </header>

        <nav
          className="flex flex-wrap gap-case-sm"
          aria-label={copy.eyebrow}
          data-book-catalog-state-preview
        >
          {previewStates.map((item) => {
            const isCurrent = item === state;

            return (
              <Link
                key={item}
                aria-current={isCurrent ? "page" : undefined}
                className={
                  isCurrent
                    ? "inline-flex min-h-10 items-center justify-center rounded-md border border-primary bg-primary px-4 text-small font-semibold text-surface"
                    : "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-small font-medium text-foreground hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                }
                href={`/catalog-state-preview?state=${item}`}
              >
                {copy.states[item]}
              </Link>
            );
          })}
        </nav>

        <CatalogPreviewStateBlock language={language} state={state} />
      </Container>
    </main>
  );
}

function CatalogPreviewStateBlock({
  language,
  state,
}: {
  language: Language;
  state: CatalogPreviewState;
}) {
  switch (state) {
    case "loading":
      return <BookCatalogLoadingState language={language} />;
    case "error":
      return <BookCatalogErrorState language={language} />;
    case "empty":
    default:
      return <BookCatalogEmptyState language={language} />;
  }
}
