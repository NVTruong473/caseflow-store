"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui";
import type { Language } from "@/lib/i18n/language";

import {
  CUSTOMER_GUIDANCE_STORAGE_PREFIX,
  customerGuidanceCopy,
  isCustomerGuidanceTourId,
  type CustomerGuidanceTourId,
} from "./customer-guidance-content";

type GuidanceStorage = {
  completedTourIds: CustomerGuidanceTourId[];
  version: 1;
};

type CustomerGuidanceContextValue = {
  customerId: string | null;
  isReady: boolean;
  openTour: (tourId: CustomerGuidanceTourId) => void;
  openTourOnce: (tourId: CustomerGuidanceTourId) => void;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const CustomerGuidanceContext =
  React.createContext<CustomerGuidanceContextValue | null>(null);

export function CustomerGuidanceProvider({
  children,
  customerId,
  language,
}: {
  children: React.ReactNode;
  customerId: string | null;
  language: Language;
}) {
  const storageKey = `${CUSTOMER_GUIDANCE_STORAGE_PREFIX}:${customerId ?? "guest"}`;
  const dismissedTourIdsRef = React.useRef<Set<CustomerGuidanceTourId>>(
    new Set(),
  );
  const [activeTourId, setActiveTourId] =
    React.useState<CustomerGuidanceTourId | null>(null);
  const [completedTourIds, setCompletedTourIds] = React.useState<
    CustomerGuidanceTourId[]
  >(() => readGuidanceStorage(storageKey));
  const isReady = typeof window !== "undefined";

  const openTour = React.useCallback((tourId: CustomerGuidanceTourId) => {
    setActiveTourId(tourId);
  }, []);

  const openTourOnce = React.useCallback(
    (tourId: CustomerGuidanceTourId) => {
      if (
        !isReady ||
        !customerId ||
        activeTourId !== null ||
        completedTourIds.includes(tourId) ||
        dismissedTourIdsRef.current.has(tourId)
      ) {
        return;
      }

      setActiveTourId(tourId);
    },
    [activeTourId, completedTourIds, customerId, isReady],
  );

  const closeTour = React.useCallback(() => {
    if (activeTourId) {
      dismissedTourIdsRef.current.add(activeTourId);
    }
    setActiveTourId(null);
  }, [activeTourId]);

  const completeTour = React.useCallback(() => {
    if (!activeTourId) {
      return;
    }

    const nextCompletedTourIds = Array.from(
      new Set([...completedTourIds, activeTourId]),
    );

    setCompletedTourIds(nextCompletedTourIds);
    writeGuidanceStorage(storageKey, nextCompletedTourIds);
    setActiveTourId(null);
  }, [activeTourId, completedTourIds, storageKey]);

  const contextValue = React.useMemo<CustomerGuidanceContextValue>(
    () => ({
      customerId,
      isReady,
      openTour,
      openTourOnce,
    }),
    [customerId, isReady, openTour, openTourOnce],
  );

  return (
    <CustomerGuidanceContext.Provider value={contextValue}>
      {children}
      {activeTourId ? (
        <CustomerGuidanceDialog
          activeTourId={activeTourId}
          key={activeTourId}
          language={language}
          onClose={closeTour}
          onComplete={completeTour}
        />
      ) : null}
    </CustomerGuidanceContext.Provider>
  );
}

export function CustomerGuidanceAutoOpen({
  tourId,
}: {
  tourId: CustomerGuidanceTourId;
}) {
  const { openTourOnce } = useCustomerGuidance();

  React.useEffect(() => {
    openTourOnce(tourId);
  }, [openTourOnce, tourId]);

  return null;
}

export function CustomerGuidanceButton({
  className,
  language,
  tourId,
}: {
  className?: string;
  language: Language;
  tourId: CustomerGuidanceTourId;
}) {
  const { openTour } = useCustomerGuidance();
  const copy = customerGuidanceCopy[language];

  return (
    <Button
      className={className}
      onClick={() => openTour(tourId)}
      size="sm"
      type="button"
      variant="secondary"
      data-customer-guidance-open={tourId}
    >
      {copy.openGuide}
    </Button>
  );
}

export function useCustomerGuidance() {
  const context = React.useContext(CustomerGuidanceContext);

  if (!context) {
    throw new Error(
      "useCustomerGuidance must be used within CustomerGuidanceProvider",
    );
  }

  return context;
}

function CustomerGuidanceDialog({
  activeTourId,
  language,
  onClose,
  onComplete,
}: {
  activeTourId: CustomerGuidanceTourId;
  language: Language;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [slideIndex, setSlideIndex] = React.useState(0);
  const dialogRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
  const copy = customerGuidanceCopy[language];
  const tour = copy.tours[activeTourId];

  React.useEffect(() => {
    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleDocumentKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
      document.body.style.overflow = previousOverflow;
      const previousElement = previousActiveElementRef.current;

      if (previousElement && document.contains(previousElement)) {
        previousElement.focus();
      }
    };
  }, [activeTourId, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  const slide = tour.slides[slideIndex];
  const isLastSlide = slideIndex === tour.slides.length - 1;
  const titleId = `customer-guidance-${activeTourId}-title`;
  const descriptionId = `customer-guidance-${activeTourId}-description`;

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter((element) => element.offsetParent !== null);

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-case-lg"
      data-customer-guidance-dialog={activeTourId}
    >
      <button
        aria-label={copy.close}
        className="absolute inset-0 cursor-default bg-foreground/45"
        onClick={onClose}
        tabIndex={-1}
        type="button"
        data-customer-guidance-backdrop
      />
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-lg border border-border bg-surface shadow-xl sm:max-h-[min(760px,calc(100dvh-48px))] sm:max-w-2xl sm:rounded-lg"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-case-md border-b border-border px-case-md py-case-md sm:px-case-lg">
          <div className="min-w-0">
            <p className="text-small font-semibold uppercase text-primary">
              {copy.dialogLabel}
            </p>
            <h2
              className="mt-case-xs text-heading-2 font-semibold text-foreground"
              id={titleId}
            >
              {tour.title}
            </h2>
            <p
              className="mt-case-xs text-small leading-6 text-text-muted"
              id={descriptionId}
            >
              {tour.intro}
            </p>
          </div>
          <Button
            aria-label={copy.close}
            onClick={onClose}
            ref={closeButtonRef}
            size="sm"
            type="button"
            variant="secondary"
            data-customer-guidance-close
          >
            {language === "vi" ? "Đóng" : "Close"}
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-case-md py-case-lg sm:px-case-lg">
          <div className="flex items-center gap-case-md">
            <p
              className="shrink-0 text-small font-medium text-text-muted"
              data-customer-guidance-progress
            >
              {copy.progress(slideIndex + 1, tour.slides.length)}
            </p>
            <div
              aria-valuemax={tour.slides.length}
              aria-valuemin={1}
              aria-valuenow={slideIndex + 1}
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-surface-muted"
              role="progressbar"
            >
              <span
                className="block h-full bg-primary transition-[width] duration-150 motion-reduce:transition-none"
                style={{
                  width: `${((slideIndex + 1) / tour.slides.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <article
            aria-live="polite"
            className="mt-case-lg border-l-4 border-primary pl-case-md sm:pl-case-lg"
            data-customer-guidance-slide={slideIndex + 1}
          >
            <h3 className="text-heading-2 font-semibold text-foreground">
              {slide.title}
            </h3>
            <p className="mt-case-sm text-body leading-7 text-text-muted">
              {slide.description}
            </p>
            <ul className="mt-case-md grid gap-case-sm">
              {slide.points.map((point) => (
                <li
                  className="flex gap-case-sm text-small leading-6 text-foreground"
                  key={point}
                >
                  <span
                    aria-hidden="true"
                    className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-sm bg-primary"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <footer className="grid grid-cols-2 gap-case-sm border-t border-border bg-background px-case-md py-case-md sm:flex sm:justify-between sm:px-case-lg">
          <Button
            disabled={slideIndex === 0}
            onClick={() =>
              setSlideIndex((current) => Math.max(0, current - 1))
            }
            type="button"
            variant="secondary"
            data-customer-guidance-previous
          >
            {copy.previous}
          </Button>
          {isLastSlide ? (
            <Button
              onClick={onComplete}
              type="button"
              data-customer-guidance-understood
            >
              {copy.understood}
            </Button>
          ) : (
            <Button
              onClick={() =>
                setSlideIndex((current) =>
                  Math.min(tour.slides.length - 1, current + 1),
                )
              }
              type="button"
              data-customer-guidance-next
            >
              {copy.next}
            </Button>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function readGuidanceStorage(storageKey: string): CustomerGuidanceTourId[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      !("version" in parsedValue) ||
      parsedValue.version !== 1 ||
      !("completedTourIds" in parsedValue) ||
      !Array.isArray(parsedValue.completedTourIds)
    ) {
      return [];
    }

    return parsedValue.completedTourIds.filter(isCustomerGuidanceTourId);
  } catch {
    return [];
  }
}

function writeGuidanceStorage(
  storageKey: string,
  completedTourIds: CustomerGuidanceTourId[],
) {
  const value: GuidanceStorage = {
    completedTourIds,
    version: 1,
  };

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Guidance completion is best-effort and never blocks commerce actions.
  }
}
