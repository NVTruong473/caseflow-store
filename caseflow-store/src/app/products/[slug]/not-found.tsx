import Link from "next/link";

import { Container } from "@/components/ui";
import { storefrontConfig } from "@/config/storefront";
import { getRequestLanguage } from "@/lib/i18n/server";

const notFoundCopy = {
  en: {
    browseBooks: "Browse books",
    eyebrow: "Book edition not found",
    goHome: "Go home",
    title: "This book edition is not available.",
    description:
      `The edition may have moved, been removed, or is no longer part of the current ${storefrontConfig.name} catalog.`,
  },
  vi: {
    browseBooks: "Duyệt sách",
    eyebrow: "Không tìm thấy ấn bản",
    goHome: "Về trang chủ",
    title: "Ấn bản sách này hiện không khả dụng.",
    description:
      `Ấn bản có thể đã được chuyển, bị xóa hoặc không còn thuộc danh mục hiện tại của ${storefrontConfig.name}.`,
  },
} as const;

export default async function ProductNotFound() {
  const language = await getRequestLanguage();
  const copy = notFoundCopy[language];

  return (
    <main className="bg-background py-case-2xl text-foreground">
      <Container className="flex min-h-[60vh] items-center">
        <section
          className="flex max-w-2xl flex-col gap-case-md"
          data-product-not-found
        >
          <p className="text-small font-medium uppercase text-text-muted">
            {copy.eyebrow}
          </p>
          <h1 className="text-heading-1 font-semibold text-foreground">
            {copy.title}
          </h1>
          <p className="max-w-xl text-body leading-7 text-text-muted">
            {copy.description}
          </p>
          <div className="flex flex-col gap-case-sm pt-case-sm sm:flex-row">
            <Link
              href="/catalog"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {copy.browseBooks}
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {copy.goHome}
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
