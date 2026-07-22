"use client";

import * as React from "react";

import { Badge, Button, ErrorMessage, Input } from "@/components/ui";
import type { AdminPermission, AdminWorkspaceRole } from "@/lib/auth/admin";
import type { Language } from "@/lib/i18n/language";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  NOTIFICATION_STATUSES,
  type AdminNotificationOperationsItem,
  type NotificationConfigurationSummary,
  type NotificationStatus,
} from "@/types/notifications";

import { AdminShellPage } from "./admin-shell-page";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
};

type FilterState = {
  channel: string;
  eventType: string;
  q: string;
  status: string;
};

const copyByLanguage = {
  en: {
    attempts: "Attempts",
    badge: "Notifications",
    channel: "Channel",
    config: "Delivery configuration",
    configAdminOnly: "Provider readiness is visible to admins only.",
    configLabels: {
      dispatch: "Dispatcher",
      email: "Email",
      mode: "Mode",
      otp: "Phone OTP",
      sms: "SMS",
    },
    created: "Created",
    description:
      "Inspect transactional delivery without exposing customer contact details, OTP codes, secrets, or provider payloads.",
    empty: "No notification delivery matches these filters.",
    event: "Event",
    filter: "Apply filters",
    loadError: "Notification operations could not be loaded.",
    loading: "Loading notification deliveries...",
    order: "Order",
    providerIssues: "Configuration checks",
    recipient: "Recipient reference",
    refresh: "Refresh",
    retry: "Retry",
    retryError: "This delivery could not be retried.",
    retrySuccess: "Delivery was processed through the notification queue.",
    search: "Search order code, event, customer reference, or delivery ID",
    status: "Status",
    title: "Notification operations",
    updated: "Updated",
  },
  vi: {
    attempts: "Số lần thử",
    badge: "Thông báo",
    channel: "Kênh",
    config: "Cấu hình chuyển phát",
    configAdminOnly: "Chỉ admin được xem trạng thái sẵn sàng của nhà cung cấp.",
    configLabels: {
      dispatch: "Bộ điều phối",
      email: "Email",
      mode: "Chế độ",
      otp: "OTP điện thoại",
      sms: "SMS",
    },
    created: "Tạo lúc",
    description:
      "Theo dõi chuyển phát giao dịch mà không để lộ thông tin liên hệ, mã OTP, secret hoặc payload nhà cung cấp.",
    empty: "Không có lượt chuyển phát nào khớp bộ lọc.",
    event: "Sự kiện",
    filter: "Lọc kết quả",
    loadError: "Không thể tải dữ liệu vận hành thông báo.",
    loading: "Đang tải dữ liệu chuyển phát...",
    order: "Đơn hàng",
    providerIssues: "Kiểm tra cấu hình",
    recipient: "Tham chiếu người nhận",
    refresh: "Làm mới",
    retry: "Gửi lại",
    retryError: "Không thể gửi lại thông báo này.",
    retrySuccess: "Lượt chuyển phát đã được xử lý lại qua hàng đợi thông báo.",
    search: "Tìm mã đơn, sự kiện, tham chiếu khách hoặc mã chuyển phát",
    status: "Trạng thái",
    title: "Vận hành thông báo",
    updated: "Cập nhật",
  },
} as const;

const statusVariants: Record<
  NotificationStatus,
  "neutral" | "primary" | "success" | "warning" | "error"
> = {
  blocked: "warning",
  failed: "error",
  processing: "primary",
  queued: "neutral",
  sent: "success",
};

const initialFilters: FilterState = {
  channel: "",
  eventType: "",
  q: "",
  status: "",
};

export function AdminNotificationsPage({
  adminName,
  adminPermissions,
  adminRole,
  initialConfiguration,
  initialLoadError,
  initialNotifications,
  language,
}: {
  adminName: string;
  adminPermissions: AdminPermission[];
  adminRole: AdminWorkspaceRole;
  initialConfiguration: NotificationConfigurationSummary | null;
  initialLoadError?: string | null;
  initialNotifications: AdminNotificationOperationsItem[];
  language: Language;
}) {
  const copy = copyByLanguage[language];
  const [filters, setFilters] = React.useState<FilterState>(initialFilters);
  const [items, setItems] = React.useState(initialNotifications);
  const [loadState, setLoadState] = React.useState<
    "idle" | "loading" | "error"
  >(initialLoadError ? "error" : "idle");
  const [feedback, setFeedback] = React.useState<{
    kind: "error" | "success";
    message: string;
  } | null>(initialLoadError ? { kind: "error", message: initialLoadError } : null);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const canRetry = adminPermissions.includes("notifications:retry");
  const attentionCount = items.filter(
    (item) => item.status === "blocked" || item.status === "failed",
  ).length;
  const metrics = [
    { label: copy.status, value: `${items.length}` },
    {
      label: language === "vi" ? "Cần chú ý" : "Needs attention",
      value: `${attentionCount}`,
    },
    {
      label: language === "vi" ? "Đã gửi" : "Sent",
      value: `${items.filter((item) => item.status === "sent").length}`,
    },
  ];

  async function loadNotifications(nextFilters = filters) {
    setLoadState("loading");
    setFeedback(null);
    const query = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value.trim()) query.set(key, value.trim());
    });

    try {
      const response = await fetch(`/api/admin/notifications?${query.toString()}`, {
        cache: "no-store",
      });
      const body = (await response.json()) as ApiResponse<
        AdminNotificationOperationsItem[]
      >;

      if (!response.ok || !body.data) throw new Error(body.error?.message);
      setItems(body.data);
      setLoadState("idle");
    } catch {
      setLoadState("error");
      setFeedback({ kind: "error", message: copy.loadError });
    }
  }

  async function retryNotification(notificationId: string) {
    if (retryingId) return;
    setRetryingId(notificationId);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/notifications/${encodeURIComponent(notificationId)}/retry`,
        { method: "POST" },
      );
      const body = (await response.json()) as ApiResponse<unknown>;

      if (!response.ok) throw new Error(body.error?.message);
      setFeedback({ kind: "success", message: copy.retrySuccess });
      await loadNotifications();
    } catch {
      setFeedback({ kind: "error", message: copy.retryError });
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <AdminShellPage
      active="notifications"
      badge={copy.badge}
      description={copy.description}
      language={language}
      metrics={metrics}
      permissions={adminPermissions}
      role={adminRole}
      title={copy.title}
      userName={adminName}
    >
      <section
        className="rounded-lg border border-admin/20 bg-surface p-case-lg shadow-[var(--case-shadow-soft)]"
        data-admin-notification-filters
      >
        <form
          className="grid gap-case-sm lg:grid-cols-[minmax(240px,1fr)_repeat(3,minmax(150px,auto))_auto] lg:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void loadNotifications();
          }}
        >
          <Input
            label={copy.search}
            value={filters.q}
            onChange={(event) =>
              setFilters((current) => ({ ...current, q: event.target.value }))
            }
          />
          <FilterSelect
            label={copy.channel}
            value={filters.channel}
            values={NOTIFICATION_CHANNELS}
            onChange={(value) =>
              setFilters((current) => ({ ...current, channel: value }))
            }
          />
          <FilterSelect
            label={copy.status}
            value={filters.status}
            values={NOTIFICATION_STATUSES}
            onChange={(value) =>
              setFilters((current) => ({ ...current, status: value }))
            }
          />
          <FilterSelect
            label={copy.event}
            value={filters.eventType}
            values={NOTIFICATION_EVENTS}
            onChange={(value) =>
              setFilters((current) => ({ ...current, eventType: value }))
            }
          />
          <div className="flex gap-case-xs">
            <Button type="submit" isLoading={loadState === "loading"}>
              {copy.filter}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void loadNotifications()}
            >
              {copy.refresh}
            </Button>
          </div>
        </form>
      </section>

      {initialConfiguration ? (
        <ConfigurationSummary
          configuration={initialConfiguration}
          copy={copy}
        />
      ) : (
        <p className="text-small text-text-muted" data-notification-config-hidden>
          {copy.configAdminOnly}
        </p>
      )}

      <div aria-live="polite">
        {feedback?.kind === "error" ? (
          <ErrorMessage>{feedback.message}</ErrorMessage>
        ) : feedback ? (
          <p className="rounded-md border border-success/30 bg-success/10 p-case-sm text-small text-success">
            {feedback.message}
          </p>
        ) : null}
      </div>

      <NotificationOperationsList
        canRetry={canRetry}
        copy={copy}
        items={items}
        language={language}
        loading={loadState === "loading"}
        onRetry={retryNotification}
        retryingId={retryingId}
      />
    </AdminShellPage>
  );
}

function FilterSelect({
  label,
  onChange,
  value,
  values,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  values: readonly string[];
}) {
  return (
    <label className="grid gap-1 text-small font-medium text-foreground">
      <span>{label}</span>
      <select
        className="min-h-11 rounded-md border border-border bg-surface px-3 text-body text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All</option>
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConfigurationSummary({
  configuration,
  copy,
}: {
  configuration: NotificationConfigurationSummary;
  copy: (typeof copyByLanguage)[Language];
}) {
  const signals = [
    [copy.configLabels.mode, configuration.mode, configuration.mode !== "disabled"],
    [copy.configLabels.email, configuration.emailProvider, configuration.emailReady],
    [copy.configLabels.sms, configuration.smsProvider, configuration.smsReady],
    [copy.configLabels.otp, configuration.otpReady ? "ready" : "off", configuration.otpReady],
    [
      copy.configLabels.dispatch,
      configuration.dispatchReady ? "ready" : "blocked",
      configuration.dispatchReady,
    ],
  ] as const;

  return (
    <section
      className="border-l-4 border-admin bg-surface px-case-lg py-case-md"
      data-notification-config-summary
    >
      <h2 className="text-heading-3 font-semibold text-foreground">{copy.config}</h2>
      <dl className="mt-case-md flex flex-wrap gap-case-sm">
        {signals.map(([label, value, ready]) => (
          <div key={label} className="min-w-32 border-b border-border pb-case-xs">
            <dt className="text-small text-text-muted">{label}</dt>
            <dd className="mt-1">
              <Badge variant={ready ? "success" : "neutral"}>{value}</Badge>
            </dd>
          </div>
        ))}
      </dl>
      {configuration.issues.length > 0 ? (
        <p className="mt-case-sm text-small text-text-muted">
          {copy.providerIssues}: {configuration.issues.join("; ")}
        </p>
      ) : null}
    </section>
  );
}

function NotificationOperationsList({
  canRetry,
  copy,
  items,
  language,
  loading,
  onRetry,
  retryingId,
}: {
  canRetry: boolean;
  copy: (typeof copyByLanguage)[Language];
  items: AdminNotificationOperationsItem[];
  language: Language;
  loading: boolean;
  onRetry: (id: string) => Promise<void>;
  retryingId: string | null;
}) {
  if (loading && items.length === 0) {
    return <p className="text-body text-text-muted">{copy.loading}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-case-lg text-body text-text-muted">
        {copy.empty}
      </p>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-lg border border-admin/20 bg-surface shadow-[var(--case-shadow-soft)]"
      data-admin-notification-list
    >
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left text-small">
          <thead className="bg-admin text-surface">
            <tr>
              {[copy.status, copy.channel, copy.event, copy.order, copy.recipient, copy.attempts, copy.updated, ""].map(
                (heading) => (
                  <th key={heading || "action"} scope="col" className="px-case-md py-case-sm font-semibold">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border align-top">
                <td className="px-case-md py-case-sm"><StatusBadge item={item} /></td>
                <td className="px-case-md py-case-sm">{item.channel}</td>
                <td className="max-w-52 break-words px-case-md py-case-sm font-medium">{item.eventType}</td>
                <td className="px-case-md py-case-sm">{item.orderCode ?? "-"}</td>
                <td className="px-case-md py-case-sm">{item.recipientLabel}</td>
                <td className="px-case-md py-case-sm">{item.attempts}</td>
                <td className="whitespace-nowrap px-case-md py-case-sm">{formatDate(item.updatedAt, language)}</td>
                <td className="px-case-md py-case-sm">
                  <RetryButton canRetry={canRetry} copy={copy} item={item} onRetry={onRetry} retryingId={retryingId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-case-sm p-case-sm lg:hidden">
        {items.map((item) => (
          <article key={item.id} className="border-b border-border p-case-sm last:border-b-0">
            <div className="flex flex-wrap items-start justify-between gap-case-sm">
              <div className="min-w-0">
                <StatusBadge item={item} />
                <h2 className="mt-case-xs break-words text-body font-semibold text-foreground">
                  {item.eventType}
                </h2>
              </div>
              <Badge variant="neutral">{item.channel}</Badge>
            </div>
            <dl className="mt-case-sm grid grid-cols-2 gap-case-sm text-small">
              <OperationDetail label={copy.order} value={item.orderCode ?? "-"} />
              <OperationDetail label={copy.recipient} value={item.recipientLabel} />
              <OperationDetail label={copy.attempts} value={String(item.attempts)} />
              <OperationDetail label={copy.updated} value={formatDate(item.updatedAt, language)} />
            </dl>
            <div className="mt-case-sm">
              <RetryButton canRetry={canRetry} copy={copy} item={item} onRetry={onRetry} retryingId={retryingId} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ item }: { item: AdminNotificationOperationsItem }) {
  return (
    <div className="grid w-fit gap-1">
      <Badge variant={statusVariants[item.status]}>{item.status}</Badge>
      {item.lastErrorCode ? (
        <span className="max-w-44 break-words text-small text-text-muted">
          {item.lastErrorCode}
        </span>
      ) : null}
    </div>
  );
}

function RetryButton({
  canRetry,
  copy,
  item,
  onRetry,
  retryingId,
}: {
  canRetry: boolean;
  copy: (typeof copyByLanguage)[Language];
  item: AdminNotificationOperationsItem;
  onRetry: (id: string) => Promise<void>;
  retryingId: string | null;
}) {
  const retryable =
    canRetry &&
    item.channel !== "in-app" &&
    item.lastErrorCode !== "SANDBOX_PREVIEW" &&
    (item.status === "blocked" || item.status === "failed");

  return retryable ? (
    <Button
      size="sm"
      variant="secondary"
      isLoading={retryingId === item.id}
      disabled={Boolean(retryingId)}
      onClick={() => void onRetry(item.id)}
    >
      {copy.retry}
    </Button>
  ) : null;
}

function OperationDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className="mt-1 break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatDate(value: string, language: Language) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}
