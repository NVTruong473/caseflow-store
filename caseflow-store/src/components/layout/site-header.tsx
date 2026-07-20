import Link from "next/link";

import { Container } from "@/components/ui";
import { CartSummaryButton } from "@/features/cart";
import { getCustomerAuthState, type CustomerAuthState } from "@/lib/auth/customer";
import { pickLocalizedText, type Language } from "@/lib/i18n/language";
import { listSupabaseBookCategories } from "@/lib/repositories/supabase-books";
import type { BookCategory } from "@/types/domain";

import { LanguageSwitcher } from "./language-switcher";
import { MobileNavigation } from "./mobile-navigation";
import { getSiteNavigation } from "./navigation";

export type HeaderCatalogLink = {
  description: string;
  href: string;
  label: string;
};

const headerCopy = {
  en: {
    account: "Account",
    accountSignedIn: "My account",
    accountUnavailable: "Account",
    allCatalog: "All catalog",
    cart: "Cart",
    categoriesMenu: "Book categories",
    categoriesMenuDescription:
      "Browse the live catalog by reading category, language, format, and current availability.",
    contact: "Support",
    homeLabel: "CaseFlow Books home",
    mainNavigation: "Main navigation",
    searchLabel: "Search books",
    searchPlaceholder: "Search by title, author, or ISBN",
    searchSubmit: "Search",
    shipping: "Shipping policy",
    signedOut: "Signed out",
    subtitle: "Bilingual bookstore",
    support: "Support Mon-Sat, 09:00-18:00 ICT",
    switcher: "Language",
    switchToEnglish: "Switch to English",
    switchToVietnamese: "Switch to Vietnamese",
    trackOrder: "Track order",
  },
  vi: {
    account: "Tài khoản",
    accountSignedIn: "Tài khoản của tôi",
    accountUnavailable: "Tài khoản",
    allCatalog: "Tất cả catalog",
    cart: "Giỏ hàng",
    categoriesMenu: "Danh mục sách",
    categoriesMenuDescription:
      "Duyệt catalog thật theo danh mục đọc, ngôn ngữ, định dạng và tình trạng còn hàng.",
    contact: "Hỗ trợ",
    homeLabel: "Trang chủ CaseFlow Books",
    mainNavigation: "Điều hướng chính",
    searchLabel: "Tìm sách",
    searchPlaceholder: "Tìm theo tên sách, tác giả hoặc ISBN",
    searchSubmit: "Tìm",
    shipping: "Chính sách giao hàng",
    signedOut: "Chưa đăng nhập",
    subtitle: "Nhà sách song ngữ",
    support: "Hỗ trợ Thứ 2-Thứ 7, 09:00-18:00 ICT",
    switcher: "Ngôn ngữ",
    switchToEnglish: "Chuyển sang tiếng Anh",
    switchToVietnamese: "Chuyển sang tiếng Việt",
    trackOrder: "Tra cứu đơn",
  },
} as const;

export async function SiteHeader({ language }: { language: Language }) {
  const copy = headerCopy[language];
  const navigation = getSiteNavigation(language);
  const [authState, categories] = await Promise.all([
    getCustomerAuthState(),
    listSupabaseBookCategories().catch(() => [] as BookCategory[]),
  ]);
  const accountSummary = getAccountSummary(authState, language);
  const catalogLinks = getHeaderCatalogLinks(categories, language);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="hidden border-b border-border/70 bg-surface-muted/70 md:block">
        <Container className="flex min-h-9 items-center justify-between gap-case-md text-small text-text-muted">
          <p>{copy.support}</p>
          <nav
            aria-label={language === "vi" ? "Liên kết hỗ trợ nhanh" : "Quick support links"}
            className="flex items-center gap-case-md"
          >
            <Link className="hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/orders/track">
              {copy.trackOrder}
            </Link>
            <Link className="hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/shipping">
              {copy.shipping}
            </Link>
            <Link className="hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/contact">
              {copy.contact}
            </Link>
          </nav>
        </Container>
      </div>

      <Container className="relative grid min-h-16 items-center gap-case-sm py-case-sm lg:grid-cols-[240px_minmax(280px,1fr)_auto]">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-case-sm rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:min-w-[210px]"
          aria-label={copy.homeLabel}
          data-site-header-brand
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-small font-semibold text-surface shadow-[var(--case-shadow-cover)] transition-colors group-hover:bg-primary-hover">
            CB
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="whitespace-nowrap text-body font-semibold text-foreground">
              CaseFlow Books
            </span>
            <span className="hidden text-small text-text-muted sm:block">
              {copy.subtitle}
            </span>
          </span>
        </Link>

        <form
          action="/catalog"
          className="hidden min-w-0 items-center rounded-lg border border-border bg-surface p-1 transition-colors focus-within:border-primary md:flex"
          role="search"
          data-storefront-search
        >
          <label className="sr-only" htmlFor="site-search">
            {copy.searchLabel}
          </label>
          <input
            className="min-h-10 min-w-0 flex-1 bg-transparent px-3 text-body text-foreground placeholder:text-text-muted focus:outline-none"
            id="site-search"
            name="q"
            placeholder={copy.searchPlaceholder}
            type="search"
          />
          <button
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-small font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="submit"
          >
            {copy.searchSubmit}
          </button>
        </form>

        <div className="hidden items-center justify-end gap-case-sm lg:flex">
          <Link
            href="/account"
            className="inline-flex min-h-10 max-w-52 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-small font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            data-customer-auth-header
            data-customer-auth-state={accountSummary.state}
            aria-label={accountSummary.ariaLabel}
          >
            <span className="truncate">{accountSummary.label}</span>
          </Link>
          <LanguageSwitcher
            language={language}
            labels={{
              switcher: copy.switcher,
              english: copy.switchToEnglish,
              vietnamese: copy.switchToVietnamese,
            }}
          />
          <CartSummaryButton label={copy.cart} />
        </div>

        <MobileNavigation
          language={language}
          account={accountSummary}
          catalogLinks={catalogLinks}
        />
      </Container>

      <Container className="hidden min-h-11 items-center gap-case-lg border-t border-border/70 py-1 xl:flex">
        <details className="group relative">
          <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded-md border border-border bg-surface px-3 py-2 text-small font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
            {copy.categoriesMenu}
          </summary>
          <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[760px] rounded-lg border border-border bg-surface p-case-lg shadow-[var(--case-shadow-soft)]">
            <div className="grid gap-case-lg lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="border-l-4 border-primary pl-case-md">
                <h2 className="text-heading-3 font-semibold text-foreground">
                  {copy.categoriesMenu}
                </h2>
                <p className="mt-case-xs text-small leading-6 text-text-muted">
                  {copy.categoriesMenuDescription}
                </p>
                <Link
                  className="mt-case-md inline-flex min-h-9 items-center rounded-md bg-primary px-3 text-small font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  href="/catalog"
                >
                  {copy.allCatalog}
                </Link>
              </div>
              <div className="grid gap-case-sm sm:grid-cols-2">
                {catalogLinks.map((item) => (
                  <Link
                    key={item.href}
                    className="group/link min-w-0 rounded-md border border-border bg-background p-case-sm transition-colors hover:border-primary hover:bg-discovery-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    href={item.href}
                  >
                    <span className="block font-semibold text-foreground group-hover/link:text-primary">
                      {item.label}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-small leading-5 text-text-muted">
                      {item.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </details>

        <nav
          className="flex min-w-0 flex-1 items-center gap-case-sm"
          aria-label={copy.mainNavigation}
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-small font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}

function getAccountSummary(authState: CustomerAuthState, language: Language) {
  const copy = headerCopy[language];

  if (authState.status === "authenticated") {
    return {
      ariaLabel: `${copy.accountSignedIn}: ${authState.user.displayName}`,
      description: authState.user.email,
      href: "/account",
      label: copy.accountSignedIn,
      state: "signed-in",
    };
  }

  if (authState.status === "error") {
    return {
      ariaLabel: copy.accountUnavailable,
      description: copy.accountUnavailable,
      href: "/account",
      label: copy.account,
      state: "error",
    };
  }

  return {
    ariaLabel: copy.account,
    description: copy.signedOut,
    href: "/account",
    label: copy.account,
    state: "signed-out",
  };
}

function getHeaderCatalogLinks(
  categories: BookCategory[],
  language: Language,
): HeaderCatalogLink[] {
  return categories
    .filter((category) => category.isActive)
    .slice(0, 8)
    .map((category) => ({
      description: pickLocalizedText(category.description, language),
      href: `/catalog?category=${category.slug}`,
      label: pickLocalizedText(category.labels, language),
    }));
}
