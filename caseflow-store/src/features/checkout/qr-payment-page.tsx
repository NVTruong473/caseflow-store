"use client";

import QRCode from "qrcode";
import Link from "next/link";
import * as React from "react";

import { Badge, Button, Container, ErrorMessage, Skeleton } from "@/components/ui";
import { storefrontConfig } from "@/config/storefront";
import { formatVnd } from "@/lib/format/currency";
import type { Language } from "@/lib/i18n/language";
import type { PaymentSession } from "@/lib/payments/types";
import type { DemoPaymentProvider, DemoPaymentStatus } from "@/lib/validation/payments";
import { cn } from "@/lib/utils/cn";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type QrPaymentState =
  | { status: "loading" }
  | { status: "ready"; session: PaymentSession }
  | { status: "error"; message: string };

type QrRenderState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; dataUrl: string }
  | { status: "error"; message: string };

const qrPaymentCopy = {
  en: {
    accountName: "Recipient",
    accountNumber: "Demo account number",
    amount: "Amount",
    backToAccountOrders: "Order history",
    bank: "Bank",
    countdownExpired: "Expired",
    countdownPrefix: "Time left",
    createAnother: "Create another QR session",
    createFailed: "Payment session could not be created.",
    cancelledTitle: "Payment was cancelled",
    demoNotice: "DEMO PAYMENT - DO NOT TRANSFER REAL MONEY",
    demoTools: "Demo mode tools",
    description:
      "Review the QR code, order code, amount, and demo transfer content before checking payment status.",
    expiredTitle: "Payment QR has expired",
    failedTitle: "Payment failed",
    loading: "Preparing payment session",
    orderCode: "Order code",
    paidTitle: "Payment confirmed",
    paymentContent: "Transfer content",
    paymentReference: "Payment reference",
    pendingTitle: "Waiting for payment",
    pollError: "Payment status is temporarily unavailable. Retrying shortly.",
    providerMock: "Simulated QR gateway",
    providerTitle: "Payment method",
    providerVietQr: "VietQR Demo",
    qrAlt: `Demo QR code for ${storefrontConfig.name} order payment`,
    qrFailed: "QR image could not be generated.",
    qrNotice: "QR DEMO - NO REAL PAYMENT VALUE",
    refresh: "Refresh status",
    simulate: "Simulate payment success",
    simulateFailed: "Payment simulation could not be completed.",
    simulating: "Simulating",
    title: "QR payment",
    viewOrder: "View order status",
  },
  vi: {
    accountName: "Người nhận",
    accountNumber: "Số tài khoản demo",
    amount: "Số tiền",
    backToAccountOrders: "Lịch sử đơn hàng",
    bank: "Ngân hàng",
    countdownExpired: "Đã hết hạn",
    countdownPrefix: "Thời gian còn lại",
    createAnother: "Tạo lại mã QR",
    createFailed: "Không thể tạo phiên thanh toán.",
    cancelledTitle: "Thanh toán đã bị hủy",
    demoNotice: "THANH TOÁN DEMO - KHÔNG CHUYỂN TIỀN THẬT",
    demoTools: "Công cụ dành cho chế độ Demo",
    description:
      "Kiểm tra mã QR, mã đơn, số tiền và nội dung chuyển khoản demo trước khi theo dõi trạng thái.",
    expiredTitle: "Mã QR thanh toán đã hết hạn",
    failedTitle: "Thanh toán thất bại",
    loading: "Đang chuẩn bị phiên thanh toán",
    orderCode: "Mã đơn hàng",
    paidTitle: "Thanh toán thành công",
    paymentContent: "Nội dung chuyển khoản",
    paymentReference: "Mã thanh toán",
    pendingTitle: "Đang chờ thanh toán",
    pollError: "Tạm thời chưa đọc được trạng thái thanh toán. Hệ thống sẽ thử lại.",
    providerMock: "Cổng thanh toán QR giả lập",
    providerTitle: "Phương thức thanh toán",
    providerVietQr: "VietQR Demo",
    qrAlt: `Mã QR demo cho thanh toán đơn ${storefrontConfig.name}`,
    qrFailed: "Không thể tạo hình ảnh QR.",
    qrNotice: "QR DEMO - KHÔNG CÓ GIÁ TRỊ THANH TOÁN THẬT",
    refresh: "Cập nhật trạng thái",
    simulate: "Giả lập thanh toán thành công",
    simulateFailed: "Chưa thể giả lập thanh toán.",
    simulating: "Đang giả lập",
    title: "Thanh toán QR",
    viewOrder: "Xem tình trạng đơn",
  },
} as const;

const terminalStatuses = new Set<DemoPaymentStatus>([
  "PAID",
  "EXPIRED",
  "FAILED",
  "CANCELLED",
]);

export function QrPaymentPage({
  initialOrderCode,
  initialProvider,
  language,
}: {
  initialOrderCode: string | null;
  initialProvider: DemoPaymentProvider;
  language: Language;
}) {
  const copy = qrPaymentCopy[language];
  const [provider, setProvider] =
    React.useState<DemoPaymentProvider>(initialProvider);
  const [state, setState] = React.useState<QrPaymentState>({ status: "loading" });
  const [simulateState, setSimulateState] = React.useState<
    "idle" | "submitting"
  >("idle");
  const [pollMessage, setPollMessage] = React.useState<string | null>(null);

  const orderCode = initialOrderCode?.trim().toUpperCase() ?? "";

  const createSession = React.useCallback(async () => {
    if (!orderCode) {
      setState({ status: "error", message: copy.createFailed });
      return;
    }

    setState({ status: "loading" });
    setPollMessage(null);

    try {
      const response = await fetch("/api/payments", {
        body: JSON.stringify({ orderId: orderCode, provider }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse<PaymentSession>;

      if (!response.ok || payload.error || !payload.data) {
        setState({
          status: "error",
          message: payload.error?.message ?? copy.createFailed,
        });
        return;
      }

      setState({ status: "ready", session: payload.data });
    } catch {
      setState({ status: "error", message: copy.createFailed });
    }
  }, [copy.createFailed, orderCode, provider]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void createSession();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [createSession]);

  React.useEffect(() => {
    if (state.status !== "ready" || terminalStatuses.has(state.session.status)) {
      return;
    }

    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/payments/${encodeURIComponent(state.session.paymentId)}`,
          { method: "GET" },
        );
        const payload = (await response.json()) as ApiResponse<PaymentSession>;

        if (cancelled) {
          return;
        }

        if (!response.ok || payload.error || !payload.data) {
          setPollMessage(copy.pollError);
          return;
        }

        setPollMessage(null);
        setState({ status: "ready", session: payload.data });

        if (terminalStatuses.has(payload.data.status)) {
          window.clearInterval(interval);
        }
      } catch {
        if (!cancelled) {
          setPollMessage(copy.pollError);
        }
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [copy.pollError, state]);

  async function refreshStatus() {
    if (state.status !== "ready") {
      return;
    }

    try {
      const response = await fetch(
        `/api/payments/${encodeURIComponent(state.session.paymentId)}`,
        { method: "GET" },
      );
      const payload = (await response.json()) as ApiResponse<PaymentSession>;

      if (!response.ok || payload.error || !payload.data) {
        setPollMessage(payload.error?.message ?? copy.pollError);
        return;
      }

      setPollMessage(null);
      setState({ status: "ready", session: payload.data });
    } catch {
      setPollMessage(copy.pollError);
    }
  }

  async function simulateSuccess() {
    if (state.status !== "ready" || simulateState === "submitting") {
      return;
    }

    setSimulateState("submitting");

    try {
      const response = await fetch(
        `/api/dev/payments/${encodeURIComponent(
          state.session.paymentId,
        )}/simulate-success`,
        { method: "POST" },
      );
      const payload = (await response.json()) as ApiResponse<PaymentSession>;

      if (!response.ok || payload.error || !payload.data) {
        setPollMessage(payload.error?.message ?? copy.simulateFailed);
        return;
      }

      setPollMessage(null);
      setState({ status: "ready", session: payload.data });
    } catch {
      setPollMessage(copy.simulateFailed);
    } finally {
      setSimulateState("idle");
    }
  }

  return (
    <main className="bg-background py-case-2xl text-foreground" data-qr-payment-page>
      <Container className="grid gap-case-xl">
        <div className="flex flex-col gap-case-md">
          <Link
            href="/account/orders"
            className="w-fit text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.backToAccountOrders}
          </Link>
          <div className="max-w-3xl">
            <Badge className="border-warning bg-offer-muted text-warning">
              {copy.demoNotice}
            </Badge>
            <h1 className="mt-case-md text-heading-1 font-semibold text-foreground">
              {copy.title}
            </h1>
            <p className="mt-case-sm text-body leading-7 text-text-muted">
              {copy.description}
            </p>
          </div>
          <ProviderChoice provider={provider} setProvider={setProvider} copy={copy} />
        </div>

        {state.status === "loading" ? <QrPaymentLoading copy={copy} /> : null}
        {state.status === "error" ? (
          <section className="rounded-lg border border-error/30 bg-surface p-case-lg">
            <ErrorMessage>{state.message}</ErrorMessage>
            <Button className="mt-case-md" type="button" onClick={createSession}>
              {copy.createAnother}
            </Button>
          </section>
        ) : null}
        {state.status === "ready" ? (
          <QrPaymentSessionView
            copy={copy}
            onCreateSession={createSession}
            onRefreshStatus={refreshStatus}
            onSimulateSuccess={simulateSuccess}
            pollMessage={pollMessage}
            session={state.session}
            simulateState={simulateState}
          />
        ) : null}
      </Container>
    </main>
  );
}

function ProviderChoice({
  copy,
  provider,
  setProvider,
}: {
  copy: (typeof qrPaymentCopy)[Language];
  provider: DemoPaymentProvider;
  setProvider: (provider: DemoPaymentProvider) => void;
}) {
  const options: Array<{ label: string; value: DemoPaymentProvider }> = [
    { label: copy.providerMock, value: "MOCK_GATEWAY" },
    { label: copy.providerVietQr, value: "DEMO_VIETQR" },
  ];

  return (
    <section
      className="grid gap-case-sm rounded-lg border border-border bg-surface p-case-md sm:grid-cols-2"
      data-qr-payment-provider-choice
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-case-sm rounded-md border border-border bg-paper p-case-sm hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
        >
          <input
            checked={provider === option.value}
            className="h-4 w-4 accent-primary"
            name="qrPaymentProvider"
            onChange={() => setProvider(option.value)}
            type="radio"
          />
          <span className="font-medium text-foreground">{option.label}</span>
        </label>
      ))}
    </section>
  );
}

function QrPaymentLoading({ copy }: { copy: (typeof qrPaymentCopy)[Language] }) {
  return (
    <section className="grid gap-case-lg rounded-lg border border-border bg-surface p-case-lg lg:grid-cols-[320px_minmax(0,1fr)]">
      <div>
        <Skeleton className="aspect-square w-full max-w-72" />
      </div>
      <div className="grid gap-case-md">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <p className="text-small text-text-muted">{copy.loading}</p>
      </div>
    </section>
  );
}

function QrPaymentSessionView({
  copy,
  onCreateSession,
  onRefreshStatus,
  onSimulateSuccess,
  pollMessage,
  session,
  simulateState,
}: {
  copy: (typeof qrPaymentCopy)[Language];
  onCreateSession: () => void;
  onRefreshStatus: () => void;
  onSimulateSuccess: () => void;
  pollMessage: string | null;
  session: PaymentSession;
  simulateState: "idle" | "submitting";
}) {
  const isTerminal = terminalStatuses.has(session.status);
  const canSimulate =
    session.allowSimulation &&
    session.status === "PENDING" &&
    new Date(session.expiresAt).getTime() > new Date(session.serverTime).getTime();

  return (
    <section
      className="grid gap-case-lg rounded-lg border border-border bg-surface p-case-md shadow-[var(--case-shadow-soft)] lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:p-case-lg"
      data-qr-payment-session
      data-qr-payment-id={session.paymentId}
      data-qr-payment-status={session.status}
      data-qr-payment-provider={session.provider}
      data-qr-payment-simulation={session.allowSimulation ? "allowed" : "locked"}
    >
      <div className="min-w-0">
        <QrCodeImage copy={copy} payload={session.qrPayload} />
        <Badge className="mt-case-md border-warning bg-offer-muted text-warning">
          {copy.qrNotice}
        </Badge>
      </div>

      <div className="min-w-0">
        <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-heading-2 font-semibold text-foreground">
              {getStatusTitle(session.status, copy)}
            </h2>
            <p className="mt-case-xs text-small text-text-muted">
              {copy.providerTitle}: {getProviderLabel(session.provider, copy)}
            </p>
          </div>
          <PaymentStatusBadge status={session.status} />
        </div>

        <PaymentCountdown
          key={`${session.paymentId}-${session.expiresAt}-${session.serverTime}`}
          copy={copy}
          expiresAt={session.expiresAt}
          serverTime={session.serverTime}
        />

        {pollMessage ? (
          <p className="mt-case-md rounded-md border border-warning/30 bg-offer-muted p-case-sm text-small text-warning">
            {pollMessage}
          </p>
        ) : null}

        <dl className="mt-case-lg grid gap-case-sm text-small sm:grid-cols-2">
          <PaymentDetail label={copy.orderCode} value={session.order.orderCode} />
          <PaymentDetail label={copy.paymentReference} value={session.paymentReference} />
          <PaymentDetail label={copy.amount} value={formatVnd(session.amount)} />
          <PaymentDetail label={copy.paymentContent} value={session.paymentContent} />
          <PaymentDetail label={copy.bank} value={session.merchant.bankName} />
          <PaymentDetail label={copy.accountNumber} value={session.merchant.accountNumber} />
          <PaymentDetail label={copy.accountName} value={session.merchant.accountName} />
        </dl>

        <div className="mt-case-lg flex flex-col gap-case-sm sm:flex-row sm:flex-wrap">
          <Button type="button" variant="secondary" onClick={onRefreshStatus}>
            {copy.refresh}
          </Button>
          {session.status === "EXPIRED" ? (
            <Button type="button" onClick={onCreateSession}>
              {copy.createAnother}
            </Button>
          ) : null}
          <Link
            href={`/orders/track?orderCode=${encodeURIComponent(
              session.order.orderCode,
            )}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-small font-medium text-foreground hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.viewOrder}
          </Link>
        </div>

        {session.allowSimulation ? (
          <div
            className="mt-case-lg rounded-md border border-admin/20 bg-admin-muted p-case-md"
            data-qr-payment-demo-tools
          >
            <h3 className="text-small font-semibold text-foreground">
              {copy.demoTools}
            </h3>
            <Button
              className="mt-case-sm"
              disabled={!canSimulate || isTerminal}
              isLoading={simulateState === "submitting"}
              onClick={onSimulateSuccess}
              type="button"
              data-qr-payment-simulate
            >
              {simulateState === "submitting" ? copy.simulating : copy.simulate}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function QrCodeImage({
  copy,
  payload,
}: {
  copy: (typeof qrPaymentCopy)[Language];
  payload: string;
}) {
  const [state, setState] = React.useState<QrRenderState>({ status: "idle" });

  React.useEffect(() => {
    let cancelled = false;

    async function renderQr() {
      setState({ status: "loading" });

      try {
        const rootStyles = window.getComputedStyle(document.documentElement);
        const foreground =
          rootStyles.getPropertyValue("--foreground").trim() || "CanvasText";
        const surface =
          rootStyles.getPropertyValue("--surface").trim() || "Canvas";
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
          setState({ status: "error", message: copy.qrFailed });
        }
      }
    }

    void renderQr();

    return () => {
      cancelled = true;
    };
  }, [copy.qrFailed, payload]);

  return (
    <div className="aspect-square w-full max-w-[320px] overflow-hidden rounded-lg border border-border bg-surface p-case-sm">
      {state.status === "ready" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={copy.qrAlt}
          className="h-full w-full object-contain"
          src={state.dataUrl}
          data-qr-payment-image
        />
      ) : null}
      {state.status === "loading" || state.status === "idle" ? (
        <div className="flex h-full items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      ) : null}
      {state.status === "error" ? (
        <div className="flex h-full items-center justify-center p-case-md">
          <ErrorMessage>{state.message}</ErrorMessage>
        </div>
      ) : null}
    </div>
  );
}

function PaymentCountdown({
  copy,
  expiresAt,
  serverTime,
}: {
  copy: (typeof qrPaymentCopy)[Language];
  expiresAt: string;
  serverTime: string;
}) {
  const initialRemainingMs = Math.max(
    0,
    new Date(expiresAt).getTime() - new Date(serverTime).getTime(),
  );
  const [remainingMs, setRemainingMs] = React.useState(initialRemainingMs);

  React.useEffect(() => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setRemainingMs(Math.max(0, initialRemainingMs - (Date.now() - startedAt)));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [initialRemainingMs]);

  return (
    <p
      className={cn(
        "mt-case-md rounded-md border p-case-sm text-small font-medium",
        remainingMs === 0
          ? "border-error/30 bg-error/10 text-error"
          : "border-trust/25 bg-trust-muted text-trust",
      )}
      data-qr-payment-countdown
    >
      {remainingMs === 0
        ? copy.countdownExpired
        : `${copy.countdownPrefix}: ${formatRemainingTime(remainingMs)}`}
    </p>
  );
}

function PaymentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-paper p-case-sm">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: DemoPaymentStatus }) {
  const variant =
    status === "PAID"
      ? "success"
      : status === "EXPIRED" || status === "FAILED"
        ? "error"
        : status === "CANCELLED"
          ? "neutral"
          : "warning";

  return <Badge variant={variant}>{status}</Badge>;
}

function getStatusTitle(
  status: DemoPaymentStatus,
  copy: (typeof qrPaymentCopy)[Language],
) {
  switch (status) {
    case "PAID":
      return copy.paidTitle;
    case "EXPIRED":
      return copy.expiredTitle;
    case "FAILED":
      return copy.failedTitle;
    case "CANCELLED":
      return copy.cancelledTitle;
    case "PENDING":
      return copy.pendingTitle;
  }
}

function getProviderLabel(
  provider: DemoPaymentProvider,
  copy: (typeof qrPaymentCopy)[Language],
) {
  return provider === "DEMO_VIETQR" ? copy.providerVietQr : copy.providerMock;
}

function formatRemainingTime(valueMs: number) {
  const totalSeconds = Math.ceil(valueMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}
