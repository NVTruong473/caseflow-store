import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge, Button, Card, Container } from "@/components/ui";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { BookCoverFrame } from "@/features/books/cover-merchandising";
import { BookCatalogEmptyState } from "@/features/books/catalog-states";
import { formatVnd } from "@/lib/format/currency";
import { getCurrencyDisplayRules } from "@/lib/format/currency-display.server";
import {
  getEditionLanguageLabel,
  pickLocalizedText,
  type Language,
} from "@/lib/i18n/language";
import { getRequestLanguage } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils/cn";
import {
  listSupabaseBookCategories,
  listSupabaseBookCatalog,
  type BookCatalogAvailability,
  type SupabaseBookCatalogRecord,
} from "@/lib/repositories/supabase-books";
import {
  listSupabaseMerchandisingShelves,
  resolveSupabaseMerchandisingShelves,
  type SupabaseResolvedMerchandisingShelf,
} from "@/lib/repositories/supabase-merchandising";
import {
  BOOK_FORMATS,
  EDITION_LANGUAGES,
  INVENTORY_STATUSES,
  type BookAuthor,
  type BookCategory,
  type BookFormat,
  type EditionLanguage,
  type InventoryStatus,
} from "@/types/domain";

const CATALOG_PAGE_SIZE = 24;
const CATALOG_SORTS = [
  "relevance",
  "newest",
  "price-asc",
  "price-desc",
  "title-asc",
  "author-asc",
] as const;

type CatalogSort = (typeof CATALOG_SORTS)[number];
type CatalogFilterState = {
  author?: string;
  availability?: BookCatalogAvailability;
  category?: BookCategory["slug"];
  featured?: true;
  format?: BookFormat;
  language?: EditionLanguage;
  maxPriceVnd?: number;
  minPriceVnd?: number;
  page: number;
  q?: string;
  sort: CatalogSort;
};

type AuthorOption = Pick<BookAuthor, "id" | "name" | "slug">;
type CatalogMerchandisingEntry = {
  hasEditorialShelf: boolean;
  hasPairedShelf: boolean;
  hasPromotionShelf: boolean;
  hasStockShelf: boolean;
  shelfSlugs: string[];
};
type CatalogMerchandisingIndex = Map<string, CatalogMerchandisingEntry>;
type CatalogQuickLinkTone =
  | "academic"
  | "arrival"
  | "editorial"
  | "offer"
  | "translation"
  | "trust";
type CatalogCardTone =
  | "academic"
  | "editorial"
  | "offer"
  | "standard"
  | "translation"
  | "trust";

type CatalogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? "Duyệt catalog CaseFlow Books theo tên sách, tác giả, danh mục, ngôn ngữ, định dạng, giá VND và tình trạng tồn kho."
        : "Browse CaseFlow Books by title, author, category, language, format, VND price, and stock state.",
    language,
    path: "/catalog",
    title:
      language === "vi"
        ? "Catalog sách - CaseFlow Books"
        : "Book catalog - CaseFlow Books",
  });
}

const catalogCopy = {
  en: {
    activeView: "Active view",
    activeFilterSummary: "Current selection",
    allCategories: "All categories",
    allFormats: "All formats",
    allLanguages: "All languages",
    allResults: "All results",
    anyAuthor: "All authors",
    anyAvailability: "Any availability",
    anyCuration: "Any curation",
    applyFilters: "Apply filters",
    authorLabel: "Author",
    authors: "Authors",
    availabilityLabel: "Availability",
    breadcrumbCatalog: "Catalog",
    breadcrumbHome: "Home",
    breadcrumbLabel: "Catalog navigation",
    category: "Category",
    compareAt: "Was",
    curationLabel: "Curation",
    details: "View details",
    editorialBadge: "Editor pick",
    eyebrow: "Full bookstore catalog",
    featuredOnly: "Editor picks only",
    filtersDescription:
      "Narrow by title, author, language, format, price, and availability.",
    filtersTitle: "Find books",
    format: "Format",
    formatLabel: "Format",
    languageLabel: "Language",
    maxPriceLabel: "Max price VND",
    minPriceLabel: "Min price VND",
    next: "Next",
    page: (page: number) => `Page ${page}`,
    pageOf: (page: number, totalPages: number) =>
      `Page ${page} of ${totalPages}`,
    pairedBadge: "Bilingual pair",
    previous: "Previous",
    promotionBadge: "Offer",
    quickAvailable: "In stock now",
    quickDescription:
      "Start from language, format, offers, and availability before opening the full filter panel.",
    quickEnglish: "English originals",
    quickOffers: "Selected shelves",
    quickPaperback: "Paperback editions",
    quickTitle: "Popular ways to browse",
    quickUnder150: "Under 150k VND",
    quickVietnamese: "Vietnamese editions",
    resultCount: (start: number, end: number, total: number) =>
      `Showing ${start}-${end} of ${total} editions`,
    resultSignalAvailability: (label: string) => `Availability: ${label}`,
    resultSignalCuration: "Editorial labels are shelf-based",
    resultSignalOffers: (count: number) =>
      count > 0 ? `${count} visible offer labels` : "No visible offers",
    resultSignalSort: (label: string) => `Sort: ${label}`,
    saleState: "Sale state",
    searchLabel: "Search",
    searchPlaceholder: "Title, author, theme...",
    sortLabel: "Sort",
    sortTitle: "Title A-Z",
    stock: "Stock",
    standardListing: "Standard listing",
    title: "All book editions",
    totalEditions: "Total editions",
    viewDescription:
      "Search, filter, and paginate without losing the shelf you are browsing.",
    viewTitle:
      "Browse English originals, Vietnamese editions, formats, VND prices, and current stock state.",
  },
  vi: {
    activeView: "Chế độ đang xem",
    activeFilterSummary: "Lựa chọn hiện tại",
    allCategories: "Tất cả danh mục",
    allFormats: "Tất cả định dạng",
    allLanguages: "Tất cả ngôn ngữ",
    allResults: "Tất cả kết quả",
    anyAuthor: "Tất cả tác giả",
    anyAvailability: "Mọi tình trạng",
    anyCuration: "Mọi kệ biên tập",
    applyFilters: "Áp dụng bộ lọc",
    authorLabel: "Tác giả",
    authors: "Tác giả",
    availabilityLabel: "Tình trạng",
    breadcrumbCatalog: "Catalog",
    breadcrumbHome: "Trang chủ",
    breadcrumbLabel: "Điều hướng catalog",
    category: "Danh mục",
    compareAt: "Giá trước",
    curationLabel: "Biên tập",
    details: "Xem chi tiết",
    editorialBadge: "Biên tập chọn",
    eyebrow: "Catalog nhà sách đầy đủ",
    featuredOnly: "Chỉ kệ biên tập chọn",
    filtersDescription:
      "Lọc theo tên sách, tác giả, ngôn ngữ, định dạng, giá và tình trạng còn hàng.",
    filtersTitle: "Tìm sách",
    format: "Định dạng",
    formatLabel: "Định dạng",
    languageLabel: "Ngôn ngữ",
    maxPriceLabel: "Giá tối đa VND",
    minPriceLabel: "Giá tối thiểu VND",
    next: "Sau",
    page: (page: number) => `Trang ${page}`,
    pageOf: (page: number, totalPages: number) =>
      `Trang ${page} / ${totalPages}`,
    pairedBadge: "Cặp song ngữ",
    previous: "Trước",
    promotionBadge: "Ưu đãi",
    quickAvailable: "Còn hàng ngay",
    quickDescription:
      "Bắt đầu từ ngôn ngữ, định dạng, ưu đãi và tình trạng còn hàng trước khi mở toàn bộ bộ lọc.",
    quickEnglish: "Bản gốc tiếng Anh",
    quickOffers: "Kệ sách chọn lọc",
    quickPaperback: "Ấn bản bìa mềm",
    quickTitle: "Lối vào mua sách",
    quickUnder150: "Dưới 150k VND",
    quickVietnamese: "Ấn bản tiếng Việt",
    resultCount: (start: number, end: number, total: number) =>
      `Đang hiển thị ${start}-${end} trong ${total} ấn bản`,
    resultSignalAvailability: (label: string) => `Tình trạng: ${label}`,
    resultSignalCuration: "Nhãn biên tập dựa trên kệ sách",
    resultSignalOffers: (count: number) =>
      count > 0 ? `${count} nhãn ưu đãi đang hiển thị` : "Không có ưu đãi đang hiển thị",
    resultSignalSort: (label: string) => `Sắp xếp: ${label}`,
    saleState: "Trạng thái bán",
    searchLabel: "Tìm kiếm",
    searchPlaceholder: "Tên sách, tác giả, chủ đề...",
    sortLabel: "Sắp xếp",
    sortTitle: "Tên A-Z",
    stock: "Tồn kho",
    standardListing: "Niêm yết thường",
    title: "Tất cả ấn bản sách",
    totalEditions: "Tổng ấn bản",
    viewDescription:
      "Tìm kiếm, lọc và chuyển trang mà vẫn giữ đúng kệ sách đang xem.",
    viewTitle:
      "Duyệt bản gốc tiếng Anh, bản tiếng Việt, định dạng, giá VND và tình trạng còn hàng.",
  },
} as const;

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const language = await getRequestLanguage();
  const copy = catalogCopy[language];
  const currencyRules = getCurrencyDisplayRules();
  const params = await searchParams;
  const [categories, allRecords, merchandisingShelves] = await Promise.all([
    listSupabaseBookCategories(),
    listSupabaseBookCatalog({ sort: "title-asc" }),
    listSupabaseMerchandisingShelves(),
  ]);
  const merchandisingIndex = buildCatalogMerchandisingIndex(
    resolveSupabaseMerchandisingShelves(allRecords, merchandisingShelves),
  );
  const authorOptions = getAuthorOptions(allRecords);
  const filters = parseCatalogFilters(params, categories, authorOptions);
  const filteredRecords = await listSupabaseBookCatalog({
    author: filters.author,
    availability: filters.availability,
    category: filters.category,
    featured: filters.featured,
    format: filters.format,
    language: filters.language,
    maxPriceVnd: filters.maxPriceVnd,
    minPriceVnd: filters.minPriceVnd,
    q: filters.q,
    sort: getRepositorySort(filters.sort),
  });
  const records = sortCatalogRecords(filteredRecords, filters.sort, filters.q);
  const totalEditions = allRecords.length;
  const resultTotal = records.length;
  const totalPages = Math.max(1, Math.ceil(resultTotal / CATALOG_PAGE_SIZE));
  const currentPage = clampPage(filters.page, totalPages);
  const offset = (currentPage - 1) * CATALOG_PAGE_SIZE;
  const visibleRecords = records.slice(offset, offset + CATALOG_PAGE_SIZE);
  const rangeStart = visibleRecords.length > 0 ? offset + 1 : 0;
  const rangeEnd = offset + visibleRecords.length;
  const normalizedFilters = { ...filters, page: currentPage };
  const activeViewChips = getActiveViewChips({
    authorOptions,
    categories,
    copy,
    filters: normalizedFilters,
    language,
  });
  const resultSignals = getCatalogResultSignals({
    copy,
    filters: normalizedFilters,
    language,
    visibleRecords,
  });

  return (
    <main
      className="bg-background py-case-xl text-foreground"
      data-catalog-page
      data-catalog-rendered-count={visibleRecords.length}
      data-catalog-result-total={resultTotal}
      data-catalog-total-count={totalEditions}
    >
      <Container className="flex flex-col gap-case-xl">
        <nav
          aria-label={copy.breadcrumbLabel}
          className="flex min-w-0 flex-wrap items-center gap-case-xs text-small"
          data-catalog-breadcrumb
        >
          <Link
            href="/"
            className="rounded-md font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.breadcrumbHome}
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-text-muted" aria-current="page">
            {copy.breadcrumbCatalog}
          </span>
        </nav>

        <section className="grid gap-case-lg border-l-4 border-discovery bg-transparent py-case-md pl-case-md lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 flex-col gap-case-sm">
            <Badge
              className="border-discovery bg-discovery-muted text-discovery"
              variant="primary"
            >
              {copy.eyebrow}
            </Badge>
            <h1 className="max-w-3xl text-heading-1 font-semibold text-foreground">
              {copy.title}
            </h1>
            <p className="max-w-3xl text-body leading-7 text-text-muted">
              {copy.viewTitle}
            </p>
            <p className="max-w-3xl text-small leading-6 text-text-muted">
              {copy.viewDescription}
            </p>
          </div>

          <dl className="grid gap-case-sm sm:grid-cols-2 lg:grid-cols-1">
            <div className="border-l border-border bg-transparent px-3 py-2">
              <dt className="text-small text-text-muted">
                {copy.totalEditions}
              </dt>
              <dd className="mt-1 text-heading-3 font-semibold text-foreground">
                {totalEditions}
              </dd>
            </div>
            <div className="border-l border-border bg-transparent px-3 py-2">
              <dt className="text-small text-text-muted">{copy.activeView}</dt>
              <dd className="mt-1 text-heading-3 font-semibold text-foreground">
                {copy.pageOf(currentPage, totalPages)}
              </dd>
            </div>
          </dl>
        </section>

        <CatalogQuickLinks
          copy={{
            available: copy.quickAvailable,
            description: copy.quickDescription,
            english: copy.quickEnglish,
            offers: copy.quickOffers,
            paperback: copy.quickPaperback,
            title: copy.quickTitle,
            under150: copy.quickUnder150,
            vietnamese: copy.quickVietnamese,
          }}
        />

        <CatalogFilterForm
          authorOptions={authorOptions}
          categories={categories}
          copy={{
            allCategories: copy.allCategories,
            allFormats: copy.allFormats,
            allLanguages: copy.allLanguages,
            anyAuthor: copy.anyAuthor,
            anyAvailability: copy.anyAvailability,
            anyCuration: copy.anyCuration,
            applyFilters: copy.applyFilters,
            authorLabel: copy.authorLabel,
            availabilityLabel: copy.availabilityLabel,
            category: copy.category,
            curationLabel: copy.curationLabel,
            featuredOnly: copy.featuredOnly,
            filtersDescription: copy.filtersDescription,
            filtersTitle: copy.filtersTitle,
            formatLabel: copy.formatLabel,
            languageLabel: copy.languageLabel,
            maxPriceLabel: copy.maxPriceLabel,
            minPriceLabel: copy.minPriceLabel,
            searchLabel: copy.searchLabel,
            searchPlaceholder: copy.searchPlaceholder,
            sortLabel: copy.sortLabel,
          }}
          filters={normalizedFilters}
          language={language}
        />

        <section id="catalog-results" className="flex flex-col gap-case-lg">
          <div className="flex min-w-0 flex-col gap-case-md rounded-lg border border-border bg-surface p-case-md">
            <div className="flex min-w-0 flex-col gap-case-sm sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-heading-2 font-semibold text-foreground">
                {copy.breadcrumbCatalog}
              </h2>
              <p
                className="inline-flex w-fit max-w-full items-center rounded-md border border-border bg-paper px-3 py-1 text-small leading-6 text-text-muted sm:shrink-0 sm:whitespace-nowrap sm:text-right"
                data-catalog-result-count
              >
                {copy.resultCount(rangeStart, rangeEnd, resultTotal)}
              </p>
            </div>

            <div
              className="rounded-md border border-trust/20 bg-trust-muted p-case-sm"
              data-catalog-active-filters
            >
              <p className="text-small font-semibold text-trust">
                {copy.activeFilterSummary}
              </p>
              <div className="mt-case-xs flex flex-wrap gap-case-xs">
                {activeViewChips.map((chip) => (
                  <Badge
                    key={chip}
                    className="border-trust bg-surface text-trust"
                  >
                    {chip}
                  </Badge>
                ))}
              </div>
            </div>

            <div
              className="flex flex-wrap gap-case-xs"
              data-catalog-result-signals
            >
              {resultSignals.map((signal) => (
                <Badge key={signal.label} variant={signal.variant}>
                  {signal.label}
                </Badge>
              ))}
            </div>
          </div>

          {visibleRecords.length > 0 ? (
            <div
              className="grid gap-case-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              data-catalog-grid
            >
              {visibleRecords.map((record) => (
                <CatalogBookCard
                  key={record.edition.id}
                  copy={{
                    authors: copy.authors,
                    category: copy.category,
                    compareAt: copy.compareAt,
                    details: copy.details,
                    editorialBadge: copy.editorialBadge,
                    format: copy.format,
                    pairedBadge: copy.pairedBadge,
                    promotionBadge: copy.promotionBadge,
                    saleState: copy.saleState,
                    standardListing: copy.standardListing,
                    stock: copy.stock,
                  }}
                  language={language}
                  merchandising={
                    merchandisingIndex.get(record.edition.id) ??
                    createEmptyMerchandisingEntry()
                  }
                  priority
                  record={record}
                  rules={currencyRules}
                />
              ))}
            </div>
          ) : (
            <BookCatalogEmptyState language={language} />
          )}

          <CatalogPagination
            copy={{
              next: copy.next,
              page: copy.page,
              pageOf: copy.pageOf,
              previous: copy.previous,
            }}
            currentPage={currentPage}
            filters={normalizedFilters}
            totalPages={totalPages}
          />
        </section>
      </Container>
    </main>
  );
}

function CatalogFilterForm({
  authorOptions,
  categories,
  copy,
  filters,
  language,
}: {
  authorOptions: AuthorOption[];
  categories: BookCategory[];
  copy: {
    allCategories: string;
    allFormats: string;
    allLanguages: string;
    anyAuthor: string;
    anyAvailability: string;
    anyCuration: string;
    applyFilters: string;
    authorLabel: string;
    availabilityLabel: string;
    category: string;
    curationLabel: string;
    featuredOnly: string;
    filtersDescription: string;
    filtersTitle: string;
    formatLabel: string;
    languageLabel: string;
    maxPriceLabel: string;
    minPriceLabel: string;
    searchLabel: string;
    searchPlaceholder: string;
    sortLabel: string;
  };
  filters: CatalogFilterState;
  language: Language;
}) {
  return (
    <section
      className="rounded-lg border border-discovery/20 bg-surface p-case-lg shadow-[var(--case-shadow-soft)]"
      data-catalog-filter-panel
    >
      <div className="flex max-w-3xl flex-col gap-case-sm">
        <h2 className="text-heading-2 font-semibold text-foreground">
          {copy.filtersTitle}
        </h2>
        <p className="text-body leading-7 text-text-muted">
          {copy.filtersDescription}
        </p>
      </div>

      <form
        action="/catalog"
        className="mt-case-lg grid gap-case-md lg:grid-cols-4"
        data-catalog-filter-form
      >
        <Field label={copy.searchLabel}>
          <input
            className={fieldControlClassName}
            defaultValue={filters.q ?? ""}
            name="q"
            placeholder={copy.searchPlaceholder}
            type="search"
          />
        </Field>

        <Field label={copy.category}>
          <select
            className={fieldControlClassName}
            defaultValue={filters.category ?? ""}
            name="category"
          >
            <option value="">{copy.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {pickLocalizedText(category.labels, language)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={copy.languageLabel}>
          <select
            className={fieldControlClassName}
            defaultValue={filters.language ?? ""}
            name="language"
          >
            <option value="">{copy.allLanguages}</option>
            {EDITION_LANGUAGES.map((editionLanguage) => (
              <option key={editionLanguage} value={editionLanguage}>
                {getEditionLanguageLabel(editionLanguage, language)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={copy.formatLabel}>
          <select
            className={fieldControlClassName}
            defaultValue={filters.format ?? ""}
            name="format"
          >
            <option value="">{copy.allFormats}</option>
            {BOOK_FORMATS.map((format) => (
              <option key={format} value={format}>
                {getFormatLabel(format, language)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={copy.authorLabel}>
          <select
            className={fieldControlClassName}
            defaultValue={filters.author ?? ""}
            name="author"
          >
            <option value="">{copy.anyAuthor}</option>
            {authorOptions.map((author) => (
              <option key={author.id} value={author.slug}>
                {author.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={copy.minPriceLabel}>
          <input
            className={fieldControlClassName}
            defaultValue={filters.minPriceVnd?.toString() ?? ""}
            min="0"
            name="minPriceVnd"
            step="1000"
            type="number"
          />
        </Field>

        <Field label={copy.maxPriceLabel}>
          <input
            className={fieldControlClassName}
            defaultValue={filters.maxPriceVnd?.toString() ?? ""}
            min="0"
            name="maxPriceVnd"
            step="1000"
            type="number"
          />
        </Field>

        <Field label={copy.availabilityLabel}>
          <select
            className={fieldControlClassName}
            defaultValue={filters.availability ?? ""}
            name="availability"
          >
            <option value="">{copy.anyAvailability}</option>
            <option value="available">
              {getAvailabilityLabel("available", language)}
            </option>
            {INVENTORY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getInventoryStatusLabel(status, language)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={copy.curationLabel}>
          <select
            className={fieldControlClassName}
            defaultValue={filters.featured ? "true" : ""}
            name="featured"
          >
            <option value="">{copy.anyCuration}</option>
            <option value="true">{copy.featuredOnly}</option>
          </select>
        </Field>

        <Field label={copy.sortLabel}>
          <select
            className={fieldControlClassName}
            defaultValue={filters.sort}
            name="sort"
          >
            {CATALOG_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {getSortLabel(sort, language)}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-col gap-case-sm lg:col-span-2 lg:flex-row lg:items-end">
          <Button type="submit" className="w-full lg:w-auto">
            {copy.applyFilters}
          </Button>
          <Link
            href="/catalog"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:w-auto"
            data-catalog-clear-filters
          >
            {language === "vi" ? "Xóa bộ lọc" : "Clear filters"}
          </Link>
        </div>
      </form>
    </section>
  );
}

function CatalogQuickLinks({
  copy,
}: {
  copy: {
    available: string;
    description: string;
    english: string;
    offers: string;
    paperback: string;
    title: string;
    under150: string;
    vietnamese: string;
  };
}) {
  const quickLinks = [
    {
      href: "/catalog?maxPriceVnd=150000",
      label: copy.under150,
      tone: "offer",
    },
    {
      href: "/catalog?language=vi",
      label: copy.vietnamese,
      tone: "translation",
    },
    {
      href: "/catalog?language=en",
      label: copy.english,
      tone: "academic",
    },
    {
      href: "/catalog?availability=available",
      label: copy.available,
      tone: "trust",
    },
    {
      href: "/catalog?featured=true",
      label: copy.offers,
      tone: "editorial",
    },
    {
      href: "/catalog?format=paperback",
      label: copy.paperback,
      tone: "arrival",
    },
  ] satisfies Array<{
    href: string;
    label: string;
    tone: CatalogQuickLinkTone;
  }>;

  return (
    <section
      className="border-y border-arrival/30 bg-transparent py-case-md"
      data-catalog-quick-links
      data-v14-catalog-discovery="quick-links"
    >
      <div className="flex max-w-3xl flex-col gap-case-xs">
        <h2 className="text-heading-3 font-semibold text-foreground">
          {copy.title}
        </h2>
        <p className="text-small leading-6 text-text-muted">{copy.description}</p>
      </div>
      <div className="mt-case-md flex gap-case-sm overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center border-b-2 px-1 py-2 text-small font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              getQuickLinkToneClass(link.tone),
            )}
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-case-xs text-small font-medium text-foreground">
      {label}
      {children}
    </label>
  );
}

const fieldControlClassName =
  "min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function CatalogBookCard({
  copy,
  language,
  merchandising,
  priority,
  record,
  rules,
}: {
  copy: {
    authors: string;
    category: string;
    compareAt: string;
    details: string;
    editorialBadge: string;
    format: string;
    pairedBadge: string;
    promotionBadge: string;
    saleState: string;
    standardListing: string;
    stock: string;
  };
  language: Language;
  merchandising: CatalogMerchandisingEntry;
  priority: boolean;
  record: SupabaseBookCatalogRecord;
  rules: ReturnType<typeof getCurrencyDisplayRules>;
}) {
  const title = getEditionTitle(record, language);
  const authorLine = record.authors.map((author) => author.name).join(", ");
  const categoryLine = getCategoryLine(record, language);
  const hasOffer = hasRealOffer(record);
  const cardTone = getCatalogCardTone({ hasOffer, merchandising, record });
  const saleStateLabel = getSaleStateLabel({
    hasEditorialShelf: merchandising.hasEditorialShelf,
    hasOffer,
    language,
    standardListing: copy.standardListing,
  });

  return (
    <Card
      className={cn(
        "case-product-card-motion h-full overflow-hidden border-l-4 shadow-[var(--case-shadow-soft)] transition-colors hover:border-discovery",
        getCatalogCardBorderClass(cardTone),
      )}
      data-catalog-author={getPrimaryAuthorName(record)}
      data-catalog-card={record.edition.slug}
      data-catalog-card-title={title}
      data-catalog-cover-source={record.coverAsset?.source ?? "missing"}
      data-catalog-editorial={merchandising.hasEditorialShelf ? "true" : "false"}
      data-catalog-inventory-status={record.edition.inventoryStatus}
      data-catalog-paired={merchandising.hasPairedShelf ? "true" : "false"}
      data-catalog-price-vnd={record.edition.priceVnd}
      data-catalog-promotion={hasOffer ? "compare-at" : "none"}
      data-catalog-shelf-slugs={merchandising.shelfSlugs.join(",")}
      data-catalog-card-variant={cardTone}
      padding="none"
      variant="interactive"
    >
      <Link
        aria-label={`${title} - ${authorLine}`}
        className="group grid h-full grid-cols-[96px_minmax(0,1fr)] gap-case-sm rounded-lg p-case-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex sm:flex-col sm:p-0"
        href={`/products/${record.edition.slug}`}
      >
        <div
          className={cn(
            "flex min-w-0 items-start justify-center rounded-md p-case-xs sm:rounded-none sm:p-case-md",
            getCatalogCardSurfaceClass(cardTone),
          )}
        >
          <BookCoverFrame
            className="w-full max-w-24 sm:mx-auto sm:max-w-36"
            imageClassName="transition duration-300 group-hover:scale-[1.025]"
            language={language}
            priority={priority}
            record={record}
            showBadges={false}
            size="shelf"
            sizes="(max-width: 639px) 96px, (max-width: 1023px) 42vw, (max-width: 1279px) 30vw, 240px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-case-sm sm:px-case-md sm:pb-case-md">
          <div className="flex flex-wrap gap-case-xs">
            <Badge variant="neutral">
              {getEditionLanguageLabel(record.edition.language, language)}
            </Badge>
            <Badge variant="neutral">
              {getFormatLabel(record.edition.format, language)}
            </Badge>
            {merchandising.hasEditorialShelf ? (
              <Badge
                className="border-editorial bg-editorial-muted text-editorial"
                variant="primary"
              >
                {copy.editorialBadge}
              </Badge>
            ) : null}
            {hasOffer ? (
              <Badge className="bg-offer-muted text-offer" variant="warning">
                {copy.promotionBadge}
              </Badge>
            ) : null}
            {merchandising.hasPairedShelf ? (
              <Badge variant="neutral">{copy.pairedBadge}</Badge>
            ) : null}
            <Badge variant={getStockBadgeVariant(record.edition.inventoryStatus)}>
              {getInventoryStatusLabel(record.edition.inventoryStatus, language)}
            </Badge>
          </div>

          <div className="flex flex-1 flex-col gap-case-xs text-small leading-6">
            <h2 className="break-words text-body font-semibold leading-6 text-foreground">
              {title}
            </h2>
            <dl className="grid gap-case-xs text-text-muted">
              <div>
                <dt className="sr-only">{copy.authors}</dt>
                <dd className="break-words">{authorLine}</dd>
              </div>
              <div>
                <dt className="sr-only">{copy.category}</dt>
                <dd className="break-words">{categoryLine}</dd>
              </div>
              <div>
                <dt className="sr-only">{copy.saleState}</dt>
                <dd>{saleStateLabel}</dd>
              </div>
              <div>
                <dt className="sr-only">{copy.stock}</dt>
                <dd>
                  {getInventoryStatusLabel(record.edition.inventoryStatus, language)}
                  {" - "}
                  {record.edition.stockQuantity}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-auto flex min-w-0 flex-col gap-case-xs">
            {hasOffer ? (
              <p className="text-small text-text-muted" data-catalog-compare-at>
                {copy.compareAt}:{" "}
                <span className="line-through">
                  {formatVnd(record.edition.compareAtPriceVnd ?? 0)}
                </span>
              </p>
            ) : null}
            <CurrencyAmount
              amountVnd={record.edition.priceVnd}
              className="text-heading-3 font-semibold text-foreground"
              estimateClassName="text-small font-medium text-text-muted"
              language={language}
              rules={rules}
              size="sm"
            />
            <span className="text-small font-medium text-primary">
              {copy.details}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}

function CatalogPagination({
  copy,
  currentPage,
  filters,
  totalPages,
}: {
  copy: {
    next: string;
    page: (page: number) => string;
    pageOf: (page: number, totalPages: number) => string;
    previous: string;
  };
  currentPage: number;
  filters: CatalogFilterState;
  totalPages: number;
}) {
  return (
    <nav
      aria-label={copy.pageOf(currentPage, totalPages)}
      className="flex flex-col gap-case-sm rounded-lg border border-border bg-surface p-case-md sm:flex-row sm:items-center sm:justify-between"
      data-catalog-pagination
    >
      <PaginationLink
        disabled={currentPage <= 1}
        href={getCatalogPageHref(currentPage - 1, filters)}
      >
        {copy.previous}
      </PaginationLink>

      <div className="flex flex-wrap justify-center gap-case-xs">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => {
            const isCurrent = page === currentPage;

            return (
              <Link
                key={page}
                aria-current={isCurrent ? "page" : undefined}
                className={
                  isCurrent
                    ? "inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-primary bg-primary px-3 text-small font-semibold text-surface"
                    : "inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border bg-background px-3 text-small font-medium text-foreground hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                }
                data-catalog-page-link={page}
                href={getCatalogPageHref(page, filters)}
              >
                {page}
              </Link>
            );
          },
        )}
      </div>

      <PaginationLink
        disabled={currentPage >= totalPages}
        href={getCatalogPageHref(currentPage + 1, filters)}
      >
        {copy.next}
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  children,
  disabled,
  href,
}: {
  children: ReactNode;
  disabled: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface-muted px-4 text-small font-medium text-text-muted"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-small font-medium text-foreground hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      href={href}
    >
      {children}
    </Link>
  );
}

function getQuickLinkToneClass(tone: CatalogQuickLinkTone) {
  const classes = {
    academic: "border-academic text-academic hover:text-foreground",
    arrival: "border-arrival text-arrival hover:text-foreground",
    editorial: "border-editorial text-editorial hover:text-foreground",
    offer: "border-offer text-offer hover:text-foreground",
    translation: "border-translation text-translation hover:text-foreground",
    trust: "border-trust text-trust hover:text-foreground",
  } satisfies Record<CatalogQuickLinkTone, string>;

  return classes[tone];
}

function getCatalogCardTone({
  hasOffer,
  merchandising,
  record,
}: {
  hasOffer: boolean;
  merchandising: CatalogMerchandisingEntry;
  record: SupabaseBookCatalogRecord;
}): CatalogCardTone {
  if (hasOffer) return "offer";
  if (merchandising.hasPairedShelf || record.edition.language === "vi") {
    return "translation";
  }
  if (merchandising.hasEditorialShelf) return "editorial";
  if (record.edition.language === "en") return "academic";
  if (record.edition.inventoryStatus === "in-stock") return "trust";

  return "standard";
}

function getCatalogCardBorderClass(tone: CatalogCardTone) {
  const classes = {
    academic: "border-l-academic",
    editorial: "border-l-editorial",
    offer: "border-l-offer",
    standard: "border-l-border",
    translation: "border-l-translation",
    trust: "border-l-trust",
  } satisfies Record<CatalogCardTone, string>;

  return classes[tone];
}

function getCatalogCardSurfaceClass(tone: CatalogCardTone) {
  const classes = {
    academic: "bg-academic-muted",
    editorial: "bg-editorial-muted",
    offer: "bg-offer-muted",
    standard: "bg-paper",
    translation: "bg-translation-muted",
    trust: "bg-trust-muted",
  } satisfies Record<CatalogCardTone, string>;

  return classes[tone];
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), totalPages);
}

function buildCatalogMerchandisingIndex(
  shelves: SupabaseResolvedMerchandisingShelf[],
): CatalogMerchandisingIndex {
  const index = new Map<string, CatalogMerchandisingEntry>();

  for (const shelf of shelves) {
    for (const record of shelf.records) {
      const entry = index.get(record.edition.id) ?? createEmptyMerchandisingEntry();

      entry.shelfSlugs.push(shelf.shelf.slug);
      if (shelf.shelf.sourceKind === "editorial") {
        entry.hasEditorialShelf = true;
      }
      if (shelf.shelf.type === "paired-editions") {
        entry.hasPairedShelf = true;
      }
      if (shelf.shelf.type === "promotion-focus") {
        entry.hasPromotionShelf = true;
      }
      if (shelf.shelf.type === "inventory-focus") {
        entry.hasStockShelf = true;
      }

      index.set(record.edition.id, entry);
    }
  }

  return index;
}

function createEmptyMerchandisingEntry(): CatalogMerchandisingEntry {
  return {
    hasEditorialShelf: false,
    hasPairedShelf: false,
    hasPromotionShelf: false,
    hasStockShelf: false,
    shelfSlugs: [],
  };
}

function getCatalogPageHref(page: number, filters: CatalogFilterState) {
  const params = new URLSearchParams();

  appendCatalogParam(params, "q", filters.q);
  appendCatalogParam(params, "category", filters.category);
  appendCatalogParam(params, "language", filters.language);
  appendCatalogParam(params, "format", filters.format);
  appendCatalogParam(params, "author", filters.author);
  appendCatalogParam(params, "minPriceVnd", filters.minPriceVnd?.toString());
  appendCatalogParam(params, "maxPriceVnd", filters.maxPriceVnd?.toString());
  appendCatalogParam(params, "availability", filters.availability);

  if (filters.featured) {
    params.set("featured", "true");
  }

  if (filters.sort !== getDefaultCatalogSort(filters.q)) {
    params.set("sort", filters.sort);
  }

  if (page > 1) {
    params.set("page", page.toString());
  }

  const query = params.toString();

  return query ? `/catalog?${query}` : "/catalog";
}

function appendCatalogParam(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
) {
  if (value) {
    params.set(key, value);
  }
}

function parseCatalogFilters(
  params: Awaited<CatalogPageProps["searchParams"]>,
  categories: BookCategory[],
  authorOptions: AuthorOption[],
): CatalogFilterState {
  const q = readSearchParam(params?.q);
  const minPriceVnd = readPriceParam(params?.minPriceVnd);
  const maxPriceVnd = readPriceParam(params?.maxPriceVnd);
  const safePriceRange =
    minPriceVnd !== undefined &&
    maxPriceVnd !== undefined &&
    minPriceVnd > maxPriceVnd
      ? {}
      : { maxPriceVnd, minPriceVnd };

  return {
    author: readAuthorParam(params?.author, authorOptions),
    availability: readAvailabilityParam(params?.availability),
    category: readCategoryParam(params?.category, categories),
    featured: readSingleParam(params?.featured) === "true" ? true : undefined,
    format: readFormatParam(params?.format),
    language: readLanguageParam(params?.language),
    page: readPageParam(params?.page),
    q,
    sort: readSortParam(params?.sort, q),
    ...safePriceRange,
  };
}

function readSingleParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalized = rawValue?.trim();

  return normalized || undefined;
}

function readPageParam(value: string | string[] | undefined) {
  const page = Number(readSingleParam(value) ?? "1");

  return Number.isInteger(page) ? page : 1;
}

function readSearchParam(value: string | string[] | undefined) {
  const normalized = readSingleParam(value);

  return normalized && normalized.length <= 120 ? normalized : undefined;
}

function readPriceParam(value: string | string[] | undefined) {
  const parsed = Number(readSingleParam(value));

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 50_000_000) {
    return undefined;
  }

  return parsed;
}

function readCategoryParam(
  value: string | string[] | undefined,
  categories: BookCategory[],
) {
  const normalized = readSingleParam(value);

  return categories.some((category) => category.slug === normalized)
    ? (normalized as BookCategory["slug"])
    : undefined;
}

function readAuthorParam(
  value: string | string[] | undefined,
  authorOptions: AuthorOption[],
) {
  const normalized = readSingleParam(value);

  return authorOptions.some((author) => author.slug === normalized)
    ? normalized
    : undefined;
}

function readLanguageParam(value: string | string[] | undefined) {
  const normalized = readSingleParam(value);

  return EDITION_LANGUAGES.includes(normalized as EditionLanguage)
    ? (normalized as EditionLanguage)
    : undefined;
}

function readFormatParam(value: string | string[] | undefined) {
  const normalized = readSingleParam(value);

  return BOOK_FORMATS.includes(normalized as BookFormat)
    ? (normalized as BookFormat)
    : undefined;
}

function readAvailabilityParam(value: string | string[] | undefined) {
  const normalized = readSingleParam(value);

  if (normalized === "available") {
    return normalized;
  }

  return INVENTORY_STATUSES.includes(normalized as InventoryStatus)
    ? (normalized as InventoryStatus)
    : undefined;
}

function readSortParam(
  value: string | string[] | undefined,
  query?: string,
): CatalogSort {
  const normalized = readSingleParam(value);

  return CATALOG_SORTS.includes(normalized as CatalogSort)
    ? (normalized as CatalogSort)
    : getDefaultCatalogSort(query);
}

function getDefaultCatalogSort(query?: string): CatalogSort {
  return query ? "relevance" : "title-asc";
}

function getRepositorySort(sort: CatalogSort) {
  switch (sort) {
    case "newest":
    case "price-asc":
    case "price-desc":
    case "title-asc":
      return sort;
    case "author-asc":
    case "relevance":
    default:
      return "title-asc";
  }
}

function sortCatalogRecords(
  records: SupabaseBookCatalogRecord[],
  sort: CatalogSort,
  query?: string,
) {
  return [...records].sort((first, second) => {
    switch (sort) {
      case "relevance":
        return (
          getRelevanceScore(second, query) -
            getRelevanceScore(first, query) ||
          compareEditionTitle(first, second)
        );
      case "newest":
        return (
          Date.parse(second.edition.createdAt) -
            Date.parse(first.edition.createdAt) ||
          compareEditionTitle(first, second)
        );
      case "price-asc":
        return (
          first.edition.priceVnd - second.edition.priceVnd ||
          compareEditionTitle(first, second)
        );
      case "price-desc":
        return (
          second.edition.priceVnd - first.edition.priceVnd ||
          compareEditionTitle(first, second)
        );
      case "author-asc":
        return (
          getPrimaryAuthorName(first).localeCompare(getPrimaryAuthorName(second)) ||
          compareEditionTitle(first, second)
        );
      case "title-asc":
      default:
        return compareEditionTitle(first, second);
    }
  });
}

function compareEditionTitle(
  first: SupabaseBookCatalogRecord,
  second: SupabaseBookCatalogRecord,
) {
  return first.edition.displayTitle.localeCompare(second.edition.displayTitle);
}

function getRelevanceScore(record: SupabaseBookCatalogRecord, query?: string) {
  const normalizedQuery = query?.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return 0;
  }

  const title = record.edition.displayTitle.toLocaleLowerCase();
  const authorLine = record.authors
    .map((author) => author.name)
    .join(" ")
    .toLocaleLowerCase();
  const categoryLine = record.categories
    .map((category) => `${category.labels.en} ${category.labels.vi}`)
    .join(" ")
    .toLocaleLowerCase();
  const summary = `${record.edition.summary.en} ${record.edition.summary.vi}`.toLocaleLowerCase();

  return (
    (title.includes(normalizedQuery) ? 100 : 0) +
    (authorLine.includes(normalizedQuery) ? 60 : 0) +
    (categoryLine.includes(normalizedQuery) ? 30 : 0) +
    (summary.includes(normalizedQuery) ? 10 : 0)
  );
}

function getAuthorOptions(records: SupabaseBookCatalogRecord[]) {
  const authors = new Map<string, AuthorOption>();

  for (const record of records) {
    for (const author of record.authors) {
      authors.set(author.id, {
        id: author.id,
        name: author.name,
        slug: author.slug,
      });
    }
  }

  return Array.from(authors.values()).sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

function getActiveViewChips({
  authorOptions,
  categories,
  copy,
  filters,
  language,
}: {
  authorOptions: AuthorOption[];
  categories: BookCategory[];
  copy: typeof catalogCopy[Language];
  filters: CatalogFilterState;
  language: Language;
}) {
  const chips = [
    filters.q ? `"${filters.q}"` : copy.allResults,
    getCategoryChip(filters.category, categories, language, copy.allCategories),
    filters.language
      ? getEditionLanguageLabel(filters.language, language)
      : copy.allLanguages,
    filters.format ? getFormatLabel(filters.format, language) : copy.allFormats,
    getAuthorChip(filters.author, authorOptions, copy.anyAuthor),
    filters.availability
      ? getAvailabilityLabel(filters.availability, language)
      : copy.anyAvailability,
    filters.featured ? copy.featuredOnly : copy.anyCuration,
    getSortLabel(filters.sort, language),
    copy.page(filters.page),
  ];

  if (
    filters.minPriceVnd !== undefined ||
    filters.maxPriceVnd !== undefined
  ) {
    chips.splice(
      6,
      0,
      getPriceRangeChip(filters.minPriceVnd, filters.maxPriceVnd, language),
    );
  }

  return chips;
}

function getCatalogResultSignals({
  copy,
  filters,
  language,
  visibleRecords,
}: {
  copy: typeof catalogCopy[Language];
  filters: CatalogFilterState;
  language: Language;
  visibleRecords: SupabaseBookCatalogRecord[];
}) {
  const offerCount = visibleRecords.filter(hasRealOffer).length;
  const availabilityLabel = filters.availability
    ? getAvailabilityLabel(filters.availability, language)
    : copy.anyAvailability;
  const sortLabel = getSortLabel(filters.sort, language);

  return [
    {
      label: copy.resultSignalSort(sortLabel),
      variant: "neutral" as const,
    },
    {
      label: copy.resultSignalAvailability(availabilityLabel),
      variant: filters.availability ? ("success" as const) : ("neutral" as const),
    },
    {
      label: copy.resultSignalOffers(offerCount),
      variant: offerCount > 0 ? ("warning" as const) : ("neutral" as const),
    },
    {
      label: copy.resultSignalCuration,
      variant: filters.featured ? ("primary" as const) : ("neutral" as const),
    },
  ];
}

function getCategoryChip(
  slug: BookCategory["slug"] | undefined,
  categories: BookCategory[],
  language: Language,
  fallback: string,
) {
  const category = categories.find((item) => item.slug === slug);

  return category ? pickLocalizedText(category.labels, language) : fallback;
}

function getAuthorChip(
  slug: string | undefined,
  authorOptions: AuthorOption[],
  fallback: string,
) {
  return authorOptions.find((author) => author.slug === slug)?.name ?? fallback;
}

function getPriceRangeChip(
  minPriceVnd: number | undefined,
  maxPriceVnd: number | undefined,
  language: Language,
) {
  const min = minPriceVnd?.toLocaleString("vi-VN") ?? "0";
  const max =
    maxPriceVnd?.toLocaleString("vi-VN") ?? (language === "vi" ? "không giới hạn" : "no max");

  return language === "vi" ? `Giá ${min}-${max} VND` : `Price ${min}-${max} VND`;
}

function getEditionTitle(record: SupabaseBookCatalogRecord, language: Language) {
  return pickLocalizedText(
    record.edition.localizedDisplayTitle,
    language,
    record.edition.displayTitle,
  );
}

function getCategoryLine(
  record: SupabaseBookCatalogRecord,
  language: Language,
) {
  return record.categories
    .slice(0, 2)
    .map((category) => pickLocalizedText(category.labels, language))
    .join(", ");
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

function getAvailabilityLabel(
  availability: BookCatalogAvailability,
  language: Language,
) {
  if (availability === "available") {
    return language === "vi" ? "Có thể mua" : "Available";
  }

  return getInventoryStatusLabel(availability, language);
}

function getSortLabel(sort: CatalogSort, language: Language) {
  const labels: Record<Language, Record<CatalogSort, string>> = {
    en: {
      "author-asc": "Author A-Z",
      newest: "Newest",
      "price-asc": "Price low-high",
      "price-desc": "Price high-low",
      relevance: "Relevance",
      "title-asc": "Title A-Z",
    },
    vi: {
      "author-asc": "Tác giả A-Z",
      newest: "Mới nhất",
      "price-asc": "Giá thấp-cao",
      "price-desc": "Giá cao-thấp",
      relevance: "Liên quan",
      "title-asc": "Tên A-Z",
    },
  };

  return labels[language][sort];
}

function getPrimaryAuthorName(record: SupabaseBookCatalogRecord) {
  return record.authors[0]?.name ?? "";
}

function hasRealOffer(record: SupabaseBookCatalogRecord) {
  return (
    record.edition.compareAtPriceVnd !== null &&
    record.edition.compareAtPriceVnd > record.edition.priceVnd
  );
}

function getSaleStateLabel({
  hasEditorialShelf,
  hasOffer,
  language,
  standardListing,
}: {
  hasEditorialShelf: boolean;
  hasOffer: boolean;
  language: Language;
  standardListing: string;
}) {
  if (language === "vi") {
    if (hasOffer) return "Ưu đãi theo giá CaseFlow";
    if (hasEditorialShelf) return "Kệ biên tập";
    return standardListing;
  }

  if (hasOffer) return "CaseFlow offer";
  if (hasEditorialShelf) return "Editorial shelf";
  return standardListing;
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
