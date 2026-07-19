import Link from "next/link";

import { Badge, Container } from "@/components/ui";
import type { Language } from "@/lib/i18n/language";
import {
  bookstorePolicies,
  type BookstorePolicy,
  type BookstorePolicyTone,
} from "@/lib/policies/bookstore-policies";
import { cn } from "@/lib/utils/cn";

const sharedPolicyCopy = {
  en: {
    breadcrumbHome: "Home",
    breadcrumbPolicies: "Policies",
    lastUpdated: "Last updated",
    policyNavigation: "Bookstore policies",
    quickLinks: "Related store information",
    sections: "Policy details",
  },
  vi: {
    breadcrumbHome: "Trang chủ",
    breadcrumbPolicies: "Chính sách",
    lastUpdated: "Cập nhật lần cuối",
    policyNavigation: "Chính sách nhà sách",
    quickLinks: "Thông tin liên quan",
    sections: "Chi tiết chính sách",
  },
} as const;

export function BookstorePolicyPage({
  language,
  policy,
}: {
  language: Language;
  policy: BookstorePolicy;
}) {
  const copy = policy.copy[language];
  const sharedCopy = sharedPolicyCopy[language];

  return (
    <main className="bg-background text-foreground" data-bookstore-policy-page={policy.slug}>
      <section className={cn("border-b", getPolicyHeroClass(policy.tone))}>
        <Container className="flex flex-col gap-case-lg py-case-2xl">
          <nav
            aria-label={sharedCopy.policyNavigation}
            className="flex min-w-0 flex-wrap items-center gap-case-xs text-small"
          >
            <Link
              href="/"
              className="rounded-md font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {sharedCopy.breadcrumbHome}
            </Link>
            <span className="text-text-muted">/</span>
            <span className="text-text-muted">{sharedCopy.breadcrumbPolicies}</span>
            <span className="text-text-muted">/</span>
            <span className="max-w-full truncate text-text-muted" aria-current="page">
              {copy.title}
            </span>
          </nav>

          <div className="grid gap-case-xl lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="min-w-0">
              <Badge className={getPolicyBadgeClass(policy.tone)}>
                {copy.badge}
              </Badge>
              <h1 className="mt-case-md max-w-4xl text-heading-1 font-semibold leading-tight text-foreground">
                {copy.title}
              </h1>
              <p className="mt-case-md max-w-3xl text-body leading-7 text-text-muted">
                {copy.lead}
              </p>
              <p className="mt-case-md text-small text-text-muted">
                {sharedCopy.lastUpdated}: {copy.lastUpdated}
              </p>
              {copy.cta ? (
                <Link
                  href={copy.cta.href}
                  className="mt-case-lg inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-case-md py-case-sm text-small font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {copy.cta.label}
                </Link>
              ) : null}
            </div>

            <aside className="min-w-0" data-bookstore-policy-highlights>
              <h2 className="text-body font-semibold text-foreground">
                {sharedCopy.quickLinks}
              </h2>
              <ul className="mt-case-md grid gap-case-sm">
                {copy.highlights.map((item) => (
                  <li
                    key={item}
                    className={cn(
                      "rounded-md border bg-surface p-case-sm text-small leading-6 text-text-muted",
                      getPolicyBorderClass(policy.tone),
                    )}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </Container>
      </section>

      <Container className="grid gap-case-xl py-case-2xl lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section
          aria-label={sharedCopy.sections}
          className="grid min-w-0 gap-case-md"
          data-bookstore-policy-sections
        >
          {copy.sections.map((section, index) => (
            <article
              key={section.title}
              className={cn(
                "grid min-w-0 gap-case-sm rounded-lg border bg-surface p-case-lg sm:grid-cols-[72px_minmax(0,1fr)]",
                getPolicyBorderClass(policy.tone),
              )}
              data-bookstore-policy-section
            >
              <span
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-md text-body font-semibold",
                  getPolicyStepClass(policy.tone),
                )}
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <h2 className="text-heading-3 font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="mt-case-sm text-body leading-7 text-text-muted">
                  {section.body}
                </p>
              </span>
            </article>
          ))}
        </section>

        <aside className="min-w-0 rounded-lg border border-border bg-paper p-case-lg lg:sticky lg:top-24">
          <h2 className="text-body font-semibold text-foreground">
            {sharedCopy.policyNavigation}
          </h2>
          <nav className="mt-case-md grid gap-case-xs" aria-label={sharedCopy.policyNavigation}>
            {bookstorePolicies.map((item) => {
              const itemCopy = item.copy[language];
              const isCurrent = item.slug === policy.slug;

              return (
                <Link
                  key={item.slug}
                  href={item.path}
                  className={cn(
                    "rounded-md px-3 py-2 text-small font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    isCurrent
                      ? "bg-primary text-surface"
                      : "text-text-muted hover:bg-surface-muted hover:text-foreground",
                  )}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {itemCopy.title}
                </Link>
              );
            })}
          </nav>

          {copy.contactRows ? (
            <dl className="mt-case-lg grid gap-case-sm text-small text-text-muted">
              {copy.contactRows.map((row) => (
                <div key={row.label}>
                  <dt className="font-semibold text-foreground">{row.label}</dt>
                  <dd className="mt-case-xs leading-6">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </aside>
      </Container>
    </main>
  );
}

function getPolicyHeroClass(tone: BookstorePolicyTone) {
  const classes = {
    arrival: "border-arrival/20 bg-arrival-muted",
    discovery: "border-discovery/20 bg-discovery-muted",
    offer: "border-offer/20 bg-offer-muted",
    operations: "border-operations/20 bg-operations-muted",
    translation: "border-translation/20 bg-translation-muted",
    trust: "border-trust/20 bg-trust-muted",
  } satisfies Record<BookstorePolicyTone, string>;

  return classes[tone];
}

function getPolicyBadgeClass(tone: BookstorePolicyTone) {
  const classes = {
    arrival: "border-arrival bg-surface text-arrival",
    discovery: "border-discovery bg-surface text-discovery",
    offer: "border-offer bg-surface text-offer",
    operations: "border-operations bg-surface text-operations",
    translation: "border-translation bg-surface text-translation",
    trust: "border-trust bg-surface text-trust",
  } satisfies Record<BookstorePolicyTone, string>;

  return classes[tone];
}

function getPolicyBorderClass(tone: BookstorePolicyTone) {
  const classes = {
    arrival: "border-arrival/25",
    discovery: "border-discovery/25",
    offer: "border-offer/25",
    operations: "border-operations/25",
    translation: "border-translation/25",
    trust: "border-trust/25",
  } satisfies Record<BookstorePolicyTone, string>;

  return classes[tone];
}

function getPolicyStepClass(tone: BookstorePolicyTone) {
  const classes = {
    arrival: "bg-arrival-muted text-arrival",
    discovery: "bg-discovery-muted text-discovery",
    offer: "bg-offer-muted text-offer",
    operations: "bg-operations-muted text-operations",
    translation: "bg-translation-muted text-translation",
    trust: "bg-trust-muted text-trust",
  } satisfies Record<BookstorePolicyTone, string>;

  return classes[tone];
}
