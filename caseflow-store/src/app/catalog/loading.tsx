import { Container } from "@/components/ui";
import { BookCatalogLoadingState } from "@/features/books/catalog-states";

export default function CatalogLoading() {
  return (
    <main className="bg-background py-case-2xl text-foreground">
      <Container className="flex flex-col gap-case-xl">
        <BookCatalogLoadingState language="en" />
      </Container>
    </main>
  );
}
