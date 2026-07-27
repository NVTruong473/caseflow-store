"use client";

import * as React from "react";

import { checkoutExperienceCopy } from "@/features/checkout/checkout-experience-copy";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";

export type CheckoutMode = "official" | "experience";

export function CheckoutModeSelector({
  language,
  mode,
  onModeChange,
}: {
  language: Language;
  mode: CheckoutMode;
  onModeChange: (mode: CheckoutMode) => void;
}) {
  const copy = checkoutExperienceCopy[language];
  const options: Array<{
    description: string;
    label: string;
    value: CheckoutMode;
  }> = [
    {
      description: copy.modeOfficialDescription,
      label: copy.modeOfficialLabel,
      value: "official",
    },
    {
      description: copy.modeExperienceDescription,
      label: copy.modeExperienceLabel,
      value: "experience",
    },
  ];

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentMode: CheckoutMode,
  ) {
    const currentIndex = options.findIndex(
      (option) => option.value === currentMode,
    );
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % options.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextMode = options[nextIndex].value;
    onModeChange(nextMode);
    window.requestAnimationFrame(() => {
      document.getElementById(`checkout-${nextMode}-tab`)?.focus();
    });
  }

  return (
    <section
      aria-labelledby="checkout-mode-title"
      className="border-y border-border py-case-md"
      data-checkout-mode-selector
    >
      <h2
        className="mb-case-sm text-heading-3 font-semibold text-foreground"
        id="checkout-mode-title"
      >
        {copy.modeTitle}
      </h2>
      <div
        aria-label={copy.modeTitle}
        className="grid gap-case-sm md:grid-cols-2"
        role="tablist"
      >
        {options.map((option) => {
          const isActive = mode === option.value;

          return (
            <button
              aria-controls={`checkout-${option.value}-panel`}
              aria-selected={isActive}
              className={cn(
                "min-w-0 rounded-md border px-case-md py-case-sm text-left transition-colors duration-150 motion-reduce:transition-none",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                isActive
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-surface text-foreground hover:border-primary/50",
              )}
              data-checkout-mode={option.value}
              id={`checkout-${option.value}-tab`}
              key={option.value}
              onClick={() => onModeChange(option.value)}
              onKeyDown={(event) => handleTabKeyDown(event, option.value)}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="mt-1 block text-small leading-5 text-text-muted">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
