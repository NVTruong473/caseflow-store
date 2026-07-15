"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui";
import { CartSummaryButton } from "@/features/cart";
import { cn } from "@/lib/utils/cn";

import { siteNavigation } from "./navigation";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setIsOpen((current) => !current)}
        data-mobile-navigation-toggle
      >
        {isOpen ? "Close" : "Menu"}
      </Button>

      <div
        id="mobile-navigation"
        className={cn(
          "absolute inset-x-0 top-full border-b border-border bg-surface shadow-sm",
          isOpen ? "block" : "hidden",
        )}
      >
        <nav aria-label="Mobile navigation" className="mx-auto max-w-6xl px-4">
          <ul className="flex flex-col py-case-sm">
            {siteNavigation.map((item) => (
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
            <CartSummaryButton
              className="flex min-h-0 w-full px-3 py-3 text-body"
              onClick={() => setIsOpen(false)}
            />
          </div>
        </nav>
      </div>
    </div>
  );
}
