import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { mockCategories, mockProducts } from "@/data/mock/catalog";

import { CatalogStatePreview } from "./catalog-state-preview";

export const metadata: Metadata = {
  title: "Catalog State Preview - CaseFlow Store",
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

const previewStates = new Set(["empty", "loading", "error"]);

function parsePreviewState(value: string | string[] | undefined) {
  const state = Array.isArray(value) ? value[0] : value;

  if (state && previewStates.has(state)) {
    return state as "empty" | "loading" | "error";
  }

  return "empty";
}

export default async function CatalogStatePreviewPage({
  searchParams,
}: CatalogStatePreviewPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-background py-case-xl text-foreground">
      <Container>
        <CatalogStatePreview
          categories={mockCategories}
          initialState={parsePreviewState(params.state)}
          products={mockProducts}
        />
      </Container>
    </main>
  );
}
