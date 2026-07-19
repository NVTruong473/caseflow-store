import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  CurrencyAmount,
  CurrencyEstimateDisclosure,
} from "@/components/currency/currency-amount";
import { Badge, Container } from "@/components/ui";
import { BookCoverFrame } from "@/features/books/cover-merchandising";
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
import { cn } from "@/lib/utils/cn";
import type {
  BookFormat,
  InventoryStatus,
} from "@/types/domain";

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
    accountRequiredDescription:
      "Orders continue through a customer account with email, phone, delivery address, and payment choice confirmed before purchase.",
    accountRequiredTitle: "Account checkout",
    catalogStatus: "Catalog status",
    commerceConfidenceDescription:
      "The store checks account details, stock, VAT, shipping, and payment totals before the order is confirmed.",
    commerceConfidenceTitle: "Purchase confidence",
    editionIdentityTitle: "Edition identity",
    edition: "edition",
    editionComparison: "Edition comparison",
    editionComparisonDescription:
      "Switch between the English and Vietnamese sellable editions of this work.",
    editionDetails: "Edition details",
    format: "Format",
    isbn: "ISBN",
    language: "Language",
    moreByAuthor: "More by this author",
    moreLikeThis: "More like this",
    moreLikeThisDescription:
      "Recommendations use shared author, category, or language data from the current catalog.",
    originalLanguage: "Original language",
    originalTitle: "Original title",
    pages: "Pages",
    paymentDescription:
      "COD, bank transfer, MoMo, ZaloPay, and VNPay-style options are selected during checkout.",
    paymentTitle: "Payment options",
    price: "Price",
    publicationEra: "Publication era",
    publisher: "Publisher",
    reasonToRead: "Why this edition",
    reasonAuthor: "Same author",
    reasonCategory: "Same category",
    reasonLanguage: "Same language",
    relatedBooks: "Related books",
    relatedEditions: "Related editions",
    returnDescription:
      "If a book arrives damaged or different from the order, contact support so the store can review replacement or return handling.",
    returnTitle: "Return support",
    shippingDescription:
      "Standard delivery is prepared for Vietnam addresses. Shipping, VAT, and fee estimates are recalculated at checkout.",
    shippingTitle: "Shipping and totals",
    stock: "Stock",
    stockCheckDescription:
      "Stock is checked again before confirmation so unavailable editions cannot be ordered.",
    stockCheckTitle: "Inventory check",
    themes: "Themes",
    trustedTotalsDescription:
      "Checkout recalculates item price, VAT, shipping, and payment fees from the current catalog before confirmation.",
    trustedTotalsTitle: "Trusted totals",
    translator: "Translator",
    verifiedFacts: "Verified edition facts",
    verifiedFactsDescription:
      "Only reviewed facts are shown; missing optional fields are intentionally omitted.",
    viewEdition: "View edition",
    currentEdition: "Current edition",
    workContext: "Work context",
    stockLeft: (count: number) => `${count} left`,
  },
  vi: {
    breadcrumbBooks: "Sách",
    breadcrumbHome: "Trang chủ",
    breadcrumbLabel: "Điều hướng sách",
    accountRequiredDescription:
      "Đơn hàng tiếp tục qua tài khoản khách hàng với email, số điện thoại, địa chỉ nhận hàng và phương thức thanh toán được xác nhận trước khi mua.",
    accountRequiredTitle: "Thanh toán bằng tài khoản",
    catalogStatus: "Trạng thái catalog",
    commerceConfidenceDescription:
      "Cửa hàng kiểm tra tài khoản, tồn kho, VAT, phí vận chuyển và phí thanh toán trước khi xác nhận đơn.",
    commerceConfidenceTitle: "Độ tin cậy khi mua",
    editionIdentityTitle: "Nhận diện ấn bản",
    edition: "ấn bản",
    editionComparison: "So sánh ấn bản",
    editionComparisonDescription:
      "Chuyển giữa ấn bản tiếng Anh và tiếng Việt đang bán của cùng tác phẩm.",
    editionDetails: "Chi tiết ấn bản",
    format: "Định dạng",
    isbn: "ISBN",
    language: "Ngôn ngữ",
    moreByAuthor: "Thêm sách cùng tác giả",
    moreLikeThis: "Gợi ý liên quan",
    moreLikeThisDescription:
      "Gợi ý dựa trên tác giả, danh mục hoặc ngôn ngữ trùng với catalog hiện tại.",
    originalLanguage: "Ngôn ngữ gốc",
    originalTitle: "Tên gốc",
    pages: "Số trang",
    paymentDescription:
      "COD, chuyển khoản, MoMo, ZaloPay và VNPay được chọn ở bước thanh toán.",
    paymentTitle: "Phương thức thanh toán",
    price: "Giá",
    publicationEra: "Thời kỳ xuất bản",
    publisher: "Nhà xuất bản",
    reasonToRead: "Vì sao nên chọn ấn bản này",
    reasonAuthor: "Cùng tác giả",
    reasonCategory: "Cùng danh mục",
    reasonLanguage: "Cùng ngôn ngữ",
    relatedBooks: "Sách liên quan",
    relatedEditions: "Ấn bản liên quan",
    returnDescription:
      "Nếu sách bị hư hỏng hoặc khác đơn đặt hàng, hãy liên hệ hỗ trợ để cửa hàng xem xét đổi trả hoặc thay thế.",
    returnTitle: "Hỗ trợ đổi trả",
    shippingDescription:
      "Giao hàng tiêu chuẩn áp dụng cho địa chỉ tại Việt Nam. Phí ship, VAT và phí thanh toán được tính lại ở bước thanh toán.",
    shippingTitle: "Vận chuyển và tổng tiền",
    stock: "Tồn kho",
    stockCheckDescription:
      "Tồn kho được kiểm tra lại trước khi xác nhận để tránh đặt nhầm ấn bản không còn hàng.",
    stockCheckTitle: "Kiểm tra tồn kho",
    themes: "Chủ đề",
    trustedTotalsDescription:
      "Checkout tính lại giá sách, VAT, phí vận chuyển và phí thanh toán từ catalog hiện tại trước khi xác nhận.",
    trustedTotalsTitle: "Tổng tiền đáng tin",
    translator: "Dịch giả",
    verifiedFacts: "Thông tin ấn bản đã kiểm chứng",
    verifiedFactsDescription:
      "Chỉ hiển thị thông tin đã review; các trường chưa chắc chắn được bỏ qua.",
    viewEdition: "Xem ấn bản",
    currentEdition: "Ấn bản hiện tại",
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
  const coverPath = getCoverPath(record);
  const coverAlt = getCoverAlt(record, language);

  return createPageMetadata({
    description,
    imageAlt: coverAlt,
    imagePath: coverPath,
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
  const moreByAuthorRecords = recommendedRecords
    .filter((candidate) => candidate.reasons.includes("author"))
    .slice(0, 4);
  const relatedRecommendationRecords = recommendedRecords
    .filter((candidate) => !candidate.reasons.includes("author"))
    .slice(0, 4);
  const editionOptions = getEditionOptions(record, relatedEditions);
  const editionTitle = getEditionTitle(record, language);
  const authorLine = getAuthorLine(record);
  const displayFacts = record.edition.displayFacts;
  const editionIdentityFacts = getEditionIdentityFacts(record, language, copy);
  const commerceProofItems = getCommerceProofItems(copy);
  const commerceHintItems = getCommerceHintItems(copy);
  const workFacts = getWorkFacts(record, language, copy);
  const reasonToRead = record.edition.reasonToRead
    ? pickLocalizedText(record.edition.reasonToRead, language)
    : null;
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
          className="grid gap-case-md lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-case-xl"
          data-book-detail={record.edition.slug}
        >
          <div className="flex min-w-0 flex-col gap-case-md lg:sticky lg:top-case-xl">
            <div
              className="mx-auto w-full max-w-[220px] rounded-lg border border-discovery/20 bg-surface p-case-md shadow-[var(--case-shadow-soft)] sm:max-w-[280px] lg:max-w-none"
              data-book-detail-image
            >
              <BookCoverFrame
                className="w-full"
                imageClassName="transition duration-300 hover:scale-[1.01]"
                language={language}
                priority
                sizes="(min-width: 1024px) 400px, 100vw"
                record={record}
                showBadges={false}
                size="hero"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-case-lg">
            <div className="flex flex-col gap-case-sm">
              <div className="flex flex-wrap gap-case-xs">
                {record.categories.map((category) => (
                  <Badge
                    key={category.id}
                    className="border-discovery bg-discovery-muted text-discovery"
                    variant="primary"
                  >
                    {pickLocalizedText(category.labels, language)}
                  </Badge>
                ))}
                <Badge variant="neutral">
                  {getEditionLanguageLabel(record.edition.language, language)}
                </Badge>
                <Badge variant="neutral">
                  {getFormatLabel(record.edition.format, language)}
                </Badge>
                <Badge
                  variant={getStockBadgeVariant(record.edition.inventoryStatus)}
                >
                  {getInventoryStatusLabel(
                    record.edition.inventoryStatus,
                    language,
                  )}
                </Badge>
              </div>
              <h1 className="break-words text-heading-2 font-semibold leading-tight text-foreground md:text-heading-1">
                {editionTitle}
              </h1>
              {authorLine ? (
                <p className="text-body leading-7 text-text-muted">
                  {authorLine}
                </p>
              ) : null}
            </div>

            <div className="grid gap-case-md xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
              <aside className="order-first flex min-w-0 flex-col gap-case-md xl:order-last xl:sticky xl:top-case-xl">
                <div className="rounded-lg border border-offer/30 border-l-4 border-l-offer bg-offer-muted p-case-md shadow-[var(--case-shadow-soft)] lg:p-case-lg">
                  <div className="grid grid-cols-3 gap-case-sm xl:grid-cols-1 xl:gap-case-md">
                    <div className="min-w-0">
                      <p className="text-small font-medium uppercase text-text-muted">
                        {copy.price}
                      </p>
                      {record.edition.compareAtPriceVnd &&
                      record.edition.compareAtPriceVnd >
                        record.edition.priceVnd ? (
                        <p className="mt-case-xs text-small text-text-muted line-through">
                          {formatVnd(record.edition.compareAtPriceVnd)}
                        </p>
                      ) : null}
                      <p
                        className="mt-case-xs text-body font-semibold text-foreground sm:text-heading-3 md:text-heading-2"
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

                    <div className="min-w-0">
                      <p className="text-small font-medium uppercase text-text-muted">
                        {copy.stock}
                      </p>
                      <p className="mt-case-xs text-body font-semibold text-foreground md:text-heading-3">
                        {stockLabel}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-small font-medium uppercase text-text-muted">
                        {copy.format}
                      </p>
                      <p className="mt-case-xs text-body font-semibold text-foreground md:text-heading-3">
                        {getFormatLabel(record.edition.format, language)}
                      </p>
                    </div>
                  </div>
                </div>

                <BookEditionPurchaseControls
                  editionId={record.edition.id}
                  editionTitle={editionTitle}
                  inventoryStatus={record.edition.inventoryStatus}
                  language={language}
                  stockQuantity={record.edition.stockQuantity}
                />

                <section
                  className="grid gap-case-sm"
                  data-book-commercial-proof
                >
                  {commerceProofItems.map((item) => (
                    <CommerceProofCard key={item.title} item={item} />
                  ))}
                </section>
              </aside>

              <div className="flex min-w-0 flex-col gap-case-md">
                <p
                  className="max-w-3xl text-body leading-7 text-text-muted"
                  data-book-detail-summary
                >
                  {pickLocalizedText(record.edition.summary, language)}
                </p>

                <section
                  className="rounded-lg border border-trust/25 bg-trust-muted p-case-lg"
                  data-book-edition-identity
                >
                  <div className="flex min-w-0 flex-col gap-case-xs">
                    <h2 className="text-heading-3 font-semibold text-foreground">
                      {copy.editionIdentityTitle}
                    </h2>
                    <p className="text-small leading-6 text-text-muted">
                      {copy.commerceConfidenceDescription}
                    </p>
                  </div>
                  <dl className="mt-case-md grid gap-case-sm text-small text-text-muted sm:grid-cols-2 2xl:grid-cols-4">
                    {editionIdentityFacts.map((fact) => (
                      <DetailTerm
                        key={fact.label}
                        label={fact.label}
                        value={fact.value}
                      />
                    ))}
                  </dl>
                </section>

                <section
                  className="rounded-lg border border-discovery/20 bg-surface p-case-lg"
                  data-book-edition-comparison
                >
                  <div className="flex flex-col gap-case-xs">
                    <h2 className="text-heading-3 font-semibold text-foreground">
                      {copy.editionComparison}
                    </h2>
                    <p className="text-small leading-6 text-text-muted">
                      {copy.editionComparisonDescription}
                    </p>
                  </div>
                  <div className="mt-case-md grid gap-case-sm">
                    {editionOptions.map((option) => (
                      <EditionOption
                        key={option.edition.id}
                        copy={copy}
                        currentEditionId={record.edition.id}
                        language={language}
                        option={option}
                        rules={currencyRules}
                      />
                    ))}
                  </div>
                </section>

                {reasonToRead ? (
                  <section
                    className="rounded-lg border border-editorial/20 bg-editorial-muted p-case-lg"
                    data-book-detail-reason
                  >
                    <h2 className="text-heading-3 font-semibold text-foreground">
                      {copy.reasonToRead}
                    </h2>
                    <p className="mt-case-sm text-body leading-7 text-text-muted">
                      {reasonToRead}
                    </p>
                  </section>
                ) : null}

                <section
                  className="rounded-lg border border-discovery/20 bg-surface p-case-lg"
                  data-book-edition-details
                  data-book-verified-facts
                >
                  <div className="flex flex-col gap-case-xs">
                    <h2 className="text-heading-3 font-semibold text-foreground">
                      {copy.verifiedFacts}
                    </h2>
                    <p className="text-small leading-6 text-text-muted">
                      {copy.verifiedFactsDescription}
                    </p>
                  </div>
                  {displayFacts.length > 0 ? (
                    <dl className="mt-case-md grid gap-case-sm text-small text-text-muted sm:grid-cols-2">
                      {displayFacts.map((fact) => (
                        <DetailTerm
                          key={`${fact.key}-${fact.provenanceRecordId}`}
                          label={pickLocalizedText(fact.label, language)}
                          value={pickLocalizedText(fact.value, language)}
                        />
                      ))}
                    </dl>
                  ) : null}
                </section>

                {workFacts.length > 0 ? (
                  <section className="rounded-lg border border-border bg-paper p-case-lg">
                    <h2 className="text-heading-3 font-semibold text-foreground">
                      {copy.workContext}
                    </h2>
                    <dl className="mt-case-md grid gap-case-sm text-small text-text-muted sm:grid-cols-2">
                      {workFacts.map((fact) => (
                        <DetailTerm
                          key={fact.label}
                          label={fact.label}
                          value={fact.value}
                        />
                      ))}
                    </dl>
                  </section>
                ) : null}
              </div>
            </div>

            <section
              className="grid gap-case-md rounded-lg border border-admin/20 bg-admin-muted p-case-md shadow-[var(--case-shadow-soft)] sm:p-case-lg lg:grid-cols-3"
              data-book-commerce-hints
              data-book-confidence
            >
              {commerceHintItems.map((item) => (
                <CommerceHintCard key={item.title} item={item} />
              ))}
            </section>

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

                {moreByAuthorRecords.length > 0 ? (
                  <RecommendationGrid
                    copy={copy}
                    language={language}
                    records={moreByAuthorRecords}
                    rules={currencyRules}
                    title={copy.moreByAuthor}
                    wrapperDataAttribute="author"
                  />
                ) : null}

                {relatedRecommendationRecords.length > 0 ? (
                  <RecommendationGrid
                    copy={copy}
                    language={language}
                    records={relatedRecommendationRecords}
                    rules={currencyRules}
                    title={copy.relatedBooks}
                    wrapperDataAttribute="related"
                  />
                ) : null}
              </section>
            ) : null}
          </div>
        </section>
      </Container>
    </main>
  );
}

type ProductDetailCopy = (typeof productDetailCopy)[Language];
type CurrencyRules = ReturnType<typeof getCurrencyDisplayRules>;
type CommercialTone = "arrival" | "discovery" | "offer" | "trust";
type RecommendationTone =
  | "academic"
  | "arrival"
  | "discovery"
  | "editorial"
  | "translation";

type CommercePanelItem = {
  description: string;
  title: string;
  tone: CommercialTone;
};

function CommerceProofCard({ item }: { item: CommercePanelItem }) {
  return (
    <article
      className={cn(
        "min-w-0 rounded-md border p-case-sm",
        getCommerceProofToneClass(item.tone),
      )}
    >
      <h3 className="text-small font-semibold text-foreground">
        {item.title}
      </h3>
      <p className="mt-case-xs text-small leading-6 text-text-muted">
        {item.description}
      </p>
    </article>
  );
}

function CommerceHintCard({ item }: { item: CommercePanelItem }) {
  return (
    <article
      className={cn(
        "min-w-0 rounded-md border bg-surface p-case-md",
        getCommerceProofToneClass(item.tone),
      )}
    >
      <h2 className="text-heading-3 font-semibold text-foreground">
        {item.title}
      </h2>
      <p className="mt-case-sm text-small leading-6 text-text-muted">
        {item.description}
      </p>
    </article>
  );
}

function EditionOption({
  copy,
  currentEditionId,
  language,
  option,
  rules,
}: {
  copy: ProductDetailCopy;
  currentEditionId: string;
  language: Language;
  option: SupabaseBookCatalogRecord;
  rules: CurrencyRules;
}) {
  const isCurrent = option.edition.id === currentEditionId;
  const title = getEditionTitle(option, language);
  const compareAtPriceVnd = option.edition.compareAtPriceVnd;
  const hasOffer =
    compareAtPriceVnd !== null && compareAtPriceVnd > option.edition.priceVnd;
  const content = (
    <>
      <div className="flex min-w-0 items-start gap-case-sm">
        <BookCoverFrame
          className="w-14 shrink-0"
          language={language}
          record={option}
          showBadges={false}
          size="inline"
          sizes="56px"
        />
        <div className="min-w-0 flex-1" data-book-edition-option-content>
          <div className="flex flex-wrap gap-case-xs">
            <Badge variant="neutral" size="sm">
              {getEditionLanguageLabel(option.edition.language, language)}
            </Badge>
            <Badge variant="neutral" size="sm">
              {getFormatLabel(option.edition.format, language)}
            </Badge>
            {isCurrent ? (
              <Badge variant="primary" size="sm">
                {copy.currentEdition}
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-case-sm line-clamp-2 break-words font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-case-xs text-small text-text-muted">
            {getInventoryStatusLabel(option.edition.inventoryStatus, language)}
          </p>
        </div>
      </div>
      <div className="mt-case-sm flex flex-wrap items-baseline gap-case-xs">
        {hasOffer ? (
          <span className="text-small text-text-muted line-through">
            {formatVnd(compareAtPriceVnd)}
          </span>
        ) : null}
        <span className="text-small font-semibold text-foreground">
          <CurrencyAmount
            amountVnd={option.edition.priceVnd}
            language={language}
            rules={rules}
          />
        </span>
      </div>
      {!isCurrent ? (
        <span className="mt-case-sm block text-small font-medium text-primary">
          {copy.viewEdition}
        </span>
      ) : null}
    </>
  );
  const className = cn(
    "block min-w-0 rounded-md border p-case-md",
    isCurrent
      ? "border-primary bg-primary/5"
      : "border-border bg-background transition-colors hover:border-primary",
  );

  if (isCurrent) {
    return (
      <div
        className={className}
        data-book-edition-option={option.edition.slug}
        data-book-edition-option-current="true"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/products/${option.edition.slug}`}
      className={cn(
        className,
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      )}
      data-book-edition-option={option.edition.slug}
      data-book-edition-option-current="false"
      data-book-edition-option-link
    >
      {content}
    </Link>
  );
}

function RecommendationGrid({
  copy,
  language,
  records,
  rules,
  title,
  wrapperDataAttribute,
}: {
  copy: ProductDetailCopy;
  language: Language;
  records: RecommendedRecord[];
  rules: CurrencyRules;
  title: string;
  wrapperDataAttribute: "author" | "related";
}) {
  return (
    <div
      className="flex flex-col gap-case-sm"
      data-book-recommendation-group={wrapperDataAttribute}
    >
      <h3 className="text-body font-semibold text-foreground">{title}</h3>
      <div className="grid gap-case-md lg:grid-cols-2">
        {records.map(({ record: recommended, reasons }, index) => (
          <RecommendationTile
            key={recommended.edition.id}
            copy={copy}
            index={index}
            language={language}
            reasons={reasons}
            record={recommended}
            rules={rules}
            tone={getRecommendationTone(wrapperDataAttribute, reasons, index)}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendationTile({
  copy,
  index,
  language,
  reasons,
  record,
  rules,
  tone,
}: {
  copy: ProductDetailCopy;
  index: number;
  language: Language;
  reasons: RecommendationReason[];
  record: SupabaseBookCatalogRecord;
  rules: CurrencyRules;
  tone: RecommendationTone;
}) {
  return (
    <Link
      href={`/products/${record.edition.slug}`}
      className={cn(
        "group grid min-w-0 grid-cols-[88px_minmax(0,1fr)] items-start gap-case-md rounded-lg border p-case-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:grid-cols-[104px_minmax(0,1fr)]",
        getRecommendationToneClass(tone),
      )}
      data-book-recommendation-card={record.edition.slug}
      data-book-recommendation-index={index + 1}
      data-book-recommendation-link
    >
      <div
        className={cn(
          "min-w-0 rounded-md p-case-xs",
          getRecommendationCoverSurfaceClass(tone),
        )}
      >
        <BookCoverFrame
          className="w-full"
          imageClassName="transition duration-300 group-hover:scale-[1.02]"
          language={language}
          record={record}
          showBadges={false}
          size="compact"
          sizes="(min-width: 640px) 104px, 88px"
        />
      </div>
      <div className="min-w-0 self-center" data-book-recommendation-content>
        <div className="flex flex-wrap gap-case-xs">
          {reasons.map((reason) => (
            <Badge
              key={reason}
              className={getRecommendationBadgeClass(tone)}
              size="sm"
            >
              {getRecommendationReasonLabel(reason, copy)}
            </Badge>
          ))}
        </div>
        <h4 className="mt-case-sm line-clamp-2 break-words font-semibold text-foreground">
          {getEditionTitle(record, language)}
        </h4>
        <p className="mt-case-xs truncate text-small text-text-muted">
          {record.authors.map((author) => author.name).join(", ")}
        </p>
        <CurrencyAmount
          amountVnd={record.edition.priceVnd}
          className="mt-case-xs text-small font-semibold text-primary"
          estimateClassName="text-text-muted"
          language={language}
          rules={rules}
          size="sm"
        />
      </div>
    </Link>
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
    <div className="min-w-0">
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className="min-w-0 break-all leading-6">{value}</dd>
    </div>
  );
}

function getEditionIdentityFacts(
  record: SupabaseBookCatalogRecord,
  language: Language,
  copy: ProductDetailCopy,
) {
  const facts: Array<{ label: string; value: string }> = [
    {
      label: copy.language,
      value: getEditionLanguageLabel(record.edition.language, language),
    },
    {
      label: copy.format,
      value: getFormatLabel(record.edition.format, language),
    },
    {
      label: copy.catalogStatus,
      value: getInventoryStatusLabel(record.edition.inventoryStatus, language),
    },
  ];
  const isbn = record.edition.isbn13 ?? record.edition.isbn10;

  if (record.publisher) {
    facts.splice(2, 0, {
      label: copy.publisher,
      value: record.publisher.name,
    });
  }

  if (isbn) {
    facts.push({
      label: copy.isbn,
      value: isbn,
    });
  }

  return facts;
}

function getCommerceProofItems(copy: ProductDetailCopy): CommercePanelItem[] {
  return [
    {
      description: copy.accountRequiredDescription,
      title: copy.accountRequiredTitle,
      tone: "trust",
    },
    {
      description: copy.stockCheckDescription,
      title: copy.stockCheckTitle,
      tone: "arrival",
    },
    {
      description: copy.trustedTotalsDescription,
      title: copy.trustedTotalsTitle,
      tone: "offer",
    },
  ];
}

function getCommerceHintItems(copy: ProductDetailCopy): CommercePanelItem[] {
  return [
    {
      description: copy.shippingDescription,
      title: copy.shippingTitle,
      tone: "arrival",
    },
    {
      description: copy.paymentDescription,
      title: copy.paymentTitle,
      tone: "offer",
    },
    {
      description: copy.returnDescription,
      title: copy.returnTitle,
      tone: "trust",
    },
  ];
}

function getCommerceProofToneClass(tone: CommercialTone) {
  const classes = {
    arrival: "border-arrival/25 bg-arrival-muted",
    discovery: "border-discovery/25 bg-discovery-muted",
    offer: "border-offer/25 bg-offer-muted",
    trust: "border-trust/25 bg-trust-muted",
  } satisfies Record<CommercialTone, string>;

  return classes[tone];
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

function getAuthorLine(record: SupabaseBookCatalogRecord) {
  const authors = record.authors.map((author) => author.name).filter(Boolean);

  return authors.length > 0 ? authors.join(", ") : null;
}

function getEditionOptions(
  current: SupabaseBookCatalogRecord,
  relatedEditions: SupabaseBookCatalogRecord[],
) {
  const recordsByEditionId = new Map<string, SupabaseBookCatalogRecord>();

  [current, ...relatedEditions].forEach((record) => {
    recordsByEditionId.set(record.edition.id, record);
  });

  return [...recordsByEditionId.values()].sort((first, second) => {
    const languageOrder =
      getEditionLanguageSortValue(first) - getEditionLanguageSortValue(second);

    if (languageOrder !== 0) {
      return languageOrder;
    }

    return first.edition.displayTitle.localeCompare(second.edition.displayTitle);
  });
}

function getEditionLanguageSortValue(record: SupabaseBookCatalogRecord) {
  return record.edition.language === "en" ? 0 : 1;
}

function getWorkFacts(
  record: SupabaseBookCatalogRecord,
  language: Language,
  copy: ProductDetailCopy,
) {
  const facts: Array<{ label: string; value: string }> = [];
  const localizedWorkTitle = pickLocalizedText(
    record.work.localizedTitle,
    language,
    record.work.title,
  );

  if (
    record.work.originalTitle &&
    record.work.originalTitle !== localizedWorkTitle
  ) {
    facts.push({
      label: copy.originalTitle,
      value: record.work.originalTitle,
    });
  }

  if (record.work.originalLanguage) {
    facts.push({
      label: copy.originalLanguage,
      value: record.work.originalLanguage,
    });
  }

  if (record.work.publicationEra) {
    facts.push({
      label: copy.publicationEra,
      value: record.work.publicationEra,
    });
  }

  return facts;
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
    image: absoluteUrl(getCoverPath(record)),
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

type RecommendedRecord = {
  record: SupabaseBookCatalogRecord;
  reasons: RecommendationReason[];
  score: number;
};

function getRecommendedRecords(
  current: SupabaseBookCatalogRecord,
  catalogRecords: SupabaseBookCatalogRecord[],
): RecommendedRecord[] {
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

function getRecommendationTone(
  group: "author" | "related",
  reasons: RecommendationReason[],
  index: number,
): RecommendationTone {
  if (group === "author") {
    return index % 2 === 0 ? "editorial" : "academic";
  }

  if (reasons.includes("category")) {
    return "discovery";
  }

  if (reasons.includes("language")) {
    return "translation";
  }

  return "arrival";
}

function getRecommendationToneClass(tone: RecommendationTone) {
  const classes = {
    academic: "border-academic/25 bg-academic-muted hover:border-academic",
    arrival: "border-arrival/25 bg-arrival-muted hover:border-arrival",
    discovery: "border-discovery/25 bg-discovery-muted hover:border-discovery",
    editorial: "border-editorial/25 bg-editorial-muted hover:border-editorial",
    translation:
      "border-translation/25 bg-translation-muted hover:border-translation",
  } satisfies Record<RecommendationTone, string>;

  return classes[tone];
}

function getRecommendationCoverSurfaceClass(tone: RecommendationTone) {
  const classes = {
    academic: "bg-surface",
    arrival: "bg-arrival-muted",
    discovery: "bg-surface",
    editorial: "bg-editorial-muted",
    translation: "bg-translation-muted",
  } satisfies Record<RecommendationTone, string>;

  return classes[tone];
}

function getRecommendationBadgeClass(tone: RecommendationTone) {
  const classes = {
    academic: "border-academic bg-surface text-academic",
    arrival: "border-arrival bg-surface text-arrival",
    discovery: "border-discovery bg-surface text-discovery",
    editorial: "border-editorial bg-surface text-editorial",
    translation: "border-translation bg-surface text-translation",
  } satisfies Record<RecommendationTone, string>;

  return classes[tone];
}
