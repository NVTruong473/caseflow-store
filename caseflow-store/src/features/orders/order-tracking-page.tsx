"use client";

import Link from "next/link";
import * as React from "react";

import { Badge, Button, Container, ErrorMessage, Input } from "@/components/ui";
import { formatVnd } from "@/lib/format/currency";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";
import type { PublicOrderTrackingRecord } from "@/lib/repositories/supabase-orders";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
} from "@/types/domain";

type TrackingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; record: PublicOrderTrackingRecord }
  | { status: "error"; message: string };

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

const orderTrackingCopy = {
  en: {
    accountOrders: "Your order history",
    badge: "Order tracking",
    contactHint: "Use the same email or phone number used at checkout.",
    contactLabel: "Customer email or phone",
    contactPlaceholder: "you@example.com or 0912345678",
    createdAt: "Created",
    genericError:
      "No order was found for those details. Check the order code and contact, then try again.",
    invalidError: "Enter a valid order code and customer email or phone number.",
    lookup: "Track order",
    orderCodeLabel: "Order code",
    orderCodePlaceholder: "CF-...",
    orderStatus: "Order status",
    paymentMethod: "Payment method",
    paymentStatus: "Payment status",
    shippingMethod: "Shipping method",
    subtitle:
      "Enter the order code and matching checkout contact to view the current status.",
    timeline: "Status timeline",
    title: "Track an order",
    total: "Order total",
    updatedAt: "Last updated",
  },
  vi: {
    accountOrders: "Lịch sử đơn hàng của bạn",
    badge: "Tra cứu đơn hàng",
    contactHint: "Dùng đúng email hoặc số điện thoại đã dùng khi thanh toán.",
    contactLabel: "Email hoặc số điện thoại khách hàng",
    contactPlaceholder: "ban@example.com hoặc 0912345678",
    createdAt: "Thời gian tạo",
    genericError:
      "Không tìm thấy đơn hàng với thông tin này. Kiểm tra mã đơn và thông tin liên hệ rồi thử lại.",
    invalidError: "Nhập mã đơn và email hoặc số điện thoại hợp lệ.",
    lookup: "Tra cứu đơn",
    orderCodeLabel: "Mã đơn hàng",
    orderCodePlaceholder: "CF-...",
    orderStatus: "Trạng thái đơn",
    paymentMethod: "Phương thức thanh toán",
    paymentStatus: "Trạng thái thanh toán",
    shippingMethod: "Phương thức giao hàng",
    subtitle:
      "Nhập mã đơn và thông tin liên hệ khớp với lúc thanh toán để xem trạng thái hiện tại.",
    timeline: "Tiến trình đơn hàng",
    title: "Tra cứu đơn hàng",
    total: "Tổng đơn",
    updatedAt: "Cập nhật gần nhất",
  },
} as const;

const activeStatusFlow = ["pending", "confirmed", "shipping", "completed"] as const;

export function OrderTrackingPage({ language }: { language: Language }) {
  const copy = orderTrackingCopy[language];
  const [orderCode, setOrderCode] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [state, setState] = React.useState<TrackingState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contact, orderCode }),
      });
      const payload =
        (await response.json()) as ApiResponse<PublicOrderTrackingRecord>;

      if (response.ok && payload.data) {
        setState({ status: "found", record: payload.data });
        return;
      }

      setState({
        status: "error",
        message:
          payload.error?.code === "VALIDATION_ERROR"
            ? copy.invalidError
            : copy.genericError,
      });
    } catch {
      setState({ status: "error", message: copy.genericError });
    }
  }

  return (
    <main
      className="bg-background py-case-2xl text-foreground"
      data-order-tracking-page
    >
      <Container className="grid gap-case-xl lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <section className="min-w-0">
          <Badge variant="primary">{copy.badge}</Badge>
          <div className="mt-case-md max-w-3xl">
            <h1 className="text-heading-1 font-semibold text-foreground">
              {copy.title}
            </h1>
            <p className="mt-case-sm text-body leading-7 text-text-muted">
              {copy.subtitle}
            </p>
          </div>

          {state.status === "found" ? (
            <TrackingResult
              copy={copy}
              language={language}
              record={state.record}
            />
          ) : (
            <TrackingEmptyState copy={copy} />
          )}
        </section>

        <aside className="rounded-lg border border-border bg-surface p-case-lg">
          <form
            className="grid gap-case-md"
            data-order-tracking-form
            onSubmit={handleSubmit}
          >
            <Input
              autoComplete="off"
              label={copy.orderCodeLabel}
              onChange={(event) => setOrderCode(event.target.value)}
              placeholder={copy.orderCodePlaceholder}
              required
              value={orderCode}
              data-order-tracking-code
            />
            <Input
              autoComplete="email tel"
              hint={copy.contactHint}
              label={copy.contactLabel}
              onChange={(event) => setContact(event.target.value)}
              placeholder={copy.contactPlaceholder}
              required
              value={contact}
              data-order-tracking-contact
            />
            <Button
              type="submit"
              isLoading={state.status === "loading"}
              data-order-tracking-submit
            >
              {copy.lookup}
            </Button>
            {state.status === "error" ? (
              <ErrorMessage data-order-tracking-error>
                {state.message}
              </ErrorMessage>
            ) : null}
          </form>

          <Link
            href="/account/orders"
            className="mt-case-lg inline-flex text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.accountOrders}
          </Link>
        </aside>
      </Container>
    </main>
  );
}

function TrackingResult({
  copy,
  language,
  record,
}: {
  copy: (typeof orderTrackingCopy)[Language];
  language: Language;
  record: PublicOrderTrackingRecord;
}) {
  return (
    <section
      className="mt-case-xl grid gap-case-lg"
      data-order-tracking-result
    >
      <div className="rounded-lg border border-border bg-surface p-case-lg">
        <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-small text-text-muted">{copy.orderCodeLabel}</p>
            <h2
              className="mt-case-xs break-words text-heading-2 font-semibold text-foreground"
              data-order-tracking-result-code
            >
              {record.orderCode}
            </h2>
          </div>
          <Badge
            variant={record.status === "cancelled" ? "warning" : "success"}
            data-order-tracking-result-status
          >
            {getOrderStatusLabel(record.status, language)}
          </Badge>
        </div>

        <dl className="mt-case-lg grid gap-case-sm sm:grid-cols-2">
          <TrackingMetric
            label={copy.orderStatus}
            value={getOrderStatusLabel(record.status, language)}
          />
          <TrackingMetric
            label={copy.paymentMethod}
            value={getPaymentMethodLabel(record.paymentMethod, language)}
            attribute="data-order-tracking-payment-method"
          />
          <TrackingMetric
            label={copy.paymentStatus}
            value={getPaymentStatusLabel(record.paymentStatus, language)}
            attribute="data-order-tracking-payment-status"
          />
          <TrackingMetric
            label={copy.shippingMethod}
            value={getShippingMethodLabel(record.shippingMethod, language)}
            attribute="data-order-tracking-shipping-method"
          />
          <TrackingMetric
            label={copy.total}
            value={formatVnd(record.totalVnd)}
            attribute="data-order-tracking-total"
          />
          <TrackingMetric
            label={copy.updatedAt}
            value={formatDateTime(record.updatedAt, language)}
          />
        </dl>
      </div>

      <section
        className="rounded-lg border border-border bg-surface p-case-lg"
        aria-labelledby="order-tracking-timeline"
      >
        <h2
          id="order-tracking-timeline"
          className="text-heading-3 font-semibold text-foreground"
        >
          {copy.timeline}
        </h2>
        <ol className="mt-case-md grid gap-case-sm" data-order-tracking-timeline>
          {getTimelineStatuses(record.status).map((status) => (
            <TimelineStep
              currentStatus={record.status}
              key={status}
              language={language}
              status={status}
            />
          ))}
        </ol>
      </section>
    </section>
  );
}

function TrackingEmptyState({
  copy,
}: {
  copy: (typeof orderTrackingCopy)[Language];
}) {
  return (
    <section
      className="mt-case-xl rounded-lg border border-border bg-surface p-case-lg"
      data-order-tracking-empty
    >
      <h2 className="text-heading-3 font-semibold text-foreground">
        {copy.orderStatus}
      </h2>
      <p className="mt-case-sm text-body leading-7 text-text-muted">
        {copy.subtitle}
      </p>
    </section>
  );
}

function TrackingMetric({
  attribute,
  label,
  value,
}: {
  attribute?: string;
  label: string;
  value: string;
}) {
  const dataAttribute = attribute ? { [attribute]: value } : {};

  return (
    <div
      className="rounded-md border border-border bg-surface-muted p-case-md"
      {...dataAttribute}
    >
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-case-xs break-words font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function TimelineStep({
  currentStatus,
  language,
  status,
}: {
  currentStatus: OrderStatus;
  language: Language;
  status: OrderStatus;
}) {
  const state = getTimelineState(currentStatus, status);

  return (
    <li
      className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-case-sm"
      data-order-tracking-timeline-step={status}
      data-order-tracking-timeline-state={state}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border text-small font-semibold",
          state === "done"
            ? "border-success bg-success text-surface"
            : "border-border bg-surface text-text-muted",
          state === "current" ? "border-primary bg-primary text-surface" : "",
          state === "cancelled" ? "border-warning bg-warning text-surface" : "",
        )}
      >
        {state === "pending" ? "" : "✓"}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">
          {getOrderStatusLabel(status, language)}
        </p>
      </div>
    </li>
  );
}

function getTimelineStatuses(status: OrderStatus) {
  if (status === "cancelled") {
    return ["pending", "cancelled"] as const;
  }

  return activeStatusFlow;
}

function getTimelineState(currentStatus: OrderStatus, step: OrderStatus) {
  if (step === "cancelled") {
    return "cancelled";
  }

  const currentIndex = activeStatusFlow.indexOf(
    currentStatus as (typeof activeStatusFlow)[number],
  );
  const stepIndex = activeStatusFlow.indexOf(
    step as (typeof activeStatusFlow)[number],
  );

  if (currentIndex === -1 || stepIndex === -1) {
    return "pending";
  }

  if (stepIndex < currentIndex) {
    return "done";
  }

  if (stepIndex === currentIndex) {
    return "current";
  }

  return "pending";
}

function getOrderStatusLabel(status: OrderStatus, language: Language) {
  const labels: Record<Language, Record<OrderStatus, string>> = {
    en: {
      cancelled: "Cancelled",
      completed: "Completed",
      confirmed: "Confirmed",
      pending: "Pending",
      shipping: "Shipping",
    },
    vi: {
      cancelled: "Đã hủy",
      completed: "Hoàn tất",
      confirmed: "Đã xác nhận",
      pending: "Đang chờ",
      shipping: "Đang giao",
    },
  };

  return labels[language][status];
}

function getPaymentMethodLabel(
  method: PaymentMethod | null,
  language: Language,
) {
  if (!method) {
    return "-";
  }

  const labels: Record<Language, Record<PaymentMethod, string>> = {
    en: {
      "bank-transfer": "Bank transfer",
      cod: "Cash on delivery",
      momo: "MoMo",
      vnpay: "VNPay",
      zalopay: "ZaloPay",
    },
    vi: {
      "bank-transfer": "Chuyển khoản",
      cod: "COD",
      momo: "MoMo",
      vnpay: "VNPay",
      zalopay: "ZaloPay",
    },
  };

  return labels[language][method];
}

function getPaymentStatusLabel(
  status: PaymentStatus | null,
  language: Language,
) {
  if (!status) {
    return "-";
  }

  const labels: Record<Language, Record<PaymentStatus, string>> = {
    en: {
      "awaiting-provider-confirmation": "Awaiting provider confirmation",
      "awaiting-transfer": "Awaiting bank transfer",
      cancelled: "Cancelled",
      confirmed: "Confirmed",
      failed: "Failed",
      pending: "Pending",
    },
    vi: {
      "awaiting-provider-confirmation": "Đang chờ nhà cung cấp xác nhận",
      "awaiting-transfer": "Đang chờ chuyển khoản",
      cancelled: "Đã hủy",
      confirmed: "Đã xác nhận",
      failed: "Thất bại",
      pending: "Đang chờ",
    },
  };

  return labels[language][status];
}

function getShippingMethodLabel(
  method: ShippingMethod | null,
  language: Language,
) {
  if (!method) {
    return "-";
  }

  const labels: Record<Language, Record<ShippingMethod, string>> = {
    en: {
      express: "Express",
      standard: "Standard",
    },
    vi: {
      express: "Giao nhanh",
      standard: "Tiêu chuẩn",
    },
  };

  return labels[language][method];
}

function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
