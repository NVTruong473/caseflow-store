"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { useCart } from "@/features/cart";
import { formatVnd } from "@/lib/format/currency";
import type { Language } from "@/lib/i18n/language";
import type { BookCatalogApiItem } from "@/lib/api/book-catalog";
import type { BookCategorySlug, BookFormat, EditionLanguage } from "@/types/domain";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: { total?: number } | null;
};

type AssistantAction =
  | {
      href: string;
      label: string;
      type: "link";
    }
  | {
      label: string;
      type: "open-cart";
    };

type AssistantMessage = {
  actions?: AssistantAction[];
  id: string;
  results?: BookCatalogApiItem[];
  role: "assistant" | "user";
  text: string;
};

type CatalogIntent = {
  catalogHref: string;
  description: string;
  params: URLSearchParams;
  type: "catalog";
};

type CheckoutIntent = {
  type: "checkout";
};

type AssistantIntent = CatalogIntent | CheckoutIntent;

const assistantCopy = {
  en: {
    assistant: "Book assistant",
    close: "Close assistant",
    error:
      "I could not read the catalog right now. Please open the catalog and try again.",
    inputLabel: "Ask the bookstore assistant",
    inputPlaceholder: "Try: English paperback under 200k",
    noResults:
      "I did not find a matching edition. Try a broader title, author, category, language, or price filter.",
    open: "Open assistant",
    openCart: "Open cart",
    openCatalog: "Open catalog results",
    openCheckout: "Go to checkout",
    openAccount: "Sign in or complete account",
    resultIntro: (count: number, description: string) =>
      `I found ${count} matching edition${count === 1 ? "" : "s"} for ${description}.`,
    send: "Send",
    suggestions: [
      "Find Pride and Prejudice",
      "English paperback under 200k",
      "Classic literature in Vietnamese",
      "How do I checkout?",
    ],
    title: "CaseFlow Books assistant",
    viewBook: "View book",
    welcome:
      "Ask for a title, author, category, language, format, price range, or buying steps. I will guide you through the current bookstore catalog.",
    checkout:
      "To buy: add an edition to cart, open the cart, sign in or complete your account profile, then confirm shipping and payment at checkout. The store checks your account, cart, and total before confirming the order.",
  },
  vi: {
    assistant: "Trợ lý nhà sách",
    close: "Đóng trợ lý",
    error:
      "Hiện tôi chưa đọc được catalog. Hãy mở catalog và thử lại sau.",
    inputLabel: "Hỏi trợ lý nhà sách",
    inputPlaceholder: "Ví dụ: Sách tiếng Anh bìa mềm dưới 200k",
    noResults:
      "Tôi chưa tìm thấy ấn bản phù hợp. Hãy thử tên sách, tác giả, danh mục, ngôn ngữ hoặc khoảng giá rộng hơn.",
    open: "Mở trợ lý",
    openCart: "Mở giỏ hàng",
    openCatalog: "Mở kết quả catalog",
    openCheckout: "Đến checkout",
    openAccount: "Đăng nhập hoặc hoàn tất tài khoản",
    resultIntro: (count: number, description: string) =>
      `Tôi tìm thấy ${count} ấn bản phù hợp với ${description}.`,
    send: "Gửi",
    suggestions: [
      "Tìm Pride and Prejudice",
      "Sách tiếng Anh bìa mềm dưới 200k",
      "Văn học kinh điển tiếng Việt",
      "Làm sao để thanh toán?",
    ],
    title: "Trợ lý CaseFlow Books",
    viewBook: "Xem sách",
    welcome:
      "Bạn có thể hỏi theo tên sách, tác giả, danh mục, ngôn ngữ, định dạng, khoảng giá hoặc các bước mua hàng. Tôi sẽ hướng dẫn theo catalog hiện có của nhà sách.",
    checkout:
      "Để mua sách: thêm đúng ấn bản vào giỏ, mở giỏ hàng, đăng nhập hoặc hoàn tất hồ sơ, rồi xác nhận giao hàng và thanh toán ở checkout. Nhà sách sẽ kiểm tra tài khoản, giỏ hàng và tổng tiền trước khi xác nhận đơn.",
  },
} as const;

const categoryRules: Array<{
  keywords: string[];
  slug: BookCategorySlug;
}> = [
  {
    slug: "classic-literature",
    keywords: ["classic", "classics", "literature", "kinh dien", "van hoc"],
  },
  {
    slug: "mystery-thriller",
    keywords: ["mystery", "thriller", "crime", "trinh tham", "bi an"],
  },
  {
    slug: "fantasy-sci-fi",
    keywords: ["fantasy", "sci fi", "science fiction", "vien tuong", "gia tuong"],
  },
  {
    slug: "romance",
    keywords: ["romance", "love story", "lang man", "tinh cam"],
  },
  {
    slug: "business-economics",
    keywords: ["business", "economics", "startup", "kinh doanh", "kinh te"],
  },
  {
    slug: "self-development",
    keywords: ["self development", "self help", "phat trien ban than", "ky nang"],
  },
  {
    slug: "children-young-adult",
    keywords: ["children", "young adult", "kids", "thieu nhi", "tuoi teen"],
  },
  {
    slug: "language-learning",
    keywords: ["language learning", "hoc ngoai ngu", "ngoai ngu"],
  },
  {
    slug: "vietnamese-books",
    keywords: ["vietnamese books", "sach tieng viet", "ban dich"],
  },
  {
    slug: "english-books",
    keywords: ["english books", "sach tieng anh", "ban goc"],
  },
];

const formatRules: Array<{
  format: BookFormat;
  keywords: string[];
}> = [
  {
    format: "paperback",
    keywords: ["paperback", "softcover", "bia mem"],
  },
  {
    format: "hardcover",
    keywords: ["hardcover", "hardback", "bia cung"],
  },
  {
    format: "box-set",
    keywords: ["box set", "boxset", "combo", "tron bo"],
  },
  {
    format: "special-edition",
    keywords: ["special edition", "collector", "dac biet"],
  },
];

export function BookstoreAssistant({ language }: { language: Language }) {
  const pathname = usePathname();
  const copy = assistantCopy[language];
  const { openCart, totalQuantity } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: copy.welcome,
    },
  ]);
  const isFormOrOperationsRoute =
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout");

  if (isFormOrOperationsRoute) {
    return null;
  }

  async function submitPrompt(prompt: string) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isLoading) {
      return;
    }

    setInput("");
    setIsOpen(true);
    setIsLoading(true);
    setMessages((current) => [
      ...current,
      {
        id: createMessageId("user"),
        role: "user",
        text: trimmedPrompt,
      },
    ]);

    const assistantMessage = await createAssistantReply({
      language,
      prompt: trimmedPrompt,
      totalQuantity,
    });

    setMessages((current) => [...current, assistantMessage]);
    setIsLoading(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitPrompt(input);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50" data-book-assistant-root>
      {isOpen ? (
        <section
          className="mb-case-sm flex max-h-[min(680px,calc(100vh-120px))] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-lg border border-trust/25 bg-surface shadow-xl"
          aria-label={copy.assistant}
          data-book-assistant-panel
        >
          <header className="flex items-center justify-between gap-case-sm border-b border-border px-case-md py-case-sm">
            <div className="min-w-0">
              <p className="text-small font-semibold uppercase tracking-normal text-primary">
                {copy.assistant}
              </p>
              <h2 className="truncate text-body font-semibold text-foreground">
                {copy.title}
              </h2>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-heading-3 leading-none text-foreground hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={copy.close}
              onClick={() => setIsOpen(false)}
              data-book-assistant-close
            >
              x
            </button>
          </header>

          <div
            className="flex min-h-0 flex-1 flex-col gap-case-sm overflow-y-auto bg-background p-case-md"
            data-book-assistant-messages
          >
            {messages.map((message) => (
              <AssistantBubble
                key={message.id}
                copy={{
                  openCart: copy.openCart,
                  viewBook: copy.viewBook,
                }}
                message={message}
                onOpenCart={openCart}
              />
            ))}
            {isLoading ? (
              <p
                className="w-fit max-w-[85%] rounded-md border border-border bg-surface px-3 py-2 text-small text-text-muted"
                data-book-assistant-loading
              >
                {language === "vi" ? "Đang tìm trong catalog..." : "Searching catalog..."}
              </p>
            ) : null}
          </div>

          <div className="border-t border-border bg-surface p-case-md">
            <div className="mb-case-sm flex flex-wrap gap-case-xs">
              {copy.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-md border border-border bg-background px-2 py-1 text-small text-foreground hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => void submitPrompt(suggestion)}
                  data-book-assistant-suggestion={suggestion}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form className="grid gap-case-sm" onSubmit={handleSubmit}>
              <label
                htmlFor="book-assistant-input"
                className="text-small font-medium text-foreground"
              >
                {copy.inputLabel}
              </label>
              <div className="grid gap-case-sm sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  id="book-assistant-input"
                  className="min-h-11 rounded-md border border-border bg-background px-3 py-2 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  value={input}
                  placeholder={copy.inputPlaceholder}
                  onChange={(event) => setInput(event.currentTarget.value)}
                  data-book-assistant-input
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-body font-semibold text-surface hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading || input.trim().length === 0}
                  data-book-assistant-send
                >
                  {copy.send}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary px-0 py-2 text-body font-semibold text-surface shadow-lg hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto sm:rounded-md sm:px-4"
        aria-expanded={isOpen}
        aria-controls="book-assistant-input"
        onClick={() => setIsOpen((value) => !value)}
        data-book-assistant-toggle
      >
        <span className="sm:hidden" aria-hidden="true">
          ?
        </span>
        <span className="sr-only sm:not-sr-only">
          {isOpen ? copy.close : copy.open}
        </span>
      </button>
    </div>
  );
}

function AssistantBubble({
  copy,
  message,
  onOpenCart,
}: {
  copy: { openCart: string; viewBook: string };
  message: AssistantMessage;
  onOpenCart: () => void;
}) {
  const isAssistant = message.role === "assistant";

  return (
    <article
      className={[
        "max-w-[92%] rounded-md border px-3 py-2 text-small leading-6",
        isAssistant
          ? "self-start border-border bg-surface text-foreground"
          : "self-end border-primary bg-primary text-surface",
      ].join(" ")}
      data-book-assistant-message={message.role}
    >
      <p>{message.text}</p>

      {message.results && message.results.length > 0 ? (
        <ul className="mt-case-sm grid gap-case-xs" data-book-assistant-results>
          {message.results.map((result) => (
            <li
              key={result.id}
              className="rounded-md border border-border bg-background p-2"
              data-book-assistant-result={result.slug}
            >
              <p className="font-semibold text-foreground">{result.title}</p>
              <p className="text-text-muted">
                {result.authors.map((author) => author.name).join(", ")} ·{" "}
                {formatVnd(result.edition.priceVnd)}
              </p>
              <Link
                href={`/products/${result.slug}`}
                className="mt-1 inline-flex rounded-md text-small font-semibold text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                data-book-assistant-result-link={result.slug}
              >
                {copy.viewBook}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {message.actions && message.actions.length > 0 ? (
        <div className="mt-case-sm flex flex-wrap gap-case-xs">
          {message.actions.map((action) =>
            action.type === "link" ? (
              <Link
                key={`${action.type}-${action.label}-${action.href}`}
                href={action.href}
                className="inline-flex min-h-9 items-center rounded-md border border-border bg-surface px-2 py-1 text-small font-semibold text-primary hover:border-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                data-book-assistant-action={action.href}
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={`${action.type}-${action.label}`}
                type="button"
                className="inline-flex min-h-9 items-center rounded-md border border-border bg-surface px-2 py-1 text-small font-semibold text-primary hover:border-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={onOpenCart}
                data-book-assistant-open-cart
              >
                {action.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </article>
  );
}

async function createAssistantReply({
  language,
  prompt,
  totalQuantity,
}: {
  language: Language;
  prompt: string;
  totalQuantity: number;
}): Promise<AssistantMessage> {
  const copy = assistantCopy[language];
  const intent = parseAssistantIntent(prompt, language);

  if (intent.type === "checkout") {
    return {
      actions: [
        { label: copy.openCart, type: "open-cart" },
        { href: "/account?next=/checkout", label: copy.openAccount, type: "link" },
        { href: "/checkout", label: copy.openCheckout, type: "link" },
      ],
      id: createMessageId("assistant"),
      role: "assistant",
      text:
        totalQuantity > 0
          ? copy.checkout
          : `${copy.checkout} ${
              language === "vi"
                ? "Hiện giỏ hàng đang trống, hãy mở trang chi tiết sách trước."
                : "Your cart is empty, so start from a book detail page first."
            }`,
    };
  }

  try {
    const catalog = await fetchCatalog(intent.params);
    const results = catalog.items.slice(0, 3);

    if (results.length === 0) {
      return {
        actions: [
          { href: intent.catalogHref, label: copy.openCatalog, type: "link" },
          { href: "/catalog?category=classic-literature", label: "Classics", type: "link" },
          { href: "/catalog?language=en", label: "English", type: "link" },
        ],
        id: createMessageId("assistant"),
        role: "assistant",
        text: copy.noResults,
      };
    }

    return {
      actions: [
        {
          href: `/products/${results[0].slug}`,
          label: copy.viewBook,
          type: "link",
        },
        { href: intent.catalogHref, label: copy.openCatalog, type: "link" },
      ],
      id: createMessageId("assistant"),
      results,
      role: "assistant",
      text: copy.resultIntro(catalog.total, intent.description),
    };
  } catch {
    return {
      actions: [{ href: "/catalog", label: copy.openCatalog, type: "link" }],
      id: createMessageId("assistant"),
      role: "assistant",
      text: copy.error,
    };
  }
}

async function fetchCatalog(params: URLSearchParams) {
  const url = new URL("/api/products", window.location.origin);

  params.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  url.searchParams.set("availability", "available");
  url.searchParams.set("limit", "3");
  url.searchParams.set("offset", "0");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Catalog request failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogApiItem[]>;

  return {
    items: payload.data ?? [],
    total: payload.meta?.total ?? payload.data?.length ?? 0,
  };
}

function parseAssistantIntent(prompt: string, language: Language): AssistantIntent {
  const folded = foldText(prompt);

  if (isCheckoutPrompt(folded)) {
    return { type: "checkout" };
  }

  const params = new URLSearchParams();
  const category = detectCategory(folded);
  const editionLanguage = detectEditionLanguage(folded);
  const format = detectFormat(folded);
  const priceRange = detectPriceRange(folded);
  const structured = Boolean(category || editionLanguage || format || priceRange);
  const searchText = extractSearchText(prompt, structured);

  if (category) {
    params.set("category", category);
  }

  if (editionLanguage) {
    params.set("language", editionLanguage);
  }

  if (format) {
    params.set("format", format);
  }

  if (priceRange?.minPriceVnd !== undefined) {
    params.set("minPriceVnd", priceRange.minPriceVnd.toString());
  }

  if (priceRange?.maxPriceVnd !== undefined) {
    params.set("maxPriceVnd", priceRange.maxPriceVnd.toString());
  }

  if (searchText) {
    params.set("q", searchText);
  }

  const query = params.toString();
  const catalogHref = query ? `/catalog?${query}` : "/catalog";

  return {
    catalogHref,
    description: describeIntent({
      category,
      format,
      language,
      priceRange,
      searchText,
      editionLanguage,
    }),
    params,
    type: "catalog",
  };
}

function isCheckoutPrompt(folded: string) {
  return [
    "checkout",
    "buy",
    "purchase",
    "payment",
    "pay",
    "cart",
    "thanh toan",
    "mua",
    "dat hang",
    "gio hang",
  ].some((keyword) => folded.includes(keyword));
}

function detectCategory(folded: string) {
  return categoryRules.find((rule) =>
    rule.keywords.some((keyword) => folded.includes(keyword)),
  )?.slug;
}

function detectEditionLanguage(folded: string): EditionLanguage | null {
  if (
    ["english", "tieng anh", "ban goc", "original"].some((keyword) =>
      folded.includes(keyword),
    )
  ) {
    return "en";
  }

  if (
    ["vietnamese", "tieng viet", "ban dich", "dich"].some((keyword) =>
      folded.includes(keyword),
    )
  ) {
    return "vi";
  }

  return null;
}

function detectFormat(folded: string) {
  return formatRules.find((rule) =>
    rule.keywords.some((keyword) => folded.includes(keyword)),
  )?.format;
}

function detectPriceRange(folded: string) {
  const rangeMatch = folded.match(
    /(?:from|tu)?\s*(\d+(?:[.,]\d+)?)\s*(?:k|nghin|000)?\s*(?:-|to|den)\s*(\d+(?:[.,]\d+)?)\s*(?:k|nghin|000)?/,
  );

  if (rangeMatch) {
    return {
      minPriceVnd: normalizePrice(rangeMatch[1]),
      maxPriceVnd: normalizePrice(rangeMatch[2]),
    };
  }

  const maxMatch = folded.match(
    /(?:under|below|less than|duoi|toi da|<=|<)\s*(\d+(?:[.,]\d+)?)\s*(?:k|nghin|000)?/,
  );

  if (maxMatch) {
    return { maxPriceVnd: normalizePrice(maxMatch[1]) };
  }

  const minMatch = folded.match(
    /(?:over|above|more than|tren|tu|>=|>)\s*(\d+(?:[.,]\d+)?)\s*(?:k|nghin|000)?/,
  );

  if (minMatch) {
    return { minPriceVnd: normalizePrice(minMatch[1]) };
  }

  return null;
}

function normalizePrice(value: string) {
  const numeric = Number(value.replace(",", "."));

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.round(numeric < 1000 ? numeric * 1000 : numeric);
}

function extractSearchText(prompt: string, hasStructuredFilters: boolean) {
  const trimmed = prompt.trim();
  const quoted = trimmed.match(/["“”']([^"“”']{2,})["“”']/);

  if (quoted?.[1]) {
    return quoted[1].trim();
  }

  const direct = trimmed.match(
    /^(?:find|search for|search|look for|show me|tim|tìm|tim sach|tìm sách)\s+(.+)$/i,
  );

  if (direct?.[1]) {
    return cleanSearchText(direct[1], hasStructuredFilters);
  }

  return hasStructuredFilters ? null : cleanSearchText(trimmed, false);
}

function cleanSearchText(value: string, hasStructuredFilters: boolean) {
  const cleaned = value
    .replace(/\b(book|books|sach|sách|edition|editions|ấn bản|an ban)\b/gi, " ")
    .replace(/\b(under|below|less than|duoi|dưới|paperback|hardcover)\b.*$/i, " ")
    .trim();

  if (hasStructuredFilters && wordCount(cleaned) <= 2) {
    return null;
  }

  return cleaned.length >= 2 ? cleaned : null;
}

function describeIntent({
  category,
  editionLanguage,
  format,
  language,
  priceRange,
  searchText,
}: {
  category: BookCategorySlug | undefined;
  editionLanguage: EditionLanguage | null;
  format: BookFormat | undefined;
  language: Language;
  priceRange: { maxPriceVnd?: number; minPriceVnd?: number } | null;
  searchText: string | null;
}) {
  const parts: string[] = [];

  if (searchText) {
    parts.push(language === "vi" ? `từ khóa "${searchText}"` : `"${searchText}"`);
  }

  if (category) {
    parts.push(category.replaceAll("-", " "));
  }

  if (editionLanguage) {
    parts.push(
      language === "vi"
        ? editionLanguage === "vi"
          ? "tiếng Việt"
          : "tiếng Anh"
        : editionLanguage === "vi"
          ? "Vietnamese"
          : "English",
    );
  }

  if (format) {
    parts.push(format.replaceAll("-", " "));
  }

  if (priceRange?.minPriceVnd !== undefined || priceRange?.maxPriceVnd !== undefined) {
    const min = priceRange.minPriceVnd;
    const max = priceRange.maxPriceVnd;

    if (min !== undefined && max !== undefined) {
      parts.push(`${formatVnd(min)}-${formatVnd(max)}`);
    } else if (max !== undefined) {
      parts.push(language === "vi" ? `dưới ${formatVnd(max)}` : `under ${formatVnd(max)}`);
    } else if (min !== undefined) {
      parts.push(language === "vi" ? `trên ${formatVnd(min)}` : `over ${formatVnd(min)}`);
    }
  }

  if (parts.length === 0) {
    return language === "vi" ? "catalog hiện có" : "the current catalog";
  }

  return parts.join(", ");
}

function wordCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function foldText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}<>=., -]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
