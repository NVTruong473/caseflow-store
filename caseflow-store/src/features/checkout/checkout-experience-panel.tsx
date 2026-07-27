"use client";

import QRCode from "qrcode";
import * as React from "react";

import { Badge, Button, ErrorMessage, Skeleton } from "@/components/ui";
import { checkoutExperienceCopy } from "@/features/checkout/checkout-experience-copy";
import { formatVnd } from "@/lib/format/currency";
import type { CurrencyDisplayRules } from "@/lib/format/currency-display";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";
import type { ValidatedCartData } from "@/types/catalog";
import type {
  CheckoutExperienceCreatedSession,
  CheckoutExperienceSession,
  CheckoutExperienceStatus,
} from "@/types/checkout-experience";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

type QrImageState =
  | { status: "loading" }
  | { status: "ready"; dataUrl: string }
  | { status: "error" };

const TERMINAL_STATUSES = new Set<CheckoutExperienceStatus>([
  "cancelled",
  "completed",
  "expired",
  "locked",
]);

export function CheckoutExperiencePanel({
  cartData,
  language,
  validationError,
  validationPending,
}: {
  cartData: ValidatedCartData | null;
  currencyRules: CurrencyDisplayRules;
  language: Language;
  validationError: string | null;
  validationPending: boolean;
}) {
  const copy = checkoutExperienceCopy[language];
  const [session, setSession] =
    React.useState<CheckoutExperienceCreatedSession | null>(null);
  const [requestState, setRequestState] =
    React.useState<RequestState>({ status: "idle" });
  const [serverOffsetMs, setServerOffsetMs] = React.useState(0);
  const [now, setNow] = React.useState(() => Date.now());
  const activeSession =
    session && cartData && session.amountVnd > 0 ? session : null;
  const localizedScanUrl = activeSession
    ? addLanguageToScanUrl(activeSession.scanUrl, language)
    : null;
  const status = activeSession?.status ?? null;
  const displayStatus = activeSession
    ? status === "pending" &&
      Date.parse(activeSession.expiresAt) <= now + serverOffsetMs
      ? "expired"
      : status
    : null;

  React.useEffect(() => {
    if (!activeSession || displayStatus !== "pending") {
      return;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [activeSession, displayStatus]);

  React.useEffect(() => {
    if (!activeSession || TERMINAL_STATUSES.has(activeSession.status)) {
      return;
    }

    const pollingSession = activeSession;
    const abortController = new AbortController();
    let timeoutId: number | null = null;

    async function pollStatus() {
      try {
        const response = await fetch("/api/checkout-experience/status", {
          body: JSON.stringify({ token: pollingSession.accessToken }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: abortController.signal,
        });
        const payload =
          (await response.json()) as ApiResponse<CheckoutExperienceSession>;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message ?? copy.pollingError);
        }

        setServerOffsetMs(Date.parse(payload.data.serverTime) - Date.now());
        setSession((current) =>
          current
            ? {
                ...current,
                ...payload.data,
              }
            : current,
        );
        setRequestState({ status: "idle" });

        if (!TERMINAL_STATUSES.has(payload.data.status)) {
          timeoutId = window.setTimeout(() => void pollStatus(), 2000);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setRequestState({ status: "error", message: copy.pollingError });
        timeoutId = window.setTimeout(() => void pollStatus(), 4000);
      }
    }

    timeoutId = window.setTimeout(() => void pollStatus(), 2000);

    return () => {
      abortController.abort();
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeSession, copy.pollingError]);

  async function createExperience() {
    if (!cartData || cartData.items.length === 0) {
      return;
    }

    setRequestState({ status: "loading" });

    try {
      const clientRequestId = crypto.randomUUID();
      const response = await fetch("/api/checkout-experience", {
        body: JSON.stringify({
          clientRequestId,
          items: cartData.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload =
        (await response.json()) as ApiResponse<CheckoutExperienceCreatedSession>;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? copy.createError);
      }

      setServerOffsetMs(Date.parse(payload.data.serverTime) - Date.now());
      setNow(Date.now());
      setSession(payload.data);
      setRequestState({ status: "idle" });
    } catch {
      setRequestState({ status: "error", message: copy.createError });
    }
  }

  async function resetExperience() {
    const current = session;

    if (current?.status === "pending") {
      setRequestState({ status: "loading" });

      try {
        await fetch("/api/checkout-experience/cancel", {
          body: JSON.stringify({ token: current.accessToken }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } catch {
        // Phiên sẽ tự hết hạn trên server nếu kết nối bị gián đoạn.
      }
    }

    setSession(null);
    setRequestState({ status: "idle" });
  }

  return (
    <section
      aria-labelledby="checkout-experience-tab checkout-experience-title"
      className="grid gap-case-xl lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      data-checkout-experience
      data-experience-persists-payment="false"
      data-experience-persists-session="true"
      id="checkout-experience-panel"
      role="tabpanel"
      tabIndex={0}
    >
      <div className="flex flex-col gap-case-md border-l-4 border-discovery pl-case-md">
        <Badge variant="success">{copy.modeExperienceLabel}</Badge>
        <div>
          <h2
            className="text-heading-2 font-semibold text-foreground"
            id="checkout-experience-title"
          >
            {copy.createTitle}
          </h2>
          <p className="mt-case-sm max-w-2xl leading-7 text-text-muted">
            {copy.createDescription}
          </p>
        </div>

        <div className="border-y border-border py-case-md">
          <p className="text-small font-medium text-foreground">
            {copy.validatedCart}
          </p>
          <p
            className="mt-case-sm text-heading-2 font-semibold text-primary"
            data-checkout-experience-amount
          >
            {activeSession ? formatVnd(activeSession.amountVnd) : "—"}
          </p>
        </div>

        {validationPending ? (
          <div className="grid gap-case-sm" data-checkout-experience-loading>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-11 w-48" />
          </div>
        ) : null}

        {validationError ? (
          <ErrorMessage>{validationError}</ErrorMessage>
        ) : null}
        {requestState.status === "error" ? (
          <ErrorMessage>{requestState.message}</ErrorMessage>
        ) : null}

        {!activeSession && !validationPending && !validationError ? (
          <Button
            className="w-fit"
            disabled={!cartData || cartData.items.length === 0}
            isLoading={requestState.status === "loading"}
            onClick={() => void createExperience()}
            type="button"
            data-checkout-experience-create
          >
            {copy.create}
          </Button>
        ) : null}

        <p className="text-small leading-6 text-warning">{copy.disclaimer}</p>
      </div>

      <div className="min-w-0 rounded-lg border border-border bg-surface p-case-md shadow-card md:p-case-lg">
        {!activeSession ? (
          <ExperiencePlaceholder language={language} />
        ) : (
          <div className="grid gap-case-lg md:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col items-center gap-case-sm">
              <ExperienceQrCode
                alt={copy.qrAlt}
                errorCopy={copy.qrError}
                payload={localizedScanUrl ?? activeSession.scanUrl}
              />
              <Badge variant="warning">{copy.qrLabel}</Badge>
              <a
                className="text-center text-small font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                data-checkout-experience-open
                href={localizedScanUrl ?? activeSession.scanUrl}
                rel="noreferrer"
                target="_blank"
              >
                {copy.openOnDevice}
              </a>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-case-sm">
                <div>
                  <h3 className="text-heading-3 font-semibold text-foreground">
                    {getStatusTitle(displayStatus, copy)}
                  </h3>
                  <p className="mt-case-sm text-small leading-6 text-text-muted">
                    {getStatusDescription(displayStatus, copy)}
                  </p>
                </div>
                {displayStatus ? (
                  <Badge
                    variant={getStatusVariant(displayStatus)}
                    data-checkout-experience-status={displayStatus}
                  >
                    {displayStatus.toUpperCase()}
                  </Badge>
                ) : null}
              </div>

              {displayStatus === "pending" ? (
                <>
                  <p
                    className="mt-case-md rounded-md border border-trust/25 bg-trust-muted p-case-sm text-small font-medium text-trust"
                    data-checkout-experience-countdown
                  >
                    {copy.timeLeft}:{" "}
                    {formatRemainingTime(
                      Date.parse(activeSession.expiresAt) -
                        (now + serverOffsetMs),
                    )}
                  </p>
                  <ol className="mt-case-md grid gap-2 text-small leading-6 text-text-muted">
                    <li>1. {copy.scanStep}</li>
                    <li>2. {copy.amountStep}</li>
                    <li>3. {copy.codeStep}</li>
                  </ol>
                </>
              ) : null}

              <dl className="mt-case-md grid gap-case-sm">
                <ExperienceDetail
                  label={copy.amount}
                  value={formatVnd(activeSession.amountVnd)}
                />
                <ExperienceDetail
                  label={copy.confirmationCode}
                  value={activeSession.confirmationCode}
                  confirmationCode
                />
                <ExperienceDetail
                  label={copy.transferContent}
                  value={activeSession.transferContent}
                />
                <ExperienceDetail
                  label={copy.bank}
                  value={activeSession.merchant.bankName}
                />
                <ExperienceDetail
                  label={copy.accountNumber}
                  value={activeSession.merchant.accountNumber}
                />
                <ExperienceDetail
                  label={copy.accountName}
                  value={activeSession.merchant.accountName}
                />
              </dl>

              <div className="mt-case-md flex flex-wrap gap-case-sm">
                <Button
                  isLoading={requestState.status === "loading"}
                  onClick={() => void resetExperience()}
                  type="button"
                  variant="secondary"
                  data-checkout-experience-reset
                >
                  {copy.reset}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ExperiencePlaceholder({ language }: { language: Language }) {
  const copy = checkoutExperienceCopy[language];

  return (
    <div className="grid min-h-80 place-items-center text-center">
      <div className="max-w-md">
        <div
          aria-hidden="true"
          className="mx-auto grid h-24 w-24 grid-cols-3 gap-1 rounded-md border border-border bg-paper p-case-sm"
        >
          {Array.from({ length: 9 }, (_, index) => (
            <span
              className={cn(
                "rounded-sm",
                index === 0 || index === 2 || index === 6
                  ? "bg-foreground"
                  : index % 2 === 0
                    ? "bg-discovery"
                    : "bg-surface-muted",
              )}
              key={index}
            />
          ))}
        </div>
        <p className="mt-case-md font-semibold text-foreground">
          {copy.createTitle}
        </p>
        <p className="mt-case-sm text-small leading-6 text-text-muted">
          {copy.createDescription}
        </p>
      </div>
    </div>
  );
}

function ExperienceQrCode({
  alt,
  errorCopy,
  payload,
}: {
  alt: string;
  errorCopy: string;
  payload: string;
}) {
  const [state, setState] = React.useState<QrImageState>({
    status: "loading",
  });

  React.useEffect(() => {
    let cancelled = false;

    async function renderQr() {
      try {
        const rootStyles = window.getComputedStyle(document.documentElement);
        const foreground =
          rootStyles.getPropertyValue("--foreground").trim() || "#1F1B16";
        const surface =
          rootStyles.getPropertyValue("--surface").trim() || "#FFFFFF";
        const dataUrl = await QRCode.toDataURL(payload, {
          color: { dark: foreground, light: surface },
          errorCorrectionLevel: "M",
          margin: 2,
          width: 320,
        });

        if (!cancelled) {
          setState({ status: "ready", dataUrl });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error" });
        }
      }
    }

    void renderQr();

    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <div className="aspect-square w-full max-w-[320px] overflow-hidden rounded-lg border border-border bg-surface p-case-sm">
      {state.status === "ready" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt}
          className="h-full w-full object-contain"
          data-checkout-experience-qr
          height={320}
          src={state.dataUrl}
          width={320}
        />
      ) : null}
      {state.status === "loading" ? (
        <Skeleton className="h-full w-full" />
      ) : null}
      {state.status === "error" ? (
        <div className="flex h-full items-center justify-center p-case-md">
          <ErrorMessage>{errorCopy}</ErrorMessage>
        </div>
      ) : null}
    </div>
  );
}

function ExperienceDetail({
  confirmationCode = false,
  label,
  value,
}: {
  confirmationCode?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border-b border-border pb-case-sm">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 break-words font-semibold tabular-nums text-foreground",
          confirmationCode && "text-heading-3 tracking-[0.12em]",
        )}
        data-checkout-experience-code={confirmationCode || undefined}
      >
        {value}
      </dd>
    </div>
  );
}

function getStatusVariant(status: CheckoutExperienceStatus) {
  if (status === "completed") {
    return "success" as const;
  }
  if (status === "pending") {
    return "warning" as const;
  }
  return "error" as const;
}

function getStatusTitle(
  status: CheckoutExperienceStatus | null,
  copy: (typeof checkoutExperienceCopy)[Language],
) {
  if (!status) {
    return copy.pending;
  }
  return copy.statusTitles[status];
}

function getStatusDescription(
  status: CheckoutExperienceStatus | null,
  copy: (typeof checkoutExperienceCopy)[Language],
) {
  if (!status) {
    return copy.pendingDescription;
  }
  return copy.statusDescriptions[status];
}

function formatRemainingTime(valueMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function addLanguageToScanUrl(scanUrl: string, language: Language) {
  const url = new URL(scanUrl);
  url.searchParams.set("lang", language);
  return url.toString();
}
