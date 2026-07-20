"use client";

import * as React from "react";

import type { Language } from "@/lib/i18n/language";

const backToTopCopy = {
  en: {
    label: "Back to top",
    short: "Top",
  },
  vi: {
    label: "Lên đầu trang",
    short: "Lên đầu",
  },
} as const;

export function BackToTopButton({ language }: { language: Language }) {
  const [isVisible, setIsVisible] = React.useState(false);
  const copy = backToTopCopy[language];

  React.useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 720);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) {
    return null;
  }

  function handleClick() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <button
      type="button"
      className="fixed bottom-4 left-4 z-40 inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-small font-semibold text-foreground shadow-[var(--case-shadow-soft)] transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
      aria-label={copy.label}
      onClick={handleClick}
      data-back-to-top
    >
      {copy.short}
    </button>
  );
}
