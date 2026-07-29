"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui";
import type { Language } from "@/lib/i18n/language";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "video[controls]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const copy = {
  en: {
    close: "Close introduction",
    description:
      "A 4-minute 16-second walkthrough of the storefront, checkout, customer account, and store operations. Vietnamese narration and captions are included.",
    dialogLabel: "Product introduction",
    fallback:
      "Your browser cannot play this video. Use the catalog to explore CaseFlow Books.",
    open: "Watch introduction",
    title: "See how CaseFlow Books works",
    videoLabel: "CaseFlow Books product introduction video",
  },
  vi: {
    close: "Đóng phần giới thiệu",
    description:
      "Video dài 4 phút 16 giây giới thiệu trang bán sách, checkout, tài khoản khách hàng và khu vực vận hành. Video có lời đọc và phụ đề tiếng Việt.",
    dialogLabel: "Giới thiệu sản phẩm",
    fallback:
      "Trình duyệt không phát được video này. Bạn vẫn có thể mở catalog để khám phá CaseFlow Books.",
    open: "Xem giới thiệu",
    title: "Xem CaseFlow Books hoạt động",
    videoLabel: "Video giới thiệu sản phẩm CaseFlow Books",
  },
} as const;

export function IntroVideoDialog({ language }: { language: Language }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const dialogRef = React.useRef<HTMLElement>(null);
  const openButtonRef = React.useRef<HTMLButtonElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const languageCopy = copy[language];

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const openButton = openButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    const video = videoRef.current;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleDocumentKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
      document.body.style.overflow = previousOverflow;
      video?.pause();
      openButton?.focus();
    };
  }, [isOpen]);

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLElement>) {
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

  const titleId = "caseflow-introduction-title";
  const descriptionId = "caseflow-introduction-description";

  return (
    <>
      <Button
        className="min-h-11 w-full sm:w-auto"
        data-home-introduction-open
        onClick={() => setIsOpen(true)}
        ref={openButtonRef}
        size="md"
        type="button"
        variant="secondary"
      >
        <span
          aria-hidden="true"
          className="h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-current"
        />
        {languageCopy.open}
      </Button>

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-case-lg"
              data-home-introduction-dialog
            >
              <button
                aria-label={languageCopy.close}
                className="absolute inset-0 cursor-default bg-foreground/55"
                data-home-introduction-backdrop
                onClick={() => setIsOpen(false)}
                tabIndex={-1}
                type="button"
              />
              <section
                aria-describedby={descriptionId}
                aria-labelledby={titleId}
                aria-modal="true"
                className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-lg border border-border bg-surface shadow-xl sm:max-h-[min(860px,calc(100dvh-48px))] sm:max-w-5xl sm:rounded-lg"
                onKeyDown={handleDialogKeyDown}
                ref={dialogRef}
                role="dialog"
              >
                <header className="flex items-start justify-between gap-case-md border-b border-border px-case-md py-case-md sm:px-case-lg">
                  <div className="min-w-0">
                    <p className="text-small font-semibold uppercase text-primary">
                      {languageCopy.dialogLabel}
                    </p>
                    <h2
                      className="mt-case-xs text-heading-2 font-semibold text-foreground"
                      id={titleId}
                    >
                      {languageCopy.title}
                    </h2>
                    <p
                      className="mt-case-xs max-w-3xl text-small leading-6 text-text-muted"
                      id={descriptionId}
                    >
                      {languageCopy.description}
                    </p>
                  </div>
                  <Button
                    aria-label={languageCopy.close}
                    data-home-introduction-close
                    onClick={() => setIsOpen(false)}
                    ref={closeButtonRef}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {language === "vi" ? "Đóng" : "Close"}
                  </Button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto bg-foreground px-case-sm py-case-sm sm:px-case-md sm:py-case-md">
                  <video
                    aria-label={languageCopy.videoLabel}
                    className="mx-auto block aspect-video max-h-[calc(100dvh-190px)] w-full bg-black object-contain"
                    controls
                    data-home-introduction-video
                    playsInline
                    poster="/media/caseflow-books-introduction-poster.png"
                    preload="metadata"
                    ref={videoRef}
                  >
                    <source
                      src="/media/caseflow-books-introduction-vi.mp4"
                      type="video/mp4"
                    />
                    <track
                      default
                      kind="captions"
                      label="Tiếng Việt"
                      src="/media/caseflow-books-introduction-vi.vtt"
                      srcLang="vi"
                    />
                    {languageCopy.fallback}
                  </video>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
