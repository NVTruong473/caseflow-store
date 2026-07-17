import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  CurrencyAmount,
  CurrencyEstimateDisclosure,
} from "@/components/currency/currency-amount";
import { Badge, Card, CardHeader, Container } from "@/components/ui";
import { BookEditionPurchaseControls } from "@/features/books/book-edition-purchase-controls";
import { formatVnd } from "@/lib/format/currency";
import { getCurrencyDisplayRules } from "@/lib/format/currency-display.server";
import {
  getEditionLanguageLabel,
  pickLocalizedText,
  type Language,
} from "@/lib/i18n/language";
import { getRequestLanguage } from "@/lib/i18n/server";
import {
  getSupabaseBookEditionBySlug,
  listSupabaseBookCatalog,
  listSupabaseRelatedBookEditions,
  type SupabaseBookCatalogRecord,
} from "@/lib/repositories/supabase-books";
import {
  absoluteUrl,
  createPageMetadata,
  truncateDescription,
} from "@/lib/seo/metadata";
import type { BookFormat, InventoryStatus } from "@/types/domain";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const productDetailCopy = {
  en: {
    breadcrumbBooks: "Books",
    breadcrumbHome: "Home",
    breadcrumbLabel: "Book navigation",
    edition: "edition",
    editionDetails: "Edition details",
    format: "Format",
    isbn: "ISBN",
    language: "Language",
    moreLikeThis: "More like this",
    moreLikeThisDescription:
      "Recommendations use shared author, category, or language data from the current catalog.",
    notSpecified: "Not specified",
    originalLanguage: "Original language",
    originalTitle: "Original title",
    pages: "Pages",
    paymentDescription:
      "COD, bank transfer, MoMo, ZaloPay, and VNPay-style options are selected during checkout.",
    paymentTitle: "Payment options",
    price: "Price",
    publicationEra: "Publication era",
    publisher: "Publisher",
    reasonAuthor: "Same author",
    reasonCategory: "Same category",
    reasonLanguage: "Same language",
    relatedEditions: "Related editions",
    returnDescription:
      "If a book arrives damaged or different from the order, contact support so the store can review replacement or return handling.",
    returnTitle: "Return support",
    shippingDescription:
      "Standard delivery is prepared for Vietnam addresses. Shipping, VAT, and fee estimates are recalculated at checkout.",
    shippingTitle: "Shipping and totals",
    stock: "Stock",
    tbc: "TBC",
    translator: "Translator",
    workContext: "Work context",
    stockLeft: (count: number) => `${count} left`,
  },
  vi: {
    breadcrumbBooks: "Sách",
    breadcrumbHome: "Trang chủ",
    breadcrumbLabel: "Điều hướng sách",
    edition: "ấn bản",
    editionDetails: "Chi tiết ấn bản",
    format: "Định dạng",
    isbn: "ISBN",
    language: "Ngôn ngữ",
    moreLikeThis: "Gợi ý liên quan",
    moreLikeThisDescription:
      "Gợi ý dựa trên tác giả, danh mục hoặc ngôn ngữ trùng với catalog hiện tại.",
    notSpecified: "Chưa xác định",
    originalLanguage: "Ngôn ngữ gốc",
    originalTitle: "Tên gốc",
    pages: "Số trang",
    paymentDescription:
      "COD, chuyển khoản, MoMo, ZaloPay và VNPay được chọn ở bước thanh toán.",
    paymentTitle: "Phương thức thanh toán",
    price: "Giá",
    publicationEra: "Thời kỳ xuất bản",
    publisher: "Nhà xuất bản",
    reasonAuthor: "Cùng tác giả",
    reasonCategory: "Cùng danh mục",
    reasonLanguage: "Cùng ngôn ngữ",
    relatedEditions: "Ấn bản liên quan",
    returnDescription:
      "Nếu sách bị hư hỏng hoặc khác đơn đặt hàng, hãy liên hệ hỗ trợ để cửa hàng xem xét đổi trả hoặc thay thế.",
    returnTitle: "Hỗ trợ đổi trả",
    shippingDescription:
      "Giao hàng tiêu chuẩn áp dụng cho địa chỉ tại Việt Nam. Phí ship, VAT và phí thanh toán được tính lại ở bước thanh toán.",
    shippingTitle: "Vận chuyển và tổng tiền",
    stock: "Tồn kho",
    tbc: "Đang cập nhật",
    translator: "Dịch giả",
    workContext: "Thông tin tác phẩm",
    stockLeft: (count: number) => `Còn ${count}`,
  },
} as const;

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const language = await getRequestLanguage();
  const record = await getSupabaseBookEditionBySlug(slug);

  if (!record) {
    return {
      title:
        language === "vi"
          ? "Không tìm thấy ấn bản - CaseFlow Books"
          : "Book edition not found - CaseFlow Books",
    };
  }

  const title = `${getEditionTitle(record, language)} - CaseFlow Books`;
  const description = truncateDescription(
    pickLocalizedText(record.edition.summary, language),
  );

  return createPageMetadata({
    description,
    language,
    path: `/products/${record.edition.slug}`,
    title,
  });
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const language = await getRequestLanguage();
  const copy = productDetailCopy[language];
  const currencyRules = getCurrencyDisplayRules();
  const record = await getSupabaseBookEditionBySlug(slug);

  if (!record) {
    notFound();
  }

  const [relatedEditions, catalogRecords] = await Promise.all([
    listSupabaseRelatedBookEditions(record.work.id, {
      excludeEditionId: record.edition.id,
      sort: "title-asc",
    }),
    listSupabaseBookCatalog({ sort: "title-asc" }),
  ]);
  const recommendedRecords = getRecommendedRecords(record, catalogRecords);
  const coverPath = getCoverPath(record);
  const coverAlt = getCoverAlt(record, language);
  const editionTitle = getEditionTitle(record, language);
  const authorLine =
    record.authors.map((author) => author.name).join(", ") ||
    copy.notSpecified;
  const translatorLine =
    record.translators.map((translator) => translator.name).join(", ") ||
    copy.notSpecified;
  const publisherName = record.publisher?.name ?? copy.notSpecified;
  const isbn = record.edition.isbn13 ?? record.edition.isbn10 ?? copy.notSpecified;
  const stockLabel =
    record.edition.inventoryStatus === "low-stock"
      ? copy.stockLeft(record.edition.stockQuantity)
      : getInventoryStatusLabel(record.edition.inventoryStatus, language);
  const structuredData = createBookStructuredData({
    description: pickLocalizedText(record.edition.summary, language),
    editionTitle,
    language,
    record,
  });

  return (
    <main className="bg-background py-case-2xl text-foreground">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <Container className="flex flex-col gap-case-xl">
        <nav
          aria-label={copy.breadcrumbLabel}
          className="flex min-w-0 flex-wrap items-center gap-case-xs text-small"
          data-book-breadcrumb
        >
          <Link
            href="/"
            className="rounded-md font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.breadcrumbHome}
          </Link>
          <span className="text-text-muted">/</span>
          <Link
            href="/catalog"
            className="rounded-md font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.breadcrumbBooks}
          </Link>
          <span className="text-text-muted">/</span>
          <span
            className="max-w-full truncate text-text-muted"
            aria-current="page"
          >
            {editionTitle}
          </span>
        </nav>

        <section
          className="grid gap-case-xl lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start"
          data-book-detail={record.edition.slug}
        >
          <div
            className="aspect-[3/4] rounded-lg border border-border bg-surface p-case-md"
            data-book-detail-image
          >
            <Image
              src={coverPath}
              alt={coverAlt}
              width={420}
              height={560}
              className="h-full w-full rounded-md border border-border bg-surface-muted object-cover"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-case-lg">
            <div className="flex flex-col gap-case-sm">
              <div className="flex flex-wrap gap-case-xs">
                {record.categories.map((category) => (
                  <Badge key={category.id} variant="primary">
                    {pickLocalizedText(category.labels, language)}
                  </Badge>
                ))}
                <Badge variant="neutral">
                  {getEditionLanguageLabel(record.edition.language, language)}
                </Badge>
                <Badge variant="neutral">
                  {getFormatLabel(record.edition.format, language)}
                </Badge>
                <Badge variant={getStockBadgeVariant(record.edition.inventoryStatus)}>
                  {getInventoryStatusLabel(record.edition.inventoryStatus, language)}
                </Badge>
              </div>
              <h1 className="text-heading-1 font-semibold text-foreground">
                {editionTitle}
              </h1>
              <p className="text-body leading-7 text-text-muted">
                {authorLine}
              </p>
              <p
                className="max-w-3xl text-body leading-7 text-text-muted"
                data-book-detail-summary
              >
                {pickLocalizedText(record.edition.summary, language)}
              </p>
            </div>

            <div className="grid items-start gap-case-md sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface p-case-lg">
                <p className="text-small font-medium uppercase text-text-muted">
                  {copy.price}
                </p>
                <p
                  className="mt-case-sm text-heading-2 font-semibold text-foreground"
                  data-book-detail-price
                >
                  <CurrencyAmount
                    amountVnd={record.edition.priceVnd}
                    language={language}
                    rules={currencyRules}
                  />
                </p>
                <CurrencyEstimateDisclosure
                  className="mt-case-sm"
                  language={language}
                  rules={currencyRules}
                />
              </div>

              <div className="rounded-lg border border-border bg-surface p-case-lg">
                <p className="text-small font-medium uppercase text-text-muted">
                  {copy.stock}
                </p>
                <p className="mt-case-sm text-heading-3 font-semibold text-foreground">
                  {stockLabel}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface p-case-lg">
                <p className="text-small font-medium uppercase text-text-muted">
                  {copy.pages}
                </p>
                <p className="mt-case-sm text-heading-3 font-semibold text-foreground">
                  {record.edition.pageCount ?? copy.tbc}
                </p>
              </div>
            </div>

            <BookEditionPurchaseControls
              editionId={record.edition.id}
              editionTitle={editionTitle}
              inventoryStatus={record.edition.inventoryStatus}
              language={language}
              stockQuantity={record.edition.stockQuantity}
            />

            <div className="rounded-lg border border-border bg-surface p-case-lg">
              <h2 className="text-heading-3 font-semibold text-foreground">
                {copy.editionDetails}
              </h2>
              <dl
                className="mt-case-md grid gap-case-sm text-small text-text-muted sm:grid-cols-2"
                data-book-edition-details
              >
                <DetailTerm label={copy.publisher} value={publisherName} />
                <DetailTerm label={copy.translator} value={translatorLine} />
                <DetailTerm label={copy.isbn} value={isbn} />
                <DetailTerm
                  label={copy.language}
                  value={getEditionLanguageLabel(
                    record.edition.language,
                    language,
                  )}
                />
                <DetailTerm
                  label={copy.format}
                  value={getFormatLabel(record.edition.format, language)}
                />
                <DetailTerm
                  label={copy.pages}
                  value={record.edition.pageCount ?? copy.tbc}
                />
                <div>
                  <dt className="font-medium text-foreground">
                    {copy.originalTitle}
                  </dt>
                  <dd>{record.work.originalTitle ?? record.work.title}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    {copy.originalLanguage}
                  </dt>
                  <dd>{record.work.originalLanguage}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    {copy.publicationEra}
                  </dt>
                  <dd>{record.work.publicationEra ?? copy.notSpecified}</dd>
                </div>
              </dl>
            </div>

            <section
              className="grid gap-case-md rounded-lg border border-border bg-surface p-case-lg lg:grid-cols-3"
              data-book-commerce-hints
              data-book-confidence
            >
              <div className="min-w-0">
                <h2 className="text-heading-3 font-semibold text-foreground">
                  {copy.shippingTitle}
                </h2>
                <p className="mt-case-sm text-small leading-6 text-text-muted">
                  {copy.shippingDescription}
                </p>
              </div>
              <div className="min-w-0">
                <h2 className="text-heading-3 font-semibold text-foreground">
                  {copy.paymentTitle}
                </h2>
                <p className="mt-case-sm text-small leading-6 text-text-muted">
                  {copy.paymentDescription}
                </p>
              </div>
              <div className="min-w-0">
                <h2 className="text-heading-3 font-semibold text-foreground">
                  {copy.returnTitle}
                </h2>
                <p className="mt-case-sm text-small leading-6 text-text-muted">
                  {copy.returnDescription}
                </p>
              </div>
            </section>

            {relatedEditions.length > 0 ? (
              <section className="flex flex-col gap-case-md">
                <h2 className="text-heading-3 font-semibold text-foreground">
                  {copy.relatedEditions}
                </h2>
                <div className="grid gap-case-md sm:grid-cols-2">
                  {relatedEditions.map((related) => (
                    <Card key={related.edition.id} variant="interactive">
                      <CardHeader>
                        <Link
                          href={`/products/${related.edition.slug}`}
                          className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <span className="block font-semibold text-foreground">
                            {getEditionTitle(related, language)}
                          </span>
                          <span className="mt-case-xs block text-small text-text-muted">
                            {getEditionLanguageLabel(
                              related.edition.language,
                              language,
                            )}{" "}
                            {copy.edition} -{" "}
                            {formatVnd(related.edition.priceVnd)}
                          </span>
                        </Link>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

            {recommendedRecords.length > 0 ? (
              <section
                className="flex flex-col gap-case-md"
                data-book-recommendations
              >
                <div className="flex flex-col gap-case-xs">
                  <h2 className="text-heading-3 font-semibold text-foreground">
                    {copy.moreLikeThis}
                  </h2>
                  <p className="text-small leading-6 text-text-muted">
                    {copy.moreLikeThisDescription}
                  </p>
                </div>
                <div className="grid gap-case-md sm:grid-cols-2">
                  {recommendedRecords.map(({ record: recommended, reasons }) => (
                    <Card
                      key={recommended.edition.id}
                      variant="interactive"
                      data-book-recommendation-card={recommended.edition.slug}
                    >
                      <Link
                        href={`/products/${recommended.edition.slug}`}
                        className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-case-md rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        data-book-recommendation-link
                      >
                        <div className="aspect-[3/4] overflow-hidden rounded-md border border-border bg-surface-muted p-1">
                          <Image
                            src={getCoverPath(recommended)}
                            alt={getCoverAlt(recommended, language)}
                            width={72}
                            height={96}
                            className="h-full w-full rounded-sm object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-case-xs">
                            {reasons.map((reason) => (
                              <Badge key={reason} variant="neutral" size="sm">
                                {getRecommendationReasonLabel(reason, copy)}
                              </Badge>
                            ))}
                          </div>
                          <h3 className="mt-case-sm line-clamp-2 font-semibold text-foreground">
                            {getEditionTitle(recommended, language)}
                          </h3>
                          <p className="mt-case-xs truncate text-small text-text-muted">
                            {recommended.authors
                              .map((author) => author.name)
                              .join(", ")}
                          </p>
                          <p className="mt-case-xs text-small font-medium text-foreground">
                            <CurrencyAmount
                              amountVnd={recommended.edition.priceVnd}
                              language={language}
                              rules={currencyRules}
                            />
                          </p>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </Container>
    </main>
  );
}

function DetailTerm({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <dt className="font-medium text-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function getEditionTitle(record: SupabaseBookCatalogRecord, language: Language) {
  return pickLocalizedText(
    record.edition.localizedDisplayTitle,
    language,
    record.edition.displayTitle,
  );
}

function getCoverAlt(record: SupabaseBookCatalogRecord, language: Language) {
  return pickLocalizedText(
    record.coverAsset?.altText,
    language,
    `${getEditionTitle(record, language)} cover`,
  );
}

function getCoverPath(record: SupabaseBookCatalogRecord) {
  return (
    record.coverAsset?.path ?? "/images/books/placeholders/book-cover-placeholder.svg"
  );
}

function getFormatLabel(format: BookFormat, language: Language) {
  const labels: Record<Language, Record<BookFormat, string>> = {
    en: {
      "box-set": "Box set",
      hardcover: "Hardcover",
      paperback: "Paperback",
      "special-edition": "Special edition",
    },
    vi: {
      "box-set": "Bộ sách",
      hardcover: "Bìa cứng",
      paperback: "Bìa mềm",
      "special-edition": "Ấn bản đặc biệt",
    },
  };

  return labels[language][format];
}

function getInventoryStatusLabel(
  status: InventoryStatus,
  language: Language,
) {
  const labels: Record<Language, Record<InventoryStatus, string>> = {
    en: {
      discontinued: "Discontinued",
      "in-stock": "In stock",
      "low-stock": "Low stock",
      "out-of-stock": "Out of stock",
      preorder: "Preorder",
    },
    vi: {
      discontinued: "Ngừng bán",
      "in-stock": "Còn hàng",
      "low-stock": "Sắp hết",
      "out-of-stock": "Hết hàng",
      preorder: "Đặt trước",
    },
  };

  return labels[language][status];
}

function createBookStructuredData({
  description,
  editionTitle,
  language,
  record,
}: {
  description: string;
  editionTitle: string;
  language: Language;
  record: SupabaseBookCatalogRecord;
}) {
  const isbn = record.edition.isbn13 ?? record.edition.isbn10;
  const url = absoluteUrl(`/products/${record.edition.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Book",
    ...(isbn ? { isbn } : {}),
    author: record.authors.map((author) => ({
      "@type": "Person",
      name: author.name,
    })),
    bookFormat: getStructuredBookFormat(record.edition.format),
    description: truncateDescription(description, 300),
    inLanguage: record.edition.language,
    name: editionTitle,
    offers: {
      "@type": "Offer",
      availability: getStructuredAvailability(record.edition.inventoryStatus),
      price: record.edition.priceVnd.toString(),
      priceCurrency: "VND",
      url,
    },
    publisher: record.publisher
      ? {
          "@type": "Organization",
          name: record.publisher.name,
        }
      : undefined,
    url,
    workExample: {
      "@type": "Book",
      inLanguage: record.work.originalLanguage,
      name: pickLocalizedText(record.work.localizedTitle, language, record.work.title),
    },
  };
}

function getStructuredBookFormat(format: BookFormat) {
  const formats: Partial<Record<BookFormat, string>> = {
    hardcover: "https://schema.org/Hardcover",
    paperback: "https://schema.org/Paperback",
  };

  return formats[format] ?? format;
}

function getStructuredAvailability(status: InventoryStatus) {
  if (status === "out-of-stock" || status === "discontinued") {
    return "https://schema.org/OutOfStock";
  }

  if (status === "preorder") {
    return "https://schema.org/PreOrder";
  }

  return "https://schema.org/InStock";
}

function getStockBadgeVariant(status: InventoryStatus) {
  if (status === "in-stock" || status === "preorder") {
    return "success";
  }

  if (status === "low-stock") {
    return "warning";
  }

  return "error";
}

type RecommendationReason = "author" | "category" | "language";

function getRecommendedRecords(
  current: SupabaseBookCatalogRecord,
  catalogRecords: SupabaseBookCatalogRecord[],
) {
  const currentAuthorIds = new Set(current.authors.map((author) => author.id));
  const currentCategoryIds = new Set(
    current.categories.map((category) => category.id),
  );

  return catalogRecords
    .filter((candidate) => {
      return (
        candidate.edition.id !== current.edition.id &&
        candidate.work.id !== current.work.id
      );
    })
    .map((candidate) => {
      const reasons: RecommendationReason[] = [];

      if (candidate.authors.some((author) => currentAuthorIds.has(author.id))) {
        reasons.push("author");
      }

      if (
        candidate.categories.some((category) =>
          currentCategoryIds.has(category.id),
        )
      ) {
        reasons.push("category");
      }

      if (candidate.edition.language === current.edition.language) {
        reasons.push("language");
      }

      return {
        record: candidate,
        reasons,
        score:
          (reasons.includes("author") ? 4 : 0) +
          (reasons.includes("category") ? 2 : 0) +
          (reasons.includes("language") ? 1 : 0),
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return first.record.edition.displayTitle.localeCompare(
        second.record.edition.displayTitle,
      );
    })
    .slice(0, 4);
}

function getRecommendationReasonLabel(
  reason: RecommendationReason,
  copy: (typeof productDetailCopy)[Language],
) {
  switch (reason) {
    case "author":
      return copy.reasonAuthor;
    case "category":
      return copy.reasonCategory;
    case "language":
      return copy.reasonLanguage;
  }
}
