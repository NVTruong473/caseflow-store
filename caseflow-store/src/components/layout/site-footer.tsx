import Link from "next/link";

import { Container } from "@/components/ui";
import type { Language } from "@/lib/i18n/language";

import { getFooterNavigation } from "./navigation";

const footerCopy = {
  en: {
    description:
      "A focused bookstore storefront for bilingual discovery, edition choice, and small-business catalog operations.",
    supportChannels: [
      "Hotline: 1900 636 879",
      "Email: support@caseflowbooks.vn",
      "Order lookup with order code and matching contact",
      "Account profile for delivery details",
    ],
    supportHeading: "Support window",
    supportWindow: "Mon-Sat, 09:00-18:00 ICT",
    copyright: "© 2026 CaseFlow Books. All rights reserved.",
    note: "Payment choices are confirmed during checkout, with COD and bank transfer prioritized for Vietnam orders.",
  },
  vi: {
    description:
      "Nhà sách trực tuyến tập trung vào khám phá song ngữ, lựa chọn ấn bản và vận hành danh mục cho doanh nghiệp nhỏ.",
    supportChannels: [
      "Hotline: 1900 636 879",
      "Email: hotro@caseflowbooks.vn",
      "Tra cứu đơn bằng mã đơn và liên hệ trùng khớp",
      "Hồ sơ tài khoản cho thông tin giao hàng",
    ],
    supportHeading: "Khung giờ hỗ trợ",
    supportWindow: "Thứ 2-Thứ 7, 09:00-18:00 ICT",
    copyright: "© 2026 CaseFlow Books. Bảo lưu mọi quyền.",
    note: "Các lựa chọn thanh toán được xác nhận ở bước thanh toán, ưu tiên COD và chuyển khoản cho đơn tại Việt Nam.",
  },
} as const;

export function SiteFooter({ language }: { language: Language }) {
  const copy = footerCopy[language];
  const footerNavigation = getFooterNavigation(language);

  return (
    <footer className="border-t border-border bg-surface" data-site-footer>
      <Container className="grid gap-case-xl py-case-xl lg:grid-cols-[minmax(260px,420px)_minmax(0,1fr)]">
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
          <div className="mt-case-xs rounded-md border border-trust/25 bg-trust-muted p-case-sm">
            <p className="text-small font-semibold text-foreground">
              {copy.supportHeading}
            </p>
            <p className="mt-case-xs text-small text-text-muted">
              {copy.supportWindow}
            </p>
            <ul className="mt-case-sm grid gap-case-xs text-small leading-6 text-text-muted">
              {copy.supportChannels.map((channel) => (
                <li key={channel}>{channel}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-case-lg sm:grid-cols-2 lg:grid-cols-3">
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
      <Container className="grid gap-case-xs border-t border-border py-case-md md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <p className="text-small text-text-muted">{copy.note}</p>
        <p className="text-small text-text-muted md:text-right">
          {copy.copyright}
        </p>
      </Container>
    </footer>
  );
}
