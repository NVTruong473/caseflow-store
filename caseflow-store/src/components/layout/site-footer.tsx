import Link from "next/link";

import { Container } from "@/components/ui";

import { footerNavigation } from "./navigation";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-case-xl py-case-xl md:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
        <div className="flex max-w-md flex-col gap-case-sm">
          <Link
            href="/"
            className="w-fit rounded-md text-heading-3 font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            CaseFlow Store
          </Link>
          <p className="text-small leading-6 text-text-muted">
            A focused phone accessories storefront for cases, charging, screen
            protection, and desk setup essentials.
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
          Demo checkout is simulated for this project. No real payment is
          collected.
        </p>
      </Container>
    </footer>
  );
}
