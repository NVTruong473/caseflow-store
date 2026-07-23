"use client";

import * as React from "react";

import { Badge, Button, ErrorMessage, Input } from "@/components/ui";
import type { CustomerAuthIdentity } from "@/lib/auth/customer";
import type { Language } from "@/lib/i18n/language";
import type { CustomerNotification } from "@/types/notifications";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
};

type InboxData = {
  items: CustomerNotification[];
  smsVerificationAvailable: boolean;
  unreadCount: number;
};

const copyByLanguage = {
  en: {
    code: "6-digit code",
    empty: "Order and account updates will appear here.",
    inbox: "Account notifications",
    inboxError: "Account updates are temporarily unavailable.",
    loading: "Loading account updates",
    markRead: "Mark all as read",
    markingRead: "Updating",
    noPhone: "Save a phone number in your profile before verification.",
    phone: "Phone verification",
    phoneUnavailable:
      "SMS verification is not currently available. Your saved phone number can still be used for delivery contact.",
    phoneVerified: "Phone confirmed",
    phoneUnverified: "Phone not confirmed",
    requestCode: "Send verification code",
    requestingCode: "Sending code",
    retry: "Try again",
    sent: "A verification code was sent to your saved phone number.",
    unread: "unread",
    verificationFailed: "Phone verification could not be completed.",
    verify: "Confirm phone",
    verifying: "Confirming",
  },
  vi: {
    code: "Mã gồm 6 chữ số",
    empty: "Cập nhật về đơn hàng và tài khoản sẽ xuất hiện tại đây.",
    inbox: "Thông báo tài khoản",
    inboxError: "Tạm thời chưa tải được cập nhật tài khoản.",
    loading: "Đang tải cập nhật tài khoản",
    markRead: "Đánh dấu tất cả đã đọc",
    markingRead: "Đang cập nhật",
    noPhone: "Hãy lưu số điện thoại trong hồ sơ trước khi xác minh.",
    phone: "Xác minh số điện thoại",
    phoneUnavailable:
      "Xác minh qua SMS hiện chưa khả dụng. Số đã lưu vẫn được dùng làm thông tin liên hệ giao hàng.",
    phoneVerified: "Số điện thoại đã xác nhận",
    phoneUnverified: "Số điện thoại chưa xác nhận",
    requestCode: "Gửi mã xác nhận",
    requestingCode: "Đang gửi mã",
    retry: "Thử lại",
    sent: "Mã xác nhận đã được gửi tới số điện thoại trong hồ sơ.",
    unread: "chưa đọc",
    verificationFailed: "Chưa thể xác minh số điện thoại.",
    verify: "Xác nhận số điện thoại",
    verifying: "Đang xác nhận",
  },
} as const;

export function CustomerNotificationCenter({
  language,
  user,
}: {
  language: Language;
  user: CustomerAuthIdentity;
}) {
  const copy = copyByLanguage[language];
  const [inbox, setInbox] = React.useState<InboxData | null>(null);
  const [inboxState, setInboxState] = React.useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [markingRead, setMarkingRead] = React.useState(false);
  const [phoneVerifiedLocally, setPhoneVerifiedLocally] = React.useState(false);
  const [challengeId, setChallengeId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [phoneState, setPhoneState] = React.useState<
    "idle" | "requesting" | "sent" | "verifying" | "success" | "error"
  >("idle");
  const [phoneMessage, setPhoneMessage] = React.useState("");

  const loadInbox = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetchCustomerInbox(signal);

      if (!data) {
        setInboxState("error");
        return;
      }

      setInbox(data);
      setInboxState("ready");
    } catch {
      if (signal?.aborted) return;
      setInboxState("error");
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    void fetchCustomerInbox(controller.signal)
      .then((data) => {
        if (!data || controller.signal.aborted) {
          if (!controller.signal.aborted) setInboxState("error");
          return;
        }
        setInbox(data);
        setInboxState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setInboxState("error");
      });
    return () => controller.abort();
  }, []);

  const phoneVerified = user.phoneVerified || phoneVerifiedLocally;

  async function markAllRead() {
    const unreadIds = inbox?.items
      .filter((item) => item.readAt === null)
      .map((item) => item.id);

    if (!unreadIds?.length) return;
    setMarkingRead(true);

    try {
      const response = await fetch("/api/customer/notifications", {
        body: JSON.stringify({ notificationIds: unreadIds }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      if (!response.ok) return;
      const readAt = new Date().toISOString();
      setInbox((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
              unreadCount: 0,
            }
          : current,
      );
    } finally {
      setMarkingRead(false);
    }
  }

  async function requestCode() {
    if (!user.phone) return;
    setPhoneState("requesting");
    setPhoneMessage("");

    try {
      const response = await fetch("/api/customer/phone-verification/request", {
        body: JSON.stringify({ phone: user.phone }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse<{
        challengeId: string;
        expiresAt: string;
      }>;

      if (!response.ok || payload.error || !payload.data) {
        setPhoneState("error");
        setPhoneMessage(payload.error?.message ?? copy.verificationFailed);
        return;
      }

      setChallengeId(payload.data.challengeId);
      setPhoneState("sent");
      setPhoneMessage(copy.sent);
    } catch {
      setPhoneState("error");
      setPhoneMessage(copy.verificationFailed);
    }
  }

  async function verifyCode() {
    if (!challengeId || !/^\d{6}$/.test(code)) return;
    setPhoneState("verifying");
    setPhoneMessage("");

    try {
      const response = await fetch("/api/customer/phone-verification/verify", {
        body: JSON.stringify({ challengeId, code }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse<{ phoneVerified: true }>;

      if (!response.ok || payload.error || !payload.data) {
        setPhoneState("error");
        setPhoneMessage(payload.error?.message ?? copy.verificationFailed);
        return;
      }

      setPhoneVerifiedLocally(true);
      setPhoneState("success");
      setPhoneMessage(copy.phoneVerified);
      void loadInbox();
    } catch {
      setPhoneState("error");
      setPhoneMessage(copy.verificationFailed);
    }
  }

  return (
    <div className="mt-case-lg border-t border-trust/25 pt-case-lg" data-customer-notification-center>
      <section aria-labelledby="customer-inbox-title" data-customer-notification-inbox>
        <div className="flex flex-wrap items-center justify-between gap-case-sm">
          <div>
            <h3 id="customer-inbox-title" className="text-heading-3 font-semibold text-foreground">
              {copy.inbox}
            </h3>
            {inbox && inbox.unreadCount > 0 ? (
              <p className="mt-1 text-small text-text-muted">
                {inbox.unreadCount} {copy.unread}
              </p>
            ) : null}
          </div>
          {inbox && inbox.unreadCount > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              isLoading={markingRead}
              onClick={() => void markAllRead()}
              data-customer-notifications-mark-read
            >
              {markingRead ? copy.markingRead : copy.markRead}
            </Button>
          ) : null}
        </div>

        {inboxState === "loading" ? (
          <p className="mt-case-md text-small text-text-muted" role="status">
            {copy.loading}
          </p>
        ) : null}
        {inboxState === "error" ? (
          <div className="mt-case-md">
            <ErrorMessage>{copy.inboxError}</ErrorMessage>
            <Button
              className="mt-case-sm"
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setInboxState("loading");
                void loadInbox();
              }}
            >
              {copy.retry}
            </Button>
          </div>
        ) : null}
        {inboxState === "ready" && inbox?.items.length === 0 ? (
          <p className="mt-case-md text-small leading-6 text-text-muted">{copy.empty}</p>
        ) : null}
        {inboxState === "ready" && inbox && inbox.items.length > 0 ? (
          <ol className="mt-case-md divide-y divide-border border-y border-border">
            {inbox.items.slice(0, 8).map((item) => (
              <li
                key={item.id}
                className="grid gap-1 py-case-md sm:grid-cols-[12px_minmax(0,1fr)_auto] sm:gap-case-sm"
                data-customer-notification={item.eventType}
                data-customer-notification-read={item.readAt ? "true" : "false"}
              >
                <span
                  aria-hidden="true"
                  className={`mt-2 hidden size-2 rounded-full sm:block ${item.readAt ? "bg-border-strong" : "bg-primary"}`}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{item.title[language]}</p>
                  <p className="mt-1 text-small leading-6 text-text-muted">{item.body[language]}</p>
                </div>
                <time className="text-small text-text-muted" dateTime={item.createdAt}>
                  {formatDate(item.createdAt, language)}
                </time>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <section className="mt-case-lg border-t border-border pt-case-lg" aria-labelledby="phone-verification-title">
        <div className="flex flex-wrap items-start justify-between gap-case-sm">
          <div className="min-w-0">
            <h3 id="phone-verification-title" className="text-heading-3 font-semibold text-foreground">
              {copy.phone}
            </h3>
            <p className="mt-1 break-words text-small text-text-muted">{user.phone ?? copy.noPhone}</p>
          </div>
          <Badge variant={phoneVerified ? "success" : "warning"}>
            {phoneVerified ? copy.phoneVerified : copy.phoneUnverified}
          </Badge>
        </div>

        {!phoneVerified && !user.phone ? (
          <p className="mt-case-md text-small leading-6 text-text-muted">{copy.noPhone}</p>
        ) : null}
        {!phoneVerified && user.phone && inbox && !inbox.smsVerificationAvailable ? (
          <p className="mt-case-md text-small leading-6 text-text-muted">{copy.phoneUnavailable}</p>
        ) : null}
        {!phoneVerified && user.phone && inbox?.smsVerificationAvailable ? (
          <div className="mt-case-md flex flex-col gap-case-sm">
            {!challengeId ? (
              <Button
                type="button"
                variant="secondary"
                isLoading={phoneState === "requesting"}
                onClick={() => void requestCode()}
                data-customer-phone-request-code
              >
                {phoneState === "requesting" ? copy.requestingCode : copy.requestCode}
              </Button>
            ) : (
              <div className="grid gap-case-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <Input
                  label={copy.code}
                  name="phoneVerificationCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
                  data-customer-phone-code
                />
                <Button
                  type="button"
                  isLoading={phoneState === "verifying"}
                  disabled={!/^\d{6}$/.test(code)}
                  onClick={() => void verifyCode()}
                  data-customer-phone-verify
                >
                  {phoneState === "verifying" ? copy.verifying : copy.verify}
                </Button>
              </div>
            )}
          </div>
        ) : null}
        {phoneMessage ? (
          phoneState === "error" ? (
            <div className="mt-case-sm"><ErrorMessage>{phoneMessage}</ErrorMessage></div>
          ) : (
            <p className="mt-case-sm text-small font-medium text-success" role="status">{phoneMessage}</p>
          )
        ) : null}
      </section>
    </div>
  );
}

function formatDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function fetchCustomerInbox(signal?: AbortSignal) {
  const response = await fetch("/api/customer/notifications", {
    cache: "no-store",
    signal,
  });
  const payload = (await response.json()) as ApiResponse<InboxData>;
  return response.ok && !payload.error ? payload.data : null;
}
