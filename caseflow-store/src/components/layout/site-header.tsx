import Link from "next/link";

import { Container } from "@/components/ui";
import { CartSummaryButton } from "@/features/cart";

import { MobileNavigation } from "./mobile-navigation";
import { siteNavigation } from "./navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <Container className="relative flex min-h-16 items-center justify-between gap-case-md py-case-sm">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-case-sm rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="CaseFlow Store home"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-small font-semibold text-surface">
            CF
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-body font-semibold text-foreground">
              CaseFlow Store
            </span>
            <span className="hidden text-small text-text-muted sm:block">
              Phone accessories
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-case-sm md:flex"
          aria-label="Main navigation"
        >
          {siteNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-small font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center md:flex">
          <CartSummaryButton />
        </div>

        <MobileNavigation />
      </Container>
    </header>
  );
}
