import Link from "next/link";

import { Badge } from "@/components/ui";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import type { CurrencyDisplayRules } from "@/lib/format/currency-display";
import {
  getEditionLanguageLabel,
  pickLocalizedText,
  type Language,
} from "@/lib/i18n/language";
import type { SupabaseBookCatalogRecord } from "@/lib/repositories/supabase-books";
import { cn } from "@/lib/utils/cn";

import {
  BookCoverFrame,
  getBookAuthorLine,
  getBookEditionTitle,
  getBookFormatLabel,
} from "./cover-merchandising";

type SharedMerchandisingProps = {
  className?: string;
  description?: string;
  language: Language;
  title: string;
};

type CurrencyProps = {
  rules: CurrencyDisplayRules;
};

export type TranslationPair = {
  english: SupabaseBookCatalogRecord;
  vietnamese: SupabaseBookCatalogRecord;
};

export type CategorySpineItem = {
  description: string;
  href: string;
  label: string;
  tone?: "academic" | "arrival" | "discovery" | "editorial" | "translation";
};

export function MerchandisingSectionHeader({
  className,
  description,
  title,
}: {
  className?: string;
  description?: string;
  title: string;
}) {
  return (
    <header className={cn("flex min-w-0 flex-col gap-case-xs", className)}>
      <h2 className="text-heading-2 font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="max-w-3xl text-small leading-6 text-text-muted">
          {description}
        </p>
      ) : null}
    </header>
  );
}

export function EditorialFeatureShelf({
  className,
  description,
  language,
  records,
  rules,
  title,
}: SharedMerchandisingProps &
  CurrencyProps & {
    records: SupabaseBookCatalogRecord[];
  }) {
  const [feature, ...supporting] = records.slice(0, 4);

  if (!feature) {
    return null;
  }

  return (
    <section
      className={cn("grid gap-case-md lg:grid-cols-[minmax(0,1.35fr)_1fr]", className)}
      data-v14-merchandising-layout="editorial-feature"
    >
      <Link
        className="group grid min-w-0 gap-case-lg rounded-lg border border-editorial/20 bg-editorial-muted p-case-lg transition-colors hover:border-editorial focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:grid-cols-[160px_minmax(0,1fr)]"
        href={bookHref(feature)}
      >
        <BookCoverFrame
          className="w-36 sm:w-40"
          imageClassName="transition duration-300 group-hover:scale-[1.025]"
          language={language}
          priority
          record={feature}
          showBadges={false}
          size="hero"
          sizes="(max-width: 640px) 160px, 220px"
        />
        <div className="flex min-w-0 flex-col gap-case-sm">
          <Badge className="border-editorial bg-surface text-editorial">
            {language === "vi" ? "Biên tập chọn" : "Editor selected"}
          </Badge>
          <div>
            <p className="text-small font-semibold uppercase tracking-normal text-editorial">
              {title}
            </p>
            <h3 className="mt-case-xs line-clamp-3 text-heading-2 font-semibold text-foreground">
              {getBookEditionTitle(feature, language)}
            </h3>
          </div>
          {description ? (
            <p className="line-clamp-3 text-small leading-6 text-text-muted">
              {description}
            </p>
          ) : null}
          <p className="text-small text-text-muted">
            {getBookAuthorLine(feature) ??
              (language === "vi" ? "Tác giả đang cập nhật" : "Author pending")}
          </p>
          <CurrencyAmount
            amountVnd={feature.edition.priceVnd}
            className="mt-auto text-heading-3 font-semibold text-foreground"
            estimateClassName="text-small text-text-muted"
            language={language}
            rules={rules}
            size="sm"
          />
        </div>
      </Link>

      <div className="grid gap-case-sm">
        {supporting.map((record) => (
          <CompactRetailTile
            key={record.edition.id}
            language={language}
            record={record}
            rules={rules}
            tone="editorial"
          />
        ))}
      </div>
    </section>
  );
}

export function DealStripShelf({
  className,
  description,
  language,
  records,
  rules,
  title,
}: SharedMerchandisingProps &
  CurrencyProps & {
    records: SupabaseBookCatalogRecord[];
  }) {
  const offerRecords = records
    .filter((record) => record.edition.compareAtPriceVnd !== null)
    .slice(0, 4);

  if (offerRecords.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-lg border border-offer/25 bg-offer-muted p-case-md",
        className,
      )}
      data-v14-merchandising-layout="deal-strip"
    >
      <MerchandisingSectionHeader description={description} title={title} />
      <div className="mt-case-md grid gap-case-sm md:grid-cols-2 xl:grid-cols-4">
        {offerRecords.map((record) => (
          <Link
            key={record.edition.id}
            className="group grid min-w-0 grid-cols-[80px_minmax(0,1fr)] gap-case-sm rounded-md bg-surface p-case-sm transition-colors hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href={bookHref(record)}
          >
            <BookCoverFrame
              className="w-full"
              language={language}
              record={record}
              showBadges={false}
              size="compact"
              sizes="80px"
            />
            <div className="flex min-w-0 flex-col gap-case-xs">
              <Badge className="border-offer bg-offer-muted text-offer">
                {language === "vi" ? "Ưu đãi" : "Offer"}
              </Badge>
              <h3 className="line-clamp-2 font-semibold text-foreground">
                {getBookEditionTitle(record, language)}
              </h3>
              <p className="truncate text-small text-text-muted">
                {getBookAuthorLine(record)}
              </p>
              <CurrencyAmount
                amountVnd={record.edition.priceVnd}
                className="mt-auto text-small font-semibold text-primary"
                estimateClassName="text-text-muted"
                language={language}
                rules={rules}
                size="sm"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TranslationPairShelf({
  className,
  description,
  language,
  pairs,
  rules,
  title,
}: SharedMerchandisingProps &
  CurrencyProps & {
    pairs: TranslationPair[];
  }) {
  if (pairs.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("flex min-w-0 flex-col gap-case-md", className)}
      data-v14-merchandising-layout="translation-pairs"
    >
      <MerchandisingSectionHeader description={description} title={title} />
      <div className="grid gap-case-md lg:grid-cols-3">
        {pairs.slice(0, 3).map((pair) => (
          <div
            key={pair.english.work.id}
            className="min-w-0 rounded-lg border border-translation/20 bg-translation-muted p-case-md"
          >
            <h3 className="line-clamp-2 text-heading-3 font-semibold text-foreground">
              {getWorkTitle(pair.english, language)}
            </h3>
            <p className="mt-case-xs text-small text-text-muted">
              {getBookAuthorLine(pair.english)}
            </p>
            <div className="mt-case-md grid gap-case-sm">
              <PairChoiceLink language={language} record={pair.english} rules={rules} />
              <PairChoiceLink
                language={language}
                record={pair.vietnamese}
                rules={rules}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategorySpineRail({
  className,
  description,
  items,
  title,
}: {
  className?: string;
  description?: string;
  items: CategorySpineItem[];
  title: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("flex min-w-0 flex-col gap-case-md", className)}
      data-v14-merchandising-layout="category-spine-rail"
    >
      <MerchandisingSectionHeader description={description} title={title} />
      <div className="grid gap-case-sm sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.href}
            className={cn(
              "group grid min-h-36 min-w-0 grid-cols-[12px_minmax(0,1fr)] overflow-hidden rounded-md border bg-surface transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              getToneBorderClass(item.tone ?? "discovery"),
            )}
            href={item.href}
          >
            <span
              aria-hidden
              className={cn("block h-full", getToneBackgroundClass(item.tone ?? "discovery"))}
            />
            <span className="flex min-w-0 flex-col p-case-md">
              <span className="text-body font-semibold text-foreground">
                {item.label}
              </span>
              <span className="mt-case-xs line-clamp-3 text-small leading-6 text-text-muted">
                {item.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ReadingPathShelf({
  className,
  description,
  language,
  records,
  rules,
  title,
}: SharedMerchandisingProps &
  CurrencyProps & {
    records: SupabaseBookCatalogRecord[];
  }) {
  const pathRecords = records.slice(0, 4);

  if (pathRecords.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("rounded-lg border border-arrival/25 bg-arrival-muted p-case-lg", className)}
      data-v14-merchandising-layout="reading-path"
    >
      <MerchandisingSectionHeader description={description} title={title} />
      <ol className="mt-case-md grid gap-case-md md:grid-cols-2 xl:grid-cols-4">
        {pathRecords.map((record, index) => (
          <li key={record.edition.id} className="min-w-0">
            <Link
              className="group flex h-full min-w-0 flex-col gap-case-sm rounded-md bg-surface p-case-sm transition-colors hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              href={bookHref(record)}
            >
              <div className="flex items-center justify-between gap-case-sm">
                <Badge className="border-arrival bg-arrival-muted text-arrival">
                  {language === "vi" ? `Bước ${index + 1}` : `Step ${index + 1}`}
                </Badge>
                <span className="text-small text-text-muted">
                  {getEditionLanguageLabel(record.edition.language, language)}
                </span>
              </div>
              <BookCoverFrame
                className="mx-auto w-28"
                language={language}
                record={record}
                showBadges={false}
                size="shelf"
                sizes="130px"
              />
              <h3 className="line-clamp-2 font-semibold text-foreground">
                {getBookEditionTitle(record, language)}
              </h3>
              <CurrencyAmount
                amountVnd={record.edition.priceVnd}
                className="mt-auto text-small font-semibold text-primary"
                estimateClassName="text-text-muted"
                language={language}
                rules={rules}
                size="sm"
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CompactRetailTile({
  className,
  language,
  record,
  rules,
  tone = "discovery",
}: CurrencyProps & {
  className?: string;
  language: Language;
  record: SupabaseBookCatalogRecord;
  tone?: CategorySpineItem["tone"];
}) {
  return (
    <Link
      className={cn(
        "group grid min-w-0 grid-cols-[80px_minmax(0,1fr)] gap-case-sm rounded-md border bg-surface p-case-sm transition-colors hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:grid-cols-[96px_minmax(0,1fr)]",
        getToneBorderClass(tone),
        className,
      )}
      data-v14-merchandising-layout="compact-retail-tile"
      href={bookHref(record)}
    >
      <BookCoverFrame
        className="w-full"
        language={language}
        record={record}
        showBadges={false}
        size="compact"
        sizes="(min-width: 640px) 96px, 80px"
      />
      <div className="flex min-w-0 flex-col gap-case-xs">
        <div className="flex flex-wrap gap-case-xs">
          <Badge className={getToneBadgeClass(tone)}>
            {getEditionLanguageLabel(record.edition.language, language)}
          </Badge>
          <Badge variant="neutral">
            {getBookFormatLabel(record.edition.format, language)}
          </Badge>
        </div>
        <h3 className="line-clamp-2 font-semibold text-foreground">
          {getBookEditionTitle(record, language)}
        </h3>
        <p className="truncate text-small text-text-muted">
          {getBookAuthorLine(record)}
        </p>
        <CurrencyAmount
          amountVnd={record.edition.priceVnd}
          className="text-small font-semibold text-primary"
          estimateClassName="text-text-muted"
          language={language}
          rules={rules}
          size="sm"
        />
      </div>
    </Link>
  );
}

function PairChoiceLink({
  language,
  record,
  rules,
}: CurrencyProps & {
  language: Language;
  record: SupabaseBookCatalogRecord;
}) {
  return (
    <Link
      className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-case-sm rounded-md bg-surface p-case-sm transition-colors hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      href={bookHref(record)}
    >
      <BookCoverFrame
        className="w-full"
        language={language}
        record={record}
        showBadges={false}
        size="compact"
        sizes="72px"
      />
      <span className="flex min-w-0 flex-col gap-case-xs">
        <Badge className="border-translation bg-translation-muted text-translation">
          {getEditionLanguageLabel(record.edition.language, language)}
        </Badge>
        <span className="line-clamp-2 font-semibold text-foreground">
          {getBookEditionTitle(record, language)}
        </span>
        <CurrencyAmount
          amountVnd={record.edition.priceVnd}
          className="text-small font-semibold text-primary"
          estimateClassName="text-text-muted"
          language={language}
          rules={rules}
          size="sm"
        />
      </span>
    </Link>
  );
}

function bookHref(record: SupabaseBookCatalogRecord) {
  return `/products/${record.edition.slug}`;
}

function getWorkTitle(record: SupabaseBookCatalogRecord, language: Language) {
  return pickLocalizedText(record.work.localizedTitle, language, record.work.title);
}

function getToneBorderClass(tone: CategorySpineItem["tone"]) {
  const classes = {
    academic: "border-academic/25 hover:border-academic",
    arrival: "border-arrival/25 hover:border-arrival",
    discovery: "border-discovery/25 hover:border-discovery",
    editorial: "border-editorial/25 hover:border-editorial",
    translation: "border-translation/25 hover:border-translation",
  } satisfies Record<NonNullable<CategorySpineItem["tone"]>, string>;

  return classes[tone ?? "discovery"];
}

function getToneBackgroundClass(tone: CategorySpineItem["tone"]) {
  const classes = {
    academic: "bg-academic",
    arrival: "bg-arrival",
    discovery: "bg-discovery",
    editorial: "bg-editorial",
    translation: "bg-translation",
  } satisfies Record<NonNullable<CategorySpineItem["tone"]>, string>;

  return classes[tone ?? "discovery"];
}

function getToneBadgeClass(tone: CategorySpineItem["tone"]) {
  const classes = {
    academic: "border-academic bg-academic-muted text-academic",
    arrival: "border-arrival bg-arrival-muted text-arrival",
    discovery: "border-discovery bg-discovery-muted text-discovery",
    editorial: "border-editorial bg-editorial-muted text-editorial",
    translation: "border-translation bg-translation-muted text-translation",
  } satisfies Record<NonNullable<CategorySpineItem["tone"]>, string>;

  return classes[tone ?? "discovery"];
}
