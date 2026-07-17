"use client";

import { useState } from "react";

import { Button, Container } from "@/components/ui";
import { BookCatalogErrorState } from "@/features/books/catalog-states";
import { parseLanguage, type Language } from "@/lib/i18n/language";

export default function CatalogError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [language] = useState<Language>(() => {
    return typeof document === "undefined"
      ? "en"
      : parseLanguage(document.documentElement.lang);
  });

  return (
    <main className="bg-background py-case-2xl text-foreground">
      <Container className="flex flex-col gap-case-lg">
        <BookCatalogErrorState language={language} />
        <Button type="button" variant="secondary" onClick={() => reset()}>
          {language === "vi" ? "Tải lại" : "Reload catalog"}
        </Button>
      </Container>
    </main>
  );
}
