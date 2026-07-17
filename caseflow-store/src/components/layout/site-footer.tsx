import Link from "next/link";

import { Container } from "@/components/ui";
import type { Language } from "@/lib/i18n/language";

import { getFooterNavigation } from "./navigation";

const footerCopy = {
  en: {
    description:
      "A focused bookstore storefront for bilingual discovery, edition choice, and small-business catalog operations.",
    note: "No card numbers, wallet credentials, or provider login details are collected.",
  },
  vi: {
    description:
      "Nhà sách trực tuyến tập trung vào khám phá song ngữ, lựa chọn ấn bản và vận hành danh mục cho doanh nghiệp nhỏ.",
    note: "Website không thu thập số thẻ, thông tin ví điện tử hoặc tài khoản đăng nhập nhà cung cấp thanh toán.",
  },
} as const;

export function SiteFooter({ language }: { language: Language }) {
  const copy = footerCopy[language];
  const footerNavigation = getFooterNavigation(language);

  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-case-xl py-case-xl md:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
        <div className="flex max-w-md flex-col gap-case-sm">
          <Link
            href="/"
            className="w-fit rounded-md text-heading-3 font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            CaseFlow Books
          </Link>
          <p className="text-small leading-6 text-text-muted">
            {copy.description}
          </p>
        </div>

        <div className="grid gap-case-lg sm:grid-cols-2">
          {footerNavigation.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className="text-small font-semibold uppercase tracking-normal text-foreground">
                {section.title}
              </h2>
              <ul className="mt-case-sm flex flex-col gap-case-xs">
                {section.links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-small text-text-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>
      <Container className="border-t border-border py-case-md">
        <p className="text-small text-text-muted">
          {copy.note}
        </p>
      </Container>
    </footer>
  );
}
