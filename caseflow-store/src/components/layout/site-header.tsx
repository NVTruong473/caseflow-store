import Link from "next/link";

import { Container } from "@/components/ui";
import { CartSummaryButton } from "@/features/cart";
import { getCustomerAuthState, type CustomerAuthState } from "@/lib/auth/customer";
import type { Language } from "@/lib/i18n/language";

import { LanguageSwitcher } from "./language-switcher";
import { MobileNavigation } from "./mobile-navigation";
import { getSiteNavigation } from "./navigation";

const headerCopy = {
  en: {
    homeLabel: "CaseFlow Books home",
    subtitle: "Bilingual bookstore",
    mainNavigation: "Main navigation",
    cart: "Cart",
    account: "Account",
    accountSignedIn: "Signed in",
    accountUnavailable: "Account",
    signedOut: "Signed out",
    switcher: "Language",
    switchToEnglish: "Switch to English",
    switchToVietnamese: "Switch to Vietnamese",
  },
  vi: {
    homeLabel: "Trang chủ CaseFlow Books",
    subtitle: "Nhà sách song ngữ",
    mainNavigation: "Điều hướng chính",
    cart: "Giỏ hàng",
    account: "Tài khoản",
    accountSignedIn: "Đã đăng nhập",
    accountUnavailable: "Tài khoản",
    signedOut: "Chưa đăng nhập",
    switcher: "Ngôn ngữ",
    switchToEnglish: "Chuyển sang tiếng Anh",
    switchToVietnamese: "Chuyển sang tiếng Việt",
  },
} as const;

export async function SiteHeader({ language }: { language: Language }) {
  const copy = headerCopy[language];
  const navigation = getSiteNavigation(language);
  const authState = await getCustomerAuthState();
  const accountSummary = getAccountSummary(authState, language);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <Container className="relative flex min-h-16 items-center justify-between gap-case-md py-case-sm">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-case-sm rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:min-w-[190px]"
          aria-label={copy.homeLabel}
          data-site-header-brand
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-small font-semibold text-surface">
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

        <nav
          className="hidden items-center gap-case-sm xl:flex"
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

        <div className="hidden items-center gap-case-sm lg:flex">
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

        <MobileNavigation language={language} account={accountSummary} />
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
