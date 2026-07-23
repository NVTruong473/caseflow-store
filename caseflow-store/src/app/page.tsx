import type { Metadata } from "next";
import Link from "next/link";

import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
} from "@/components/ui";
import { storefrontConfig } from "@/config/storefront";
import {
  CurrencyAmount,
} from "@/components/currency/currency-amount";
import {
  BookCoverFrame,
  BookCoverStack,
} from "@/features/books/cover-merchandising";
import {
  CategorySpineRail,
  DealStripShelf,
  EditorialFeatureShelf,
  ReadingPathShelf,
  TranslationPairShelf,
  type CategorySpineItem,
} from "@/features/books/merchandising-layouts";
import { getCurrencyDisplayRules } from "@/lib/format/currency-display.server";
import {
  getEditionLanguageLabel,
  pickLocalizedText,
  type Language,
} from "@/lib/i18n/language";
import { getRequestLanguage } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";
import {
  listSupabaseBookCatalog,
  listSupabaseBookCategories,
  type SupabaseBookCatalogRecord,
} from "@/lib/repositories/supabase-books";
import {
  getResolvedMerchandisingShelf,
  listSupabaseMerchandisingShelves,
  resolveSupabaseMerchandisingShelves,
  type SupabaseResolvedMerchandisingShelf,
} from "@/lib/repositories/supabase-merchandising";
import type { BookCategory, InventoryStatus } from "@/types/domain";

const HOME_LIMITS = {
  categoryCards: 8,
  editorCards: 4,
  englishCards: 4,
  heroCards: 3,
  promotionCards: 4,
  translatedGroups: 3,
  weekendCards: 4,
  vietnameseCards: 4,
} as const;

const homeCopy = {
  en: {
    allBooksNote: "500 sellable editions in the catalog",
    browseBooks: "Browse books",
    categories: "Categories",
    categoriesDescription:
      "Start from genre, language, or purpose before choosing the exact edition that fits your shelf.",
    categoriesTitle: "Shop by reading category",
    details: "View details",
    editionChoiceDescription:
      "Readers can compare English originals and Vietnamese translations without losing work-level context, author, format, price, and stock state.",
    editionChoiceTitle: "English and Vietnamese editions",
    editions: "Editions",
    featuredDescription:
      "A hand-picked shelf for approachable entry points, current offers, and editions readers can choose with confidence.",
    featuredTitle: "Editor picks",
    heroDescription:
      "A bilingual bookstore for readers who want to compare editions, see stock, and place an order without guessing what happens next.",
    heroNote:
      "Prices stay in VND at checkout. Delivery and payment choices are confirmed before the order is placed.",
    heroQuickLinksTitle: "Popular paths",
    heroSearchButton: "Search catalog",
    heroSearchLabel: "Search by title, author, or ISBN",
    heroSearchPlaceholder: "Title, author, or ISBN",
    heroSignupVoucherCta: "Register for codes",
    heroSignupVoucherDescription:
      "New customer accounts receive 3 welcome codes for the first orders.",
    heroSignupVoucherTitle: "Sign up and get discount codes",
    heroShelfDescription:
      "Current front-table picks from the live catalog, with price and stock visible before opening the detail page.",
    heroShelfTitle: "Front table now",
    heroTitle: storefrontConfig.name,
    inTheCatalog: "in catalog",
    englishEditionsTitle: "English editions",
    languageShelvesDescription:
      "Choose a reading language first, then open the exact edition with the right format, price, and stock state.",
    languageShelvesTitle: "Read in English or Vietnamese",
    noShelfItems: "This shelf is being refreshed.",
    offerLabel: "Offer",
    promotionTitle: "Promotion-ready",
    sectionLabel: "Online bookstore",
    shippingSignalsDescription:
      "Buying confidence comes from visible stock, VND source pricing, safe catalog content, and Vietnam-first delivery expectations.",
    shippingSignalsTitle: "Trust and shipping signals",
    stockLabel: "Stock",
    trackOrder: "Track order",
    translatedDescription:
      "Choose the English original, the Vietnamese edition, or compare both before adding a sellable edition to cart.",
    translatedTitle: "Translated edition pairs",
    vietnameseDescription:
      "Vietnamese editions are surfaced as a first-class shelf, not a secondary afterthought.",
    vietnameseTitle: "Vietnamese recommendations",
    viewFeatured: "Featured shelf",
    weekendTitle: "Weekend starter set",
    trustSignals: [
      {
        stat: "VND",
        title: "Source price stays clear",
        description:
          "VND remains the authoritative price, with English-mode USD estimates kept separate.",
      },
      {
        stat: "COD",
        title: "Vietnam checkout fit",
        description:
          "Delivery and payment expectations stay clear before order placement, with VND totals kept visible.",
      },
      {
        stat: "Stock",
        title: "Availability before checkout",
        description:
          "Stock labels are visible before readers commit to a specific edition.",
      },
      {
        stat: "Safe",
        title: "Clear edition content",
        description:
          "Short summaries, edition details, and cover art help readers choose without clutter.",
      },
    ],
  },
  vi: {
    allBooksNote: "500 ấn bản có thể bán trong catalog",
    browseBooks: "Duyệt sách",
    categories: "Danh mục",
    categoriesDescription:
      "Bắt đầu từ thể loại, ngôn ngữ hoặc mục đích đọc trước khi chọn đúng ấn bản cho kệ sách của bạn.",
    categoriesTitle: "Mua theo danh mục đọc",
    details: "Xem chi tiết",
    editionChoiceDescription:
      "Người đọc có thể so sánh bản gốc tiếng Anh và bản dịch tiếng Việt mà vẫn thấy rõ tác phẩm, tác giả, định dạng, giá và tồn kho.",
    editionChoiceTitle: "Bản tiếng Anh và bản tiếng Việt",
    editions: "Ấn bản",
    featuredDescription:
      `Tủ sách do ${storefrontConfig.name} chọn cho các ấn bản dễ bắt đầu, đang còn hàng và có thông tin rõ ràng.`,
    featuredTitle: "Biên tập chọn",
    heroDescription:
      "Nhà sách song ngữ giúp bạn so sánh ấn bản, thấy tồn kho và đặt hàng mà không phải đoán bước tiếp theo.",
    heroNote:
      "Giá checkout giữ theo VND. Giao hàng và phương thức thanh toán được xác nhận trước khi đặt đơn.",
    heroQuickLinksTitle: "Lối vào nhanh",
    heroSearchButton: "Tìm trong catalog",
    heroSearchLabel: "Tìm theo tên sách, tác giả hoặc ISBN",
    heroSearchPlaceholder: "Tên sách, tác giả hoặc ISBN",
    heroSignupVoucherCta: "Đăng ký nhận mã",
    heroSignupVoucherDescription:
      "Tài khoản khách hàng mới nhận 3 mã chào mừng cho các đơn đầu tiên.",
    heroSignupVoucherTitle: "Đăng ký ngay để nhận mã giảm giá",
    heroShelfDescription:
      "Các ấn bản đang nằm trên bàn trưng bày, lấy từ catalog hiện tại với giá và tồn kho rõ trước khi mở trang chi tiết.",
    heroShelfTitle: "Bàn sách hôm nay",
    heroTitle: storefrontConfig.name,
    inTheCatalog: "trong catalog",
    englishEditionsTitle: "Sách tiếng Anh",
    languageShelvesDescription:
      "Chọn ngôn ngữ đọc trước, rồi mở đúng ấn bản với định dạng, giá và tình trạng kho phù hợp.",
    languageShelvesTitle: "Đọc bằng tiếng Anh hoặc tiếng Việt",
    noShelfItems: "Kệ này đang được cập nhật.",
    offerLabel: "Ưu đãi",
    promotionTitle: "Đang có ưu đãi",
    sectionLabel: "Nhà sách trực tuyến",
    shippingSignalsDescription:
      "Độ tin cậy đến từ tồn kho rõ, giá gốc VND, nội dung catalog an toàn và kỳ vọng giao hàng ưu tiên Việt Nam.",
    shippingSignalsTitle: "Tín hiệu tin cậy và giao hàng",
    stockLabel: "Tồn kho",
    trackOrder: "Tra cứu đơn",
    translatedDescription:
      "Chọn bản gốc tiếng Anh, bản tiếng Việt, hoặc so sánh cả hai trước khi thêm đúng ấn bản vào giỏ hàng.",
    translatedTitle: "Cặp ấn bản dịch",
    vietnameseDescription:
      "Ấn bản tiếng Việt được đặt thành một kệ sách riêng, không phải phần phụ.",
    vietnameseTitle: "Gợi ý bản tiếng Việt",
    viewFeatured: "Kệ nổi bật",
    weekendTitle: "Đọc cuối tuần",
    trustSignals: [
      {
        stat: "VND",
        title: "Giá gốc rõ ràng",
        description:
          "VND vẫn là giá chuẩn, còn ước tính USD ở chế độ tiếng Anh được tách riêng.",
      },
      {
        stat: "COD",
        title: "Phù hợp checkout Việt Nam",
        description:
          "Kỳ vọng giao hàng và thanh toán được trình bày rõ trước khi đặt hàng, với tổng tiền VND luôn dễ thấy.",
      },
      {
        stat: "Kho",
        title: "Thấy tồn kho trước checkout",
        description:
          "Nhãn tồn kho xuất hiện trước khi người đọc quyết định mua một ấn bản cụ thể.",
      },
      {
        stat: "An toàn",
        title: "Nội dung ấn bản rõ ràng",
        description:
          "Tóm tắt ngắn, thông tin ấn bản và bìa sách giúp người đọc chọn nhanh hơn.",
      },
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? `${storefrontConfig.name} là nhà sách song ngữ ưu tiên độc giả Việt Nam, có catalog ấn bản Anh/Việt, giá VND rõ ràng và theo dõi đơn trong tài khoản.`
        : `${storefrontConfig.name} is a bilingual bookstore for readers in Vietnam, with English/Vietnamese editions, clear VND pricing, and account order tracking.`,
    language,
    path: "/",
    title:
      language === "vi"
        ? `${storefrontConfig.name} - Nhà sách song ngữ`
        : `${storefrontConfig.name} - Bilingual bookstore`,
  });
}

const categoryDisplayCopy: Record<
  Language,
  Partial<Record<BookCategory["slug"], { description: string; label: string }>>
> = {
  en: {},
  vi: {
    fiction: {
      label: "Văn học",
      description:
        "Tiểu thuyết và tác phẩm hư cấu để đọc theo chủ đề, tác giả và ngôn ngữ.",
    },
    "classic-literature": {
      label: "Văn học kinh điển",
      description:
        "Những tác phẩm lâu bền cho tủ sách cá nhân, trường học và thói quen đọc sâu.",
    },
    "mystery-thriller": {
      label: "Trinh thám và hồi hộp",
      description:
        "Các câu chuyện điều tra, bí ẩn và nhịp đọc căng thẳng.",
    },
    "fantasy-sci-fi": {
      label: "Giả tưởng và khoa học viễn tưởng",
      description:
        "Phiêu lưu kỳ ảo, thế giới tưởng tượng và các tác phẩm suy tưởng.",
    },
    romance: {
      label: "Lãng mạn",
      description:
        "Những câu chuyện về tình cảm, lựa chọn, hôn nhân và trưởng thành.",
    },
    "business-economics": {
      label: "Kinh doanh và kinh tế",
      description:
        "Sách về chiến lược, kinh tế và tư duy điều hành cho người đọc thực tế.",
    },
    "self-development": {
      label: "Phát triển bản thân",
      description:
        "Sách về kỷ luật, suy ngẫm, đạo đức và thói quen tự học.",
    },
    "children-young-adult": {
      label: "Thiếu nhi và tuổi teen",
      description:
        "Tác phẩm phù hợp cho độc giả nhỏ tuổi, gia đình và trường học.",
    },
  },
};

const titleOverrides: Record<
  Language,
  Partial<Record<string, string>>
> = {
  en: {},
  vi: {
    "a-tale-of-two-cities": "Hai Kinh Thành",
    "a-tale-of-two-cities-vietnamese-paperback": "Hai Kinh Thành",
    "pride-and-prejudice": "Kiêu Hãnh Và Định Kiến",
    "pride-and-prejudice-vietnamese-special-edition":
      "Kiêu Hãnh Và Định Kiến",
    "the-art-of-war": "Binh Pháp Tôn Tử",
    "the-art-of-war-vietnamese-paperback": "Binh Pháp Tôn Tử",
    "the-count-of-monte-cristo-vietnamese-paperback":
      "Bá Tước Monte Cristo",
  },
};

type TranslatedEditionGroup = {
  english: SupabaseBookCatalogRecord;
  vietnamese: SupabaseBookCatalogRecord;
  workSlug: string;
};

const categorySpineTones = [
  "discovery",
  "editorial",
  "academic",
  "translation",
  "arrival",
] satisfies Array<NonNullable<CategorySpineItem["tone"]>>;

export default async function Home() {
  const language = await getRequestLanguage();
  const copy = homeCopy[language];
  const currencyRules = getCurrencyDisplayRules();
  const [categories, records, merchandisingShelves] = await Promise.all([
    listSupabaseBookCategories(),
    listSupabaseBookCatalog({ sort: "newest" }),
    listSupabaseMerchandisingShelves(),
  ]);
  const resolvedShelves = resolveSupabaseMerchandisingShelves(
    records,
    merchandisingShelves,
  );
  const editorShelf = getResolvedMerchandisingShelf(
    resolvedShelves,
    "editor-picks",
  );
  const weekendShelf = getResolvedMerchandisingShelf(
    resolvedShelves,
    "weekend-starter-set",
  );
  const vietnameseShelf = getResolvedMerchandisingShelf(
    resolvedShelves,
    "vietnamese-editions",
  );
  const englishShelf = getResolvedMerchandisingShelf(
    resolvedShelves,
    "english-editions",
  );
  const promotionShelf = getResolvedMerchandisingShelf(
    resolvedShelves,
    "promotion-ready",
  );
  const pairedEditionShelf = getResolvedMerchandisingShelf(
    resolvedShelves,
    "paired-edition-comparison",
  );
  const editorRecords = getShelfRecords(
    editorShelf,
    HOME_LIMITS.editorCards,
    records.filter((record) => record.edition.isFeatured),
  );
  const heroRecords = getShelfRecords(
    editorShelf,
    HOME_LIMITS.heroCards,
    editorRecords,
  );
  const weekendRecords = getShelfRecords(
    weekendShelf,
    HOME_LIMITS.weekendCards,
    records.filter((record) => !record.edition.isFeatured),
  );
  const vietnameseRecords = getShelfRecords(
    vietnameseShelf,
    HOME_LIMITS.vietnameseCards,
    records.filter((record) => record.edition.language === "vi"),
  );
  const englishRecords = getShelfRecords(
    englishShelf,
    HOME_LIMITS.englishCards,
    records.filter((record) => record.edition.language === "en"),
  );
  const promotionRecords = getShelfRecords(
    promotionShelf,
    HOME_LIMITS.promotionCards,
    records.filter((record) => record.edition.compareAtPriceVnd !== null),
  );
  const translatedEditionGroups = getTranslatedEditionGroups(
    pairedEditionShelf?.records.length ? pairedEditionShelf.records : records,
  ).slice(
    0,
    HOME_LIMITS.translatedGroups,
  );
  const categoryCards = categories.slice(0, HOME_LIMITS.categoryCards);
  const heroQuickLinks = categoryCards.slice(0, 4);
  const categorySpineItems = categoryCards.map((category, index) => ({
    description: getCategoryDescription(category, language),
    href: `/catalog?category=${category.slug}`,
    label: getCategoryLabel(category, language),
    tone: categorySpineTones[index % categorySpineTones.length],
  }));
  const translationPairs = translatedEditionGroups.map((group) => ({
    english: group.english,
    vietnamese: group.vietnamese,
  }));
  const renderedEditionCount = countUniqueRenderedEditions(
    heroRecords,
    editorRecords,
    weekendRecords,
    vietnameseRecords,
    englishRecords,
    promotionRecords,
    translatedEditionGroups.flatMap((group) => [
      group.english,
      group.vietnamese,
    ]),
  );
  const stats = [
    {
      label: language === "vi" ? "Tủ sách chọn lọc" : "Curated catalog",
      value:
        language === "vi"
          ? `${records.length.toLocaleString("vi-VN")} ấn bản`
          : `${records.length.toLocaleString("en-US")} editions`,
    },
    {
      label: language === "vi" ? "Ấn bản song ngữ" : "Bilingual editions",
      value: language === "vi" ? "Anh & Việt" : "English & Vietnamese",
    },
    {
      label: language === "vi" ? "Thanh toán" : "Payment",
      value: language === "vi" ? "COD & chuyển khoản" : "COD & bank transfer",
    },
  ];

  return (
    <main
      className="bg-background text-foreground"
      data-homepage-curated-editions={renderedEditionCount}
      data-homepage-total-editions={records.length}
    >
      <section
        className="case-home-retail-hero border-b border-primary/20"
        data-home-section="hero"
      >
        <Container className="grid gap-case-xl py-case-xl md:grid-cols-[minmax(0,0.92fr)_minmax(380px,1.08fr)] md:items-center lg:py-case-2xl">
          <div className="flex min-w-0 flex-col gap-case-lg border-l-4 border-primary pl-case-md md:pl-case-lg">
            <div className="flex flex-col gap-case-sm">
              <Badge
                className="border-primary bg-primary/10 text-primary"
                variant="primary"
              >
                {copy.sectionLabel}
              </Badge>
              <h1 className="max-w-3xl text-heading-1 font-semibold leading-tight text-foreground">
                {copy.heroTitle}
              </h1>
              <p className="max-w-2xl text-body leading-6 text-text-muted md:leading-7">
                {copy.heroDescription}
              </p>
            </div>

            <form
              action="/catalog"
              className="case-home-search-panel grid gap-case-sm rounded-lg border border-primary/20 bg-surface p-case-sm sm:grid-cols-[minmax(0,1fr)_auto]"
              data-home-hero-search
            >
              <label className="sr-only" htmlFor="home-catalog-search">
                {copy.heroSearchLabel}
              </label>
              <input
                className="min-h-11 min-w-0 rounded-md border border-border bg-background px-3 text-body text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
                id="home-catalog-search"
                name="q"
                placeholder={copy.heroSearchPlaceholder}
                type="search"
              />
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
                type="submit"
              >
                {copy.heroSearchButton}
              </button>
            </form>

            <div className="flex flex-col gap-case-sm">
              <p className="text-small font-medium text-text-muted">
                {copy.heroQuickLinksTitle}
              </p>
              <div className="flex flex-wrap gap-case-xs">
                {heroQuickLinks.map((category) => (
                  <Link
                    key={category.id}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-small font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
                    data-home-hero-quick-link={category.slug}
                    href={`/catalog?category=${category.slug}`}
                  >
                    {getCategoryLabel(category, language)}
                  </Link>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg border border-primary/20 bg-surface p-case-md"
              data-home-signup-voucher-promo
            >
              <p className="font-semibold text-foreground">
                {copy.heroSignupVoucherTitle}
              </p>
              <p className="mt-case-xs text-small leading-6 text-text-muted">
                {copy.heroSignupVoucherDescription}
              </p>
              <Link
                href="/account"
                className="mt-case-sm inline-flex min-h-10 items-center justify-center rounded-md border border-primary bg-primary px-3 text-small font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
                data-home-signup-voucher-cta
              >
                {copy.heroSignupVoucherCta}
              </Link>
            </div>

            <div className="flex flex-col gap-case-sm sm:flex-row">
              <Link
                href="/catalog"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none sm:w-auto"
                data-home-cta="catalog"
              >
                {copy.browseBooks}
              </Link>
              <Link
                href="/orders/track"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-primary/25 bg-surface px-4 py-2 text-body font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none sm:w-auto"
                data-home-cta="track-order"
              >
                {copy.trackOrder}
              </Link>
            </div>

            <dl
              className="grid max-w-2xl gap-case-md border-y border-border py-case-md sm:grid-cols-3"
              data-home-hero-proof
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-0 border-l-2 border-border pl-case-sm"
                >
                  <dt className="text-small text-text-muted">{stat.label}</dt>
                  <dd className="mt-1 text-body font-semibold text-foreground">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="max-w-2xl text-small leading-6 text-text-muted">
              {copy.heroNote}
            </p>
          </div>

          <div
              className="case-home-retail-window min-w-0 rounded-lg border border-primary/20 p-case-md shadow-[var(--case-shadow-soft)] md:p-case-lg"
            data-home-hero-books
          >
            <div className="flex min-w-0 flex-col gap-case-xs sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-small font-semibold uppercase text-primary">
                  {copy.heroShelfTitle}
                </p>
                <p className="mt-1 max-w-xl text-small leading-6 text-text-muted">
                  {copy.heroShelfDescription}
                </p>
              </div>
              <Badge className="shrink-0 border-primary bg-primary/10 text-primary">
                {records.length.toLocaleString(language === "vi" ? "vi-VN" : "en-US")}{" "}
                {copy.editions}
              </Badge>
            </div>
            <BookCoverStack
              className="mx-auto mt-case-md hidden lg:block"
              language={language}
              records={heroRecords}
            />
            <div className="grid grid-cols-3 gap-case-sm lg:mt-case-md lg:grid-cols-1">
              {heroRecords.map((record) => (
                <HeroBookLink
                  key={record.edition.id}
                  language={language}
                  offerLabel={copy.offerLabel}
                  priority
                  record={record}
                  rules={currencyRules}
                  stockLabel={copy.stockLabel}
                />
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container className="flex flex-col gap-case-2xl pb-case-2xl pt-case-lg">
        <section
          id="categories"
          className="flex flex-col gap-case-lg"
          data-home-section="categories"
        >
          <CategorySpineRail
            description={copy.categoriesDescription}
            items={categorySpineItems}
            title={copy.categoriesTitle}
          />
        </section>

        <section
          id="featured"
          className="case-retail-red-band rounded-lg border border-primary/15 p-case-md md:p-case-lg"
          data-home-section="featured"
          data-home-shelf={editorShelf?.shelf.slug ?? "editor-picks"}
        >
          <span id="offers" className="scroll-mt-24" aria-hidden="true" />
          <SectionHeader
            description={getShelfDescription(
              editorShelf,
              language,
              copy.featuredDescription,
            )}
            eyebrow={copy.viewFeatured}
            title={getShelfTitle(editorShelf, language, copy.featuredTitle)}
          />

          <EditorialFeatureShelf
            description={getShelfDescription(
              editorShelf,
              language,
              copy.featuredDescription,
            )}
            language={language}
            records={editorRecords}
            rules={currencyRules}
            title={getShelfTitle(editorShelf, language, copy.featuredTitle)}
          />
        </section>

        <section
          id="weekend-starter"
          className="grid gap-case-lg rounded-lg border border-border/80 bg-surface/70 p-case-md lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:p-case-lg"
          data-home-section="weekend-starter"
          data-home-shelf={weekendShelf?.shelf.slug ?? "weekend-starter-set"}
        >
          <div className="flex flex-col gap-case-lg">
            <ReadingPathShelf
              description={getShelfDescription(
                weekendShelf,
                language,
                copy.featuredDescription,
              )}
              language={language}
              records={weekendRecords}
              rules={currencyRules}
              title={getShelfTitle(weekendShelf, language, copy.weekendTitle)}
            />
          </div>

          <aside
            className="flex flex-col gap-case-md rounded-lg border border-admin/20 bg-admin-muted p-case-lg"
            data-home-section="trust-summary"
          >
            <p className="text-small font-medium uppercase text-text-muted">
              {copy.shippingSignalsTitle}
            </p>
            <p className="text-body leading-7 text-text-muted">
              {copy.shippingSignalsDescription}
            </p>
            <div className="grid gap-case-sm">
              {copy.trustSignals.slice(0, 2).map((signal) => (
                <TrustSignal
                  key={signal.title}
                  description={signal.description}
                  stat={signal.stat}
                  title={signal.title}
                />
              ))}
            </div>
          </aside>
        </section>

        <section
          id="translated-editions"
          className="flex flex-col gap-case-lg"
          data-home-section="translated-editions"
          data-home-shelf={
            pairedEditionShelf?.shelf.slug ?? "paired-edition-comparison"
          }
        >
          <TranslationPairShelf
            description={getShelfDescription(
              pairedEditionShelf,
              language,
              copy.translatedDescription,
            )}
            language={language}
            pairs={translationPairs}
            rules={currencyRules}
            title={getShelfTitle(
              pairedEditionShelf,
              language,
              copy.translatedTitle,
            )}
          />
        </section>

        <DealStripShelf
          description={getShelfDescription(
            promotionShelf,
            language,
            copy.featuredDescription,
          )}
          language={language}
          records={promotionRecords}
          rules={currencyRules}
          title={getShelfTitle(promotionShelf, language, copy.promotionTitle)}
        />

        <section
          id="language-offers"
          className="flex flex-col gap-case-lg"
          data-home-section="language-offers"
        >
          <SectionHeader
            description={copy.languageShelvesDescription}
            title={copy.languageShelvesTitle}
          />

          <div className="grid gap-case-md lg:grid-cols-2">
            <ShelfRail
              emptyMessage={copy.noShelfItems}
              language={language}
              offerLabel={copy.offerLabel}
              records={vietnameseRecords}
              rules={currencyRules}
              shelf={vietnameseShelf}
              titleFallback={copy.vietnameseTitle}
              trackingAttribute="data-home-vietnamese-card"
            />
            <ShelfRail
              emptyMessage={copy.noShelfItems}
              language={language}
              offerLabel={copy.offerLabel}
              records={englishRecords}
              rules={currencyRules}
              shelf={englishShelf}
              titleFallback={copy.englishEditionsTitle}
              trackingAttribute="data-home-english-card"
            />
          </div>
        </section>

        <section
          id="support"
          className="flex flex-col gap-case-lg"
          data-home-section="trust-shipping"
        >
          <SectionHeader
            description={copy.shippingSignalsDescription}
            title={copy.shippingSignalsTitle}
          />

          <div className="grid gap-case-md md:grid-cols-2 lg:grid-cols-4">
            {copy.trustSignals.map((signal) => (
              <Card key={signal.title} className="h-full" data-home-trust-card>
                <CardHeader>
                  <Badge variant="primary">{signal.stat}</Badge>
                  <CardTitle>{signal.title}</CardTitle>
                  <CardDescription>{signal.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}

function SectionHeader({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-case-sm">
      {eyebrow ? (
        <p className="text-small font-medium uppercase text-text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-heading-2 font-semibold text-foreground">
        {title}
      </h2>
      <p className="text-body leading-7 text-text-muted">{description}</p>
    </div>
  );
}

function ShelfRail({
  emptyMessage,
  language,
  offerLabel,
  records,
  rules,
  shelf,
  titleFallback,
  trackingAttribute,
}: {
  emptyMessage: string;
  language: Language;
  offerLabel: string;
  records: SupabaseBookCatalogRecord[];
  rules: ReturnType<typeof getCurrencyDisplayRules>;
  shelf: SupabaseResolvedMerchandisingShelf | null;
  titleFallback: string;
  trackingAttribute: string;
}) {
  return (
    <div
      className="flex min-w-0 flex-col gap-case-md rounded-lg border border-border bg-surface p-case-md"
      data-home-shelf={shelf?.shelf.slug ?? titleFallback}
    >
      <div className="flex flex-col gap-case-xs">
        <h3 className="text-heading-3 font-semibold text-foreground">
          {getShelfTitle(shelf, language, titleFallback)}
        </h3>
        <p className="text-small leading-6 text-text-muted">
          {getShelfDescription(shelf, language, titleFallback)}
        </p>
      </div>
      <div className="grid gap-case-sm">
        {records.map((record) => (
          <CompactBookLink
            key={record.edition.id}
            language={language}
            offerLabel={offerLabel}
            record={record}
            rules={rules}
            trackingAttribute={trackingAttribute}
          />
        ))}
        {records.length === 0 ? <EmptyShelfNotice message={emptyMessage} /> : null}
      </div>
    </div>
  );
}

function EmptyShelfNotice({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-border bg-background p-case-md text-small leading-6 text-text-muted">
      {message}
    </p>
  );
}

function HeroBookLink({
  language,
  offerLabel,
  priority,
  record,
  rules,
  stockLabel,
}: {
  language: Language;
  offerLabel: string;
  priority: boolean;
  record: SupabaseBookCatalogRecord;
  rules: ReturnType<typeof getCurrencyDisplayRules>;
  stockLabel: string;
}) {
  return (
    <Link
      className="group flex min-w-0 flex-col gap-case-sm rounded-md border border-border bg-background p-case-xs transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:grid lg:grid-cols-[96px_minmax(0,1fr)] lg:items-start lg:gap-case-md lg:p-case-sm"
      data-home-hero-card={record.edition.slug}
      href={`/products/${record.edition.slug}`}
    >
      <BookCoverFrame
        className="w-full"
        imageClassName="transition duration-300 group-hover:scale-[1.025]"
        language={language}
        priority={priority}
        record={record}
        showBadges={false}
        size="compact"
        sizes="(max-width: 1023px) 28vw, 96px"
      />
      <div
        className="flex min-w-0 flex-col gap-case-xs lg:justify-center"
        data-home-hero-card-content
      >
        <div className="hidden flex-wrap gap-case-xs lg:flex">
          <Badge variant="neutral">
            {getEditionLanguageLabel(record.edition.language, language)}
          </Badge>
          <Badge variant={getStockBadgeVariant(record.edition.inventoryStatus)}>
            {getInventoryStatusLabel(record.edition.inventoryStatus, language)}
          </Badge>
          {record.edition.compareAtPriceVnd ? (
            <Badge variant="warning">{offerLabel}</Badge>
          ) : null}
        </div>
        <p className="line-clamp-2 break-words text-small font-semibold text-foreground lg:text-body">
          {getEditionTitle(record, language)}
        </p>
        <p className="hidden text-small text-text-muted lg:block">
          {record.authors.map((author) => author.name).join(", ")}
        </p>
        <p className="hidden text-small text-text-muted lg:block">
          {stockLabel}: {record.edition.stockQuantity}
        </p>
        <CurrencyAmount
          amountVnd={record.edition.priceVnd}
          className="hidden text-small font-medium text-primary lg:inline-flex"
          estimateClassName="text-text-muted"
          language={language}
          rules={rules}
          size="sm"
        />
      </div>
    </Link>
  );
}

function CompactBookLink({
  language,
  offerLabel,
  record,
  rules,
  trackingAttribute,
}: {
  language: Language;
  offerLabel: string;
  record: SupabaseBookCatalogRecord;
  rules: ReturnType<typeof getCurrencyDisplayRules>;
  trackingAttribute: string;
}) {
  return (
    <Link
      className="grid min-w-0 grid-cols-[80px_minmax(0,1fr)] items-start gap-case-md rounded-md border border-border bg-surface p-case-sm transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:grid-cols-[96px_minmax(0,1fr)]"
      data-home-book-card={record.edition.slug}
      data-home-compact-cover-card={record.edition.slug}
      href={`/products/${record.edition.slug}`}
      {...{ [trackingAttribute]: record.edition.slug }}
    >
      <BookCoverFrame
        className="w-full"
        language={language}
        record={record}
        showBadges={false}
        size="inline"
        sizes="(min-width: 640px) 96px, 80px"
      />
      <div className="flex min-w-0 flex-col gap-case-xs" data-home-book-card-content>
        <div className="flex flex-wrap gap-case-xs">
          <Badge variant="neutral">
            {getEditionLanguageLabel(record.edition.language, language)}
          </Badge>
          <Badge variant={getStockBadgeVariant(record.edition.inventoryStatus)}>
            {getInventoryStatusLabel(record.edition.inventoryStatus, language)}
          </Badge>
          {record.edition.compareAtPriceVnd ? (
            <Badge variant="warning">{offerLabel}</Badge>
          ) : null}
        </div>
        <h3 className="line-clamp-2 break-words font-semibold text-foreground">
          {getEditionTitle(record, language)}
        </h3>
        <p className="text-small text-text-muted">
          {record.authors.map((author) => author.name).join(", ")}
        </p>
        <CurrencyAmount
          amountVnd={record.edition.priceVnd}
          className="text-small font-medium text-primary"
          estimateClassName="text-text-muted"
          language={language}
          rules={rules}
          size="sm"
        />
      </div>
    </Link>
  );
}

function TrustSignal({
  description,
  stat,
  title,
}: {
  description: string;
  stat: string;
  title: string;
}) {
  return (
    <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-case-md rounded-md border border-border bg-background p-case-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-primary bg-primary/10 text-small font-semibold text-primary">
        {stat}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-case-xs text-small leading-6 text-text-muted">
          {description}
        </p>
      </div>
    </div>
  );
}

function getShelfRecords(
  shelf: SupabaseResolvedMerchandisingShelf | null,
  limit: number,
  fallbackRecords: SupabaseBookCatalogRecord[],
) {
  const records = shelf?.records.length ? shelf.records : fallbackRecords;

  return records.slice(0, limit);
}

function getShelfTitle(
  shelf: SupabaseResolvedMerchandisingShelf | null,
  language: Language,
  fallback: string,
) {
  return shelf ? pickLocalizedText(shelf.shelf.labels, language, fallback) : fallback;
}

function getShelfDescription(
  shelf: SupabaseResolvedMerchandisingShelf | null,
  language: Language,
  fallback: string,
) {
  return shelf
    ? pickLocalizedText(shelf.shelf.description, language, fallback)
    : fallback;
}

function getTranslatedEditionGroups(
  records: SupabaseBookCatalogRecord[],
): TranslatedEditionGroup[] {
  const recordsByWork = new Map<string, SupabaseBookCatalogRecord[]>();

  for (const record of records) {
    const workRecords = recordsByWork.get(record.work.id) ?? [];
    workRecords.push(record);
    recordsByWork.set(record.work.id, workRecords);
  }

  return Array.from(recordsByWork.values())
    .map((workRecords) => {
      const english = workRecords.find(
        (record) => record.edition.language === "en",
      );
      const vietnamese = workRecords.find(
        (record) => record.edition.language === "vi",
      );

      return english && vietnamese
        ? {
            english,
            vietnamese,
            workSlug: english.work.slug,
          }
        : null;
    })
    .filter((group): group is TranslatedEditionGroup => Boolean(group))
    .sort((first, second) => {
      return first.english.work.title.localeCompare(second.english.work.title);
    });
}

function countUniqueRenderedEditions(
  ...recordGroups: SupabaseBookCatalogRecord[][]
) {
  return new Set(
    recordGroups.flat().map((record) => record.edition.id),
  ).size.toString();
}

function getEditionTitle(record: SupabaseBookCatalogRecord, language: Language) {
  return (
    titleOverrides[language][record.edition.slug] ??
    pickLocalizedText(
      record.edition.localizedDisplayTitle,
      language,
      record.edition.displayTitle,
    )
  );
}

function getCategoryLabel(category: BookCategory, language: Language) {
  return (
    categoryDisplayCopy[language][category.slug]?.label ??
    pickLocalizedText(category.labels, language)
  );
}

function getCategoryDescription(category: BookCategory, language: Language) {
  return (
    categoryDisplayCopy[language][category.slug]?.description ??
    pickLocalizedText(category.description, language)
  );
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

function getStockBadgeVariant(status: InventoryStatus) {
  if (status === "in-stock" || status === "preorder") {
    return "success";
  }

  if (status === "low-stock") {
    return "warning";
  }

  return "error";
}
