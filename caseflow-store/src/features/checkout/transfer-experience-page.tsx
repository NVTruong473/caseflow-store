"use client";

import * as React from "react";

import {
  Badge,
  Button,
  Container,
  ErrorMessage,
  Input,
  Skeleton,
} from "@/components/ui";
import { storefrontConfig } from "@/config/storefront";
import { formatVnd } from "@/lib/format/currency";
import type { Language } from "@/lib/i18n/language";
import type { CheckoutExperienceSession } from "@/types/checkout-experience";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type PageState =
  | { status: "loading" }
  | { status: "invalid-link" }
  | { status: "error"; message: string }
  | { status: "ready"; session: CheckoutExperienceSession };

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,128}$/;

export function TransferExperiencePage({ language }: { language: Language }) {
  const copy = transferExperienceCopy[language];
  const [pageState, setPageState] =
    React.useState<PageState>({ status: "loading" });
  const [amount, setAmount] = React.useState("");
  const [confirmationCode, setConfirmationCode] = React.useState("");
  const [submitState, setSubmitState] = React.useState<
    "idle" | "submitting"
  >("idle");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = React.useState(0);
  const [now, setNow] = React.useState(() => Date.now());
  const token = useFragmentToken();

  const loadSession = React.useCallback(
    async (options: { quiet?: boolean } = {}) => {
      if (token === null) {
        return;
      }
      if (!TOKEN_PATTERN.test(token)) {
        setPageState({ status: "invalid-link" });
        return;
      }
      if (!options.quiet) {
        setPageState({ status: "loading" });
      }

      try {
        const response = await fetch("/api/checkout-experience/status", {
          body: JSON.stringify({ token }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const payload =
          (await response.json()) as ApiResponse<CheckoutExperienceSession>;

        if (!response.ok || !payload.data) {
          if (response.status === 404) {
            setPageState({ status: "invalid-link" });
            return;
          }
          throw new Error(payload.error?.message ?? copy.loadError);
        }

        setServerOffsetMs(Date.parse(payload.data.serverTime) - Date.now());
        setPageState({ status: "ready", session: payload.data });
      } catch {
        setPageState({ status: "error", message: copy.loadError });
      }
    },
    [copy.loadError, token],
  );

  React.useEffect(() => {
    if (token === null) {
      return;
    }

    const timeout = window.setTimeout(() => void loadSession(), 0);

    return () => window.clearTimeout(timeout);
  }, [loadSession, token]);

  React.useEffect(() => {
    if (
      pageState.status !== "ready" ||
      pageState.session.status !== "pending"
    ) {
      return;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(
      () => void loadSession({ quiet: true }),
      3000,
    );

    return () => {
      window.clearInterval(interval);
      window.clearInterval(poll);
    };
  }, [loadSession, pageState]);

  async function submitExperience(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      pageState.status !== "ready" ||
      pageState.session.status !== "pending" ||
      !token
    ) {
      return;
    }

    const amountVnd = Number(amount);
    if (!Number.isInteger(amountVnd) || amountVnd !== pageState.session.amountVnd) {
      setFormError(copy.amountMismatch);
      return;
    }
    if (!/^\d{6}$/.test(confirmationCode)) {
      setFormError(copy.codeInvalid);
      return;
    }

    setSubmitState("submitting");
    setFormError(null);

    try {
      const response = await fetch("/api/checkout-experience/complete", {
        body: JSON.stringify({ amountVnd, confirmationCode, token }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload =
        (await response.json()) as ApiResponse<CheckoutExperienceSession>;

      if (!response.ok || !payload.data) {
        await loadSession({ quiet: true });
        setFormError(
          response.status === 423
            ? copy.lockedError
            : response.status === 410
              ? copy.expiredError
              : copy.confirmationInvalid,
        );
        return;
      }

      setServerOffsetMs(Date.parse(payload.data.serverTime) - Date.now());
      setPageState({ status: "ready", session: payload.data });
      setAmount("");
      setConfirmationCode("");
    } catch {
      setFormError(copy.submitError);
    } finally {
      setSubmitState("idle");
    }
  }

  return (
    <main
      className="bg-background py-case-xl text-foreground md:py-case-2xl"
      data-transfer-experience-page
    >
      <Container className="grid gap-case-lg" maxWidth="sm">
        <header className="border-l-4 border-warning pl-case-md">
          <Badge variant="warning">{copy.badge}</Badge>
          <h1 className="mt-case-sm text-heading-1 font-semibold">
            {copy.title}
          </h1>
          <p className="mt-case-sm max-w-2xl leading-7 text-text-muted">
            {copy.description}
          </p>
        </header>

        <div
          className="border-y border-warning/45 bg-offer-muted px-case-md py-case-sm text-small font-semibold leading-6 text-warning"
          data-transfer-experience-warning
        >
          {copy.warning}
        </div>

        {token === null || pageState.status === "loading" ? (
          <TransferLoading />
        ) : null}

        {pageState.status === "invalid-link" ? (
          <TransferState
            description={copy.invalidLinkDescription}
            title={copy.invalidLinkTitle}
            tone="error"
          />
        ) : null}

        {pageState.status === "error" ? (
          <div className="grid gap-case-md border-y border-border py-case-lg">
            <ErrorMessage>{pageState.message}</ErrorMessage>
            <Button
              className="w-fit"
              onClick={() => void loadSession()}
              type="button"
              variant="secondary"
              data-transfer-experience-retry
            >
              {copy.retry}
            </Button>
          </div>
        ) : null}

        {pageState.status === "ready" ? (
          <TransferSession
            amount={amount}
            confirmationCode={confirmationCode}
            copy={copy}
            formError={formError}
            language={language}
            now={now + serverOffsetMs}
            onAmountChange={setAmount}
            onCodeChange={setConfirmationCode}
            onSubmit={submitExperience}
            session={pageState.session}
            submitState={submitState}
          />
        ) : null}

        <p className="text-small leading-6 text-text-muted">
          {copy.privacyNote}
        </p>
      </Container>
    </main>
  );
}

function TransferSession({
  amount,
  confirmationCode,
  copy,
  formError,
  language,
  now,
  onAmountChange,
  onCodeChange,
  onSubmit,
  session,
  submitState,
}: {
  amount: string;
  confirmationCode: string;
  copy: (typeof transferExperienceCopy)[Language];
  formError: string | null;
  language: Language;
  now: number;
  onAmountChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  session: CheckoutExperienceSession;
  submitState: "idle" | "submitting";
}) {
  const effectiveStatus =
    session.status === "pending" && Date.parse(session.expiresAt) <= now
      ? "expired"
      : session.status;

  if (effectiveStatus !== "pending") {
    return (
      <TransferState
        description={copy.statusDescriptions[effectiveStatus]}
        title={copy.statusTitles[effectiveStatus]}
        tone={effectiveStatus === "completed" ? "success" : "error"}
      />
    );
  }

  return (
    <div className="grid gap-case-lg lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <section
        aria-labelledby="transfer-recipient-title"
        className="border-y border-border py-case-md"
      >
        <h2
          className="text-heading-3 font-semibold"
          id="transfer-recipient-title"
        >
          {copy.recipientTitle}
        </h2>
        <dl className="mt-case-md grid gap-case-sm">
          <TransferDetail
            label={copy.accountName}
            value={session.merchant.accountName}
          />
          <TransferDetail
            label={copy.accountNumber}
            value={session.merchant.accountNumber}
          />
          <TransferDetail
            label={copy.bank}
            value={session.merchant.bankName}
          />
          <TransferDetail
            label={copy.transferContent}
            value={session.transferContent}
          />
          <TransferDetail
            label={copy.expectedAmount}
            value={formatVnd(session.amountVnd)}
          />
        </dl>
        <p
          className="mt-case-md font-semibold tabular-nums text-primary"
          data-transfer-experience-countdown
        >
          {copy.timeLeft}:{" "}
          {formatRemainingTime(Date.parse(session.expiresAt) - now)}
        </p>
      </section>

      <form
        className="grid gap-case-md rounded-lg border border-border bg-surface p-case-md shadow-card"
        noValidate
        onSubmit={onSubmit}
        data-transfer-experience-form
      >
        <div>
          <h2 className="text-heading-3 font-semibold">
            {copy.confirmTitle}
          </h2>
          <p className="mt-1 text-small leading-6 text-text-muted">
            {copy.confirmDescription}
          </p>
        </div>
        <Input
          autoComplete="off"
          inputMode="numeric"
          label={copy.amountLabel}
          maxLength={9}
          onChange={(event) =>
            onAmountChange(event.target.value.replace(/\D/g, ""))
          }
          placeholder={session.amountVnd.toString()}
          value={amount}
          data-transfer-experience-amount-input
        />
        <Input
          autoComplete="one-time-code"
          className="text-center text-heading-3 tracking-[0.12em]"
          inputMode="numeric"
          label={copy.codeLabel}
          maxLength={6}
          onChange={(event) =>
            onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="000000"
          value={confirmationCode}
          data-transfer-experience-code-input
        />
        <ErrorMessage>{formError}</ErrorMessage>
        <p className="text-small text-text-muted">
          {copy.attemptsRemaining(session.failedAttemptsRemaining)}
        </p>
        <Button
          isLoading={submitState === "submitting"}
          type="submit"
          data-transfer-experience-submit
        >
          {submitState === "submitting" ? copy.confirming : copy.confirm}
        </Button>
        <p className="text-small leading-6 text-warning">
          {language === "vi"
            ? "Không nhập mật khẩu tài khoản hoặc thông tin ngân hàng."
            : "Do not enter an account password or bank credentials."}
        </p>
      </form>
    </div>
  );
}

function TransferState({
  description,
  title,
  tone,
}: {
  description: string;
  title: string;
  tone: "error" | "success";
}) {
  return (
    <section
      className={
        tone === "success"
          ? "border-y border-success/35 bg-trust-muted px-case-md py-case-lg"
          : "border-y border-error/35 bg-offer-muted px-case-md py-case-lg"
      }
      data-transfer-experience-status={tone}
    >
      <h2 className="text-heading-2 font-semibold">{title}</h2>
      <p className="mt-case-sm leading-7 text-text-muted">{description}</p>
    </section>
  );
}

function TransferDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-border pb-case-sm">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-1 break-words font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function TransferLoading() {
  return (
    <div className="grid gap-case-md" data-transfer-experience-loading>
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function useFragmentToken() {
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    function readToken() {
      setToken(window.location.hash.slice(1).trim());
    }

    readToken();
    window.addEventListener("hashchange", readToken);

    return () => window.removeEventListener("hashchange", readToken);
  }, []);

  return token;
}

function formatRemainingTime(valueMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

const transferExperienceCopy = {
  en: {
    accountName: "Recipient",
    accountNumber: "Experience account",
    amountLabel: "Enter the exact amount",
    amountMismatch: "Enter the exact amount shown in the transfer details.",
    attemptsRemaining: (count: number) => `${count} attempts remaining.`,
    badge: "Phone transfer experience",
    bank: "Environment",
    codeInvalid: "Enter the six-digit code shown on the checkout screen.",
    codeLabel: "Six-digit confirmation code",
    confirm: "Confirm experience transfer",
    confirmDescription:
      "Match both values with the desktop checkout. This action records only the experience-session result.",
    confirmTitle: "Confirm the practice transfer",
    confirmationInvalid:
      "The amount or confirmation code is incorrect. Check the desktop screen and try again.",
    confirming: "Confirming",
    description:
      "This page reproduces the confirmation step of a bank transfer without connecting to a bank, wallet, or real payment account.",
    expectedAmount: "Amount to enter",
    expiredError: "This experience session has expired.",
    invalidLinkDescription:
      "Scan a new QR from the checkout Experience tab. Do not edit or share the QR URL.",
    invalidLinkTitle: "This experience link is invalid",
    loadError:
      "The experience session is temporarily unavailable. Check the connection and retry.",
    lockedError:
      "This session is locked after too many incorrect attempts. Create a new QR on the desktop.",
    privacyNote:
      "The phone page receives only an expiring session capability and transfer-display fields. It does not receive the customer name, email, address, cart lines, or password.",
    recipientTitle: "Experience recipient",
    retry: "Retry",
    statusDescriptions: {
      cancelled: "The desktop closed this session. No order or payment exists.",
      completed:
        "The matching values were confirmed. The desktop will update automatically. No order or payment was created.",
      expired: "The session expired. Create and scan a new QR from checkout.",
      locked:
        "Too many attempts were incorrect. Create and scan a new QR from checkout.",
      pending: "Waiting for confirmation.",
    },
    statusTitles: {
      cancelled: "Experience session closed",
      completed: "Experience transfer confirmed",
      expired: "Experience QR expired",
      locked: "Experience session locked",
      pending: "Waiting for confirmation",
    },
    submitError:
      "The confirmation could not be sent. Check the connection and try again.",
    timeLeft: "Time left",
    title: `${storefrontConfig.name} transfer experience`,
    transferContent: "Transfer content",
    warning: "EXPERIENCE ONLY - DO NOT TRANSFER REAL MONEY",
  },
  vi: {
    accountName: "Tên người nhận",
    accountNumber: "Số tài khoản trải nghiệm",
    amountLabel: "Nhập đúng số tiền",
    amountMismatch:
      "Hãy nhập chính xác số tiền trong phần thông tin chuyển khoản.",
    attemptsRemaining: (count: number) => `Còn ${count} lần thử.`,
    badge: "Trải nghiệm chuyển khoản trên điện thoại",
    bank: "Môi trường",
    codeInvalid: "Hãy nhập mã sáu số đang hiển thị trên trang thanh toán.",
    codeLabel: "Mã xác nhận sáu số",
    confirm: "Xác nhận chuyển khoản trải nghiệm",
    confirmDescription:
      "Đối chiếu cả hai giá trị với trang thanh toán trên máy tính. Thao tác này chỉ ghi nhận kết quả của phiên trải nghiệm.",
    confirmTitle: "Xác nhận chuyển khoản thực hành",
    confirmationInvalid:
      "Số tiền hoặc mã xác nhận chưa đúng. Hãy kiểm tra màn hình máy tính và thử lại.",
    confirming: "Đang xác nhận",
    description:
      "Trang này tái hiện bước xác nhận chuyển khoản nhưng không kết nối ngân hàng, ví điện tử hoặc tài khoản thanh toán thật.",
    expectedAmount: "Số tiền cần nhập",
    expiredError: "Phiên trải nghiệm này đã hết hạn.",
    invalidLinkDescription:
      "Hãy quét QR mới từ tab Trải nghiệm tại trang thanh toán. Không chỉnh sửa hoặc chia sẻ URL của QR.",
    invalidLinkTitle: "Liên kết trải nghiệm không hợp lệ",
    loadError:
      "Tạm thời chưa tải được phiên trải nghiệm. Hãy kiểm tra kết nối và thử lại.",
    lockedError:
      "Phiên đã bị khóa do nhập sai quá nhiều lần. Hãy tạo QR mới trên máy tính.",
    privacyNote:
      "Trang điện thoại chỉ nhận capability có thời hạn và thông tin hiển thị chuyển khoản. Trang không nhận tên khách hàng, email, địa chỉ, danh sách giỏ hàng hoặc mật khẩu.",
    recipientTitle: "Người nhận trải nghiệm",
    retry: "Thử lại",
    statusDescriptions: {
      cancelled:
        "Máy tính đã đóng phiên này. Không có đơn hàng hoặc thanh toán nào được tạo.",
      completed:
        "Các giá trị đã khớp. Màn hình máy tính sẽ tự cập nhật. Không có đơn hàng hoặc thanh toán nào được tạo.",
      expired: "Phiên đã hết hạn. Hãy tạo và quét QR mới từ trang thanh toán.",
      locked:
        "Đã nhập sai quá số lần cho phép. Hãy tạo và quét QR mới từ trang thanh toán.",
      pending: "Đang chờ xác nhận.",
    },
    statusTitles: {
      cancelled: "Phiên trải nghiệm đã đóng",
      completed: "Đã xác nhận chuyển khoản trải nghiệm",
      expired: "QR trải nghiệm đã hết hạn",
      locked: "Phiên trải nghiệm đã bị khóa",
      pending: "Đang chờ xác nhận",
    },
    submitError:
      "Chưa gửi được xác nhận. Hãy kiểm tra kết nối và thử lại.",
    timeLeft: "Thời gian còn lại",
    title: `Trải nghiệm chuyển khoản ${storefrontConfig.name}`,
    transferContent: "Nội dung chuyển khoản",
    warning: "CHỈ LÀ TRẢI NGHIỆM - KHÔNG CHUYỂN TIỀN THẬT",
  },
} as const;
