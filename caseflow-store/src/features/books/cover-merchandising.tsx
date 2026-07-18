import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui";
import {
  getEditionLanguageLabel,
  pickLocalizedText,
  type Language,
} from "@/lib/i18n/language";
import type { SupabaseBookCatalogRecord } from "@/lib/repositories/supabase-books";
import { cn } from "@/lib/utils/cn";
import type { BookFormat } from "@/types/domain";

const DEFAULT_COVER_PATH = "/images/books/placeholders/book-cover-placeholder.svg";

const coverSizeClasses = {
  compact: "w-20 sm:w-24",
  hero: "w-28 sm:w-36 md:w-44",
  shelf: "w-28 sm:w-32",
} as const;

const stackPositionClasses = [
  "left-1/2 z-30 w-[42%] -translate-x-1/2 rotate-0",
  "left-[14%] z-20 w-[36%] -rotate-6 sm:left-[17%]",
  "right-[10%] z-10 w-[34%] rotate-6 sm:right-[12%]",
] as const;

type CoverSize = keyof typeof coverSizeClasses;

type BookCoverFrameProps = {
  className?: string;
  imageClassName?: string;
  language: Language;
  priority?: boolean;
  record: SupabaseBookCatalogRecord;
  showBadges?: boolean;
  sizes?: string;
  size?: CoverSize;
};

type BookCoverStackProps = {
  className?: string;
  language: Language;
  limit?: number;
  records: SupabaseBookCatalogRecord[];
};

type BookCoverShelfProps = {
  className?: string;
  itemClassName?: string;
  language: Language;
  limit?: number;
  records: SupabaseBookCatalogRecord[];
  showMeta?: boolean;
};

export function BookCoverFrame({
  className,
  imageClassName,
  language,
  priority = false,
  record,
  showBadges = true,
  sizes,
  size = "shelf",
}: BookCoverFrameProps) {
  const title = getBookEditionTitle(record, language);
  const coverPath = getBookCoverPath(record);
  const languageLabel = getEditionLanguageLabel(record.edition.language, language);

  return (
    <figure
      className={cn("min-w-0", coverSizeClasses[size], className)}
      data-v13-cover-frame
      data-v13-cover-source={record.coverAsset?.source ?? "missing"}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-paper-deep shadow-[var(--case-shadow-cover)]">
        <Image
          alt={getBookCoverAlt(record, language)}
          className={cn("object-cover", imageClassName)}
          fill
          priority={priority}
          sizes={sizes ?? "(max-width: 768px) 35vw, 180px"}
          src={coverPath}
        />
      </div>
      {showBadges ? (
        <figcaption className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
          <Badge className="bg-discovery-muted text-discovery" variant="primary">
            {languageLabel}
          </Badge>
          <Badge className="bg-offer-muted text-offer" variant="warning">
            {getBookFormatLabel(record.edition.format, language)}
          </Badge>
          <span className="sr-only">{title}</span>
        </figcaption>
      ) : (
        <figcaption className="sr-only">{title}</figcaption>
      )}
    </figure>
  );
}

export function BookCoverStack({
  className,
  language,
  limit = 3,
  records,
}: BookCoverStackProps) {
  const coverRecords = dedupeRecordsByCover(records).slice(0, limit);

  if (coverRecords.length === 0) {
    return null;
  }

  return (
    <div
      aria-label={
        language === "vi" ? "Cụm bìa sách nổi bật" : "Featured book cover stack"
      }
      className={cn(
        "relative min-h-[210px] w-full max-w-[390px] sm:min-h-[280px]",
        className,
      )}
      data-v13-cover-stack
    >
      {coverRecords.map((record, index) => (
        <BookCoverFrame
          key={record.edition.id}
          className={cn(
            "absolute bottom-0 origin-bottom transition-transform duration-300 hover:z-40 hover:-translate-y-1",
            stackPositionClasses[index] ?? stackPositionClasses[0],
          )}
          language={language}
          priority={index === 0}
          record={record}
          showBadges={false}
          size="hero"
        />
      ))}
    </div>
  );
}

export function BookCoverShelf({
  className,
  itemClassName,
  language,
  limit = 4,
  records,
  showMeta = true,
}: BookCoverShelfProps) {
  const coverRecords = dedupeRecordsByCover(records).slice(0, limit);

  if (coverRecords.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-5",
        className,
      )}
      data-v13-cover-shelf
    >
      {coverRecords.map((record, index) => (
        <Link
          key={record.edition.id}
          className={cn(
            "group min-w-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
            itemClassName,
          )}
          href={`/products/${record.edition.slug}`}
        >
          <BookCoverFrame
            className="w-full"
            imageClassName="transition duration-300 group-hover:scale-[1.025]"
            language={language}
            priority={index === 0}
            record={record}
            size="shelf"
          />
          {showMeta ? (
            <div className="mt-3 min-w-0">
              <p className="line-clamp-2 text-small font-semibold leading-5 text-foreground">
                {getBookEditionTitle(record, language)}
              </p>
              <p className="mt-1 truncate text-small text-text-muted">
                {getBookAuthorLine(record) ??
                  (language === "vi" ? "Tác giả đang cập nhật" : "Author pending")}
              </p>
            </div>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function getBookEditionTitle(
  record: SupabaseBookCatalogRecord,
  language: Language,
) {
  return pickLocalizedText(
    record.edition.localizedDisplayTitle,
    language,
    record.edition.displayTitle,
  );
}

export function getBookCoverAlt(
  record: SupabaseBookCatalogRecord,
  language: Language,
) {
  return pickLocalizedText(
    record.coverAsset?.altText,
    language,
    `${getBookEditionTitle(record, language)} cover`,
  );
}

export function getBookCoverPath(record: SupabaseBookCatalogRecord) {
  const coverPath = record.coverAsset?.path;

  return coverPath?.startsWith("/images/books/") ? coverPath : DEFAULT_COVER_PATH;
}

export function getBookAuthorLine(record: SupabaseBookCatalogRecord) {
  const authors = record.authors.map((author) => author.name).filter(Boolean);

  return authors.length > 0 ? authors.join(", ") : null;
}

export function getBookFormatLabel(format: BookFormat, language: Language) {
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

function dedupeRecordsByCover(records: SupabaseBookCatalogRecord[]) {
  const seen = new Set<string>();
  const deduped: SupabaseBookCatalogRecord[] = [];

  for (const record of records) {
    const key = getBookCoverPath(record);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(record);
  }

  return deduped;
}
