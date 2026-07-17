"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui";
import { CartSummaryButton } from "@/features/cart";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";

import { LanguageSwitcher } from "./language-switcher";
import { getDiscoveryNavigation, getSiteNavigation } from "./navigation";

type MobileAccountSummary = {
  ariaLabel: string;
  description: string;
  href: string;
  label: string;
  state: string;
};

const mobileNavigationCopy = {
  en: {
    cart: "Cart",
    account: "Account",
    close: "Close",
    closeMenu: "Close navigation menu",
    menu: "Menu",
    mobileNavigation: "Mobile navigation",
    openMenu: "Open navigation menu",
    discovery: "Discovery",
    switcher: "Language",
    switchToEnglish: "Switch to English",
    switchToVietnamese: "Switch to Vietnamese",
  },
  vi: {
    cart: "Giỏ hàng",
    account: "Tài khoản",
    close: "Đóng",
    closeMenu: "Đóng menu điều hướng",
    menu: "Menu",
    mobileNavigation: "Điều hướng di động",
    openMenu: "Mở menu điều hướng",
    discovery: "Khám phá",
    switcher: "Ngôn ngữ",
    switchToEnglish: "Chuyển sang tiếng Anh",
    switchToVietnamese: "Chuyển sang tiếng Việt",
  },
} as const;

export function MobileNavigation({
  account,
  language,
}: {
  account: MobileAccountSummary;
  language: Language;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const copy = mobileNavigationCopy[language];
  const navigation = getSiteNavigation(language);
  const discoveryNavigation = getDiscoveryNavigation(language);

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? copy.closeMenu : copy.openMenu}
        onClick={() => setIsOpen((current) => !current)}
        data-mobile-navigation-toggle
      >
        {isOpen ? copy.close : copy.menu}
      </Button>

      <div
        id="mobile-navigation"
        className={cn(
          "absolute inset-x-0 top-full border-b border-border bg-surface shadow-sm",
          isOpen ? "block" : "hidden",
        )}
      >
        <nav aria-label={copy.mobileNavigation} className="mx-auto max-w-6xl px-4">
          <ul className="flex flex-col py-case-sm">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-3 text-body font-medium text-foreground hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-border py-case-sm">
            <h2 className="px-3 text-small font-semibold uppercase tracking-normal text-text-muted">
              {copy.discovery}
            </h2>
            <ul className="mt-case-xs flex flex-col">
              {discoveryNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-3 text-body font-medium text-foreground hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-case-sm border-t border-border py-case-sm">
            <Link
              href={account.href}
              className="flex min-w-0 flex-col rounded-md px-3 py-3 text-body font-medium text-foreground hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={account.ariaLabel}
              onClick={() => setIsOpen(false)}
              data-customer-auth-mobile
              data-customer-auth-state={account.state}
            >
              <span>{copy.account}</span>
              <span className="truncate text-small font-normal text-text-muted">
                {account.description}
              </span>
            </Link>
            <LanguageSwitcher
              language={language}
              labels={{
                switcher: copy.switcher,
                english: copy.switchToEnglish,
                vietnamese: copy.switchToVietnamese,
              }}
              className="w-fit"
            />
            <CartSummaryButton
              className="flex min-h-0 w-full px-3 py-3 text-body"
              label={copy.cart}
              onClick={() => setIsOpen(false)}
            />
          </div>
        </nav>
      </div>
    </div>
  );
}
