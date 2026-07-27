"use client";

import QRCode from "qrcode";
import * as React from "react";

import { Badge, Button, ErrorMessage, Skeleton } from "@/components/ui";
import { storefrontConfig } from "@/config/storefront";
import { checkoutExperienceCopy } from "@/features/checkout/checkout-experience-copy";
import { calculateBookCheckoutTotals } from "@/lib/checkout/book-totals";
import { formatVnd } from "@/lib/format/currency";
import type { CurrencyDisplayRules } from "@/lib/format/currency-display";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";
import type { ValidatedCartData } from "@/types/catalog";

type ExperienceStatus = "pending" | "paid" | "expired";

type ExperienceSession = {
  amountVnd: number;
  expiresAt: number;
  id: string;
  payload: string;
  transferContent: string;
};

type QrImageState =
  | { status: "loading" }
  | { status: "ready"; dataUrl: string }
  | { status: "error" };

const EXPERIENCE_DURATION_MS = 5 * 60 * 1000;
const DEMO_ACCOUNT_NUMBER = "0000000000";

export function CheckoutExperiencePanel({
  cartData,
  currencyRules,
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
  const totalVnd = cartData
    ? calculateBookCheckoutTotals({
        currencyRules,
        paymentMethod: "bank-transfer",
        shippingMethod: "standard",
        subtotalVnd: cartData.subtotal,
      }).totalVnd
    : 0;
  const [session, setSession] = React.useState<ExperienceSession | null>(null);
  const [status, setStatus] = React.useState<ExperienceStatus>("pending");
  const [simulateState, setSimulateState] = React.useState<
    "idle" | "submitting"
  >("idle");
  const [now, setNow] = React.useState(() => Date.now());
  const simulationTimerRef = React.useRef<number | null>(null);
  const activeSession =
    session && session.amountVnd === totalVnd ? session : null;
  const isExpired =
    activeSession !== null &&
    status !== "paid" &&
    now >= activeSession.expiresAt;
  const effectiveStatus: ExperienceStatus = isExpired ? "expired" : status;

  React.useEffect(() => {
    if (!activeSession || effectiveStatus !== "pending") {
      return;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [activeSession, effectiveStatus]);

  React.useEffect(
    () => () => {
      if (simulationTimerRef.current !== null) {
        window.clearTimeout(simulationTimerRef.current);
      }
    },
    [],
  );

  function createExperience() {
    if (!cartData || totalVnd <= 0) {
      return;
    }

    const nextSession = createExperienceSession(totalVnd);

    setNow(nextSession.expiresAt - EXPERIENCE_DURATION_MS);
    setSession(nextSession);
    setStatus("pending");
    setSimulateState("idle");
  }

  function simulateTransfer() {
    if (!activeSession || effectiveStatus !== "pending") {
      return;
    }

    setSimulateState("submitting");
    simulationTimerRef.current = window.setTimeout(() => {
      setStatus("paid");
      setSimulateState("idle");
      simulationTimerRef.current = null;
    }, 500);
  }

  function resetExperience() {
    if (simulationTimerRef.current !== null) {
      window.clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setSession(null);
    setStatus("pending");
    setSimulateState("idle");
  }

  return (
    <section
      aria-labelledby="checkout-experience-tab checkout-experience-title"
      className="grid gap-case-xl lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      data-checkout-experience
      data-experience-persists-payment="false"
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
            {cartData ? formatVnd(totalVnd) : "—"}
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

        {!activeSession && !validationPending && !validationError ? (
          <Button
            className="w-fit"
            disabled={!cartData || totalVnd <= 0}
            onClick={createExperience}
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
          <div className="grid gap-case-lg md:grid-cols-[minmax(220px,300px)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col items-center gap-case-sm">
              <ExperienceQrCode
                alt={copy.qrAlt}
                errorCopy={copy.qrError}
                payload={activeSession.payload}
              />
              <Badge variant="warning">{copy.qrLabel}</Badge>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-case-sm">
                <div>
                  <h3 className="text-heading-3 font-semibold text-foreground">
                    {effectiveStatus === "paid"
                      ? copy.completedTitle
                      : effectiveStatus === "expired"
                        ? copy.expired
                        : copy.pending}
                  </h3>
                  {effectiveStatus === "paid" ? (
                    <p className="mt-case-sm text-small leading-6 text-text-muted">
                      {copy.completedDescription}
                    </p>
                  ) : null}
                </div>
                <Badge
                  variant={
                    effectiveStatus === "paid"
                      ? "success"
                      : effectiveStatus === "expired"
                        ? "error"
                        : "warning"
                  }
                  data-checkout-experience-status={effectiveStatus}
                >
                  {effectiveStatus.toUpperCase()}
                </Badge>
              </div>

              {effectiveStatus === "pending" ? (
                <p
                  className="mt-case-md rounded-md border border-trust/25 bg-trust-muted p-case-sm text-small font-medium text-trust"
                  data-checkout-experience-countdown
                >
                  {copy.timeLeft}:{" "}
                  {formatRemainingTime(activeSession.expiresAt - now)}
                </p>
              ) : null}

              <dl className="mt-case-md grid gap-case-sm">
                <ExperienceDetail label={copy.amount} value={formatVnd(totalVnd)} />
                <ExperienceDetail
                  label={copy.transferContent}
                  value={activeSession.transferContent}
                />
                <ExperienceDetail label={copy.bank} value={copy.bankValue} />
                <ExperienceDetail
                  label={copy.accountNumber}
                  value={DEMO_ACCOUNT_NUMBER}
                />
                <ExperienceDetail
                  label={copy.accountName}
                  value={`${storefrontConfig.name.toUpperCase()} EXPERIENCE`}
                />
              </dl>

              <div className="mt-case-md flex flex-wrap gap-case-sm">
                {effectiveStatus === "pending" ? (
                  <Button
                    isLoading={simulateState === "submitting"}
                    onClick={simulateTransfer}
                    type="button"
                    data-checkout-experience-simulate
                  >
                    {simulateState === "submitting"
                      ? copy.simulating
                      : copy.simulate}
                  </Button>
                ) : null}
                <Button
                  onClick={resetExperience}
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
          color: {
            dark: foreground,
            light: surface,
          },
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
          src={state.dataUrl}
          data-checkout-experience-qr
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

function ExperienceDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-border pb-case-sm">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-1 break-words font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function createExperienceId() {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);

  return randomPart.toUpperCase();
}

function createExperienceSession(amountVnd: number): ExperienceSession {
  const createdAt = Date.now();
  const id = createExperienceId();
  const transferContent = `EXP ${id}`;
  const query = new URLSearchParams({
    amount: amountVnd.toString(),
    content: transferContent,
    currency: "VND",
    session: id,
  });

  return {
    amountVnd,
    expiresAt: createdAt + EXPERIENCE_DURATION_MS,
    id,
    payload: `caseflow-experience://transfer?${query.toString()}`,
    transferContent,
  };
}

function formatRemainingTime(valueMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}
