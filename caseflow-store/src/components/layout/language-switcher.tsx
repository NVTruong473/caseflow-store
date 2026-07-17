"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";

type LanguageSwitcherProps = {
  language: Language;
  labels?: {
    switcher?: string;
    english?: string;
    vietnamese?: string;
  };
  className?: string;
};

const languageOptions: Array<{
  language: Language;
  shortLabel: string;
  flagLabel: string;
  flagClassName: string;
}> = [
  {
    language: "vi",
    shortLabel: "VI",
    flagLabel: "VN",
    flagClassName: "border-red-500 bg-red-500 text-yellow-300",
  },
  {
    language: "en",
    shortLabel: "EN",
    flagLabel: "UK",
    flagClassName: "border-blue-700 bg-blue-700 text-white",
  },
];

export function LanguageSwitcher({
  className,
  labels,
  language,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function selectLanguage(nextLanguage: Language) {
    if (nextLanguage === language) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/preferences/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: nextLanguage }),
      });

      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-surface p-1",
        className,
      )}
      aria-label={labels?.switcher ?? "Language"}
      data-language-switcher
    >
      {languageOptions.map((option) => {
        const isSelected = option.language === language;
        const accessibleName =
          option.language === "vi"
            ? (labels?.vietnamese ?? "Switch to Vietnamese")
            : (labels?.english ?? "Switch to English");

        return (
          <button
            key={option.language}
            type="button"
            className={cn(
              "inline-flex min-h-9 items-center gap-2 rounded-sm px-2 py-1 text-small font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              isSelected
                ? "bg-primary text-surface"
                : "text-text-muted hover:bg-surface-muted hover:text-foreground",
            )}
            aria-label={accessibleName}
            aria-pressed={isSelected}
            data-language-option={option.language}
            disabled={isPending}
            onClick={() => selectLanguage(option.language)}
          >
            <span
              className={cn(
                "inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-sm border text-[10px] font-semibold leading-none",
                option.flagClassName,
              )}
              aria-hidden="true"
            >
              {option.flagLabel}
            </span>
            <span>{option.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
