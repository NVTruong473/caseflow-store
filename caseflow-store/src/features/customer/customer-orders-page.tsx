import Link from "next/link";

import { Badge, Container } from "@/components/ui";
import { formatVnd } from "@/lib/format/currency";
import type { Language } from "@/lib/i18n/language";
import type { SupabaseOrderRecord } from "@/lib/repositories/supabase-orders";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/domain";

const customerOrdersCopy = {
  en: {
    account: "Account",
    badge: "Customer orders",
    emptyDescription: "Orders created with this customer account will appear here.",
    emptyTitle: "No orders yet",
    item: "item",
    items: "items",
    orderCode: "Order code",
    orderDetails: "Order details",
    orderHistory: "Order history",
    orderStatus: "Order status",
    orderTotal: "Order total",
    orderedAt: "Ordered at",
    paymentMethod: "Payment method",
    paymentStatus: "Payment status",
    quantity: "Quantity",
    title: "Your orders",
  },
  vi: {
    account: "Tài khoản",
    badge: "Đơn hàng khách hàng",
    emptyDescription: "Các đơn hàng tạo bằng tài khoản này sẽ xuất hiện tại đây.",
    emptyTitle: "Chưa có đơn hàng",
    item: "sản phẩm",
    items: "sản phẩm",
    orderCode: "Mã đơn",
    orderDetails: "Chi tiết đơn",
    orderHistory: "Lịch sử đơn hàng",
    orderStatus: "Trạng thái đơn",
    orderTotal: "Tổng đơn",
    orderedAt: "Thời gian đặt",
    paymentMethod: "Phương thức thanh toán",
    paymentStatus: "Trạng thái thanh toán",
    quantity: "Số lượng",
    title: "Đơn hàng của bạn",
  },
} as const;

export function CustomerOrdersPage({
  language,
  records,
}: {
  language: Language;
  records: SupabaseOrderRecord[];
}) {
  const copy = customerOrdersCopy[language];

  return (
    <main
      className="bg-background py-case-2xl text-foreground"
      data-customer-orders-page
    >
      <Container className="flex flex-col gap-case-xl">
        <Link
          href="/account"
          className="w-fit text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {copy.account}
        </Link>

        <div className="max-w-3xl">
          <Badge variant="primary">{copy.badge}</Badge>
          <h1 className="mt-case-md text-heading-1 font-semibold text-foreground">
            {copy.title}
          </h1>
        </div>

        {records.length === 0 ? (
          <section
            className="rounded-lg border border-border bg-surface p-case-xl"
            data-customer-orders-empty
          >
            <h2 className="text-heading-2 font-semibold text-foreground">
              {copy.emptyTitle}
            </h2>
            <p className="mt-case-sm text-body leading-7 text-text-muted">
              {copy.emptyDescription}
            </p>
          </section>
        ) : (
          <section className="grid gap-case-md" data-customer-orders-list>
            {records.map((record) => (
              <CustomerOrderCard
                copy={copy}
                key={record.order.id}
                language={language}
                record={record}
              />
            ))}
          </section>
        )}
      </Container>
    </main>
  );
}

function CustomerOrderCard({
  copy,
  language,
  record,
}: {
  copy: (typeof customerOrdersCopy)[Language];
  language: Language;
  record: SupabaseOrderRecord;
}) {
  const itemCount = record.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article
      className="rounded-lg border border-border bg-surface p-case-lg"
      data-customer-order-card={record.order.orderCode}
    >
      <div className="grid gap-case-md lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
        <div className="min-w-0">
          <p className="text-small text-text-muted">{copy.orderCode}</p>
          <h2
            className="mt-case-xs break-words text-heading-3 font-semibold text-foreground"
            data-customer-order-code
          >
            {record.order.orderCode}
          </h2>
          <p className="mt-case-xs text-small text-text-muted">
            {formatDateTime(record.order.createdAt, language)}
          </p>
        </div>
        <div className="grid gap-case-xs text-right">
          <p className="text-small text-text-muted">{copy.orderTotal}</p>
          <p
            className="text-heading-3 font-semibold text-foreground"
            data-customer-order-total
          >
            {formatVnd(record.order.subtotal)}
          </p>
          <p className="text-small text-text-muted">
            {itemCount} {itemCount === 1 ? copy.item : copy.items}
          </p>
        </div>
      </div>

      <dl className="mt-case-lg grid gap-case-sm sm:grid-cols-2 lg:grid-cols-4">
        <OrderMetric
          label={copy.orderStatus}
          value={getOrderStatusLabel(record.order.status, language)}
        />
        <OrderMetric
          label={copy.paymentMethod}
          value={getPaymentMethodLabel(record.order.paymentMethod, language)}
        />
        <OrderMetric
          label={copy.paymentStatus}
          value={getPaymentStatusLabel(record.order.paymentStatus, language)}
        />
        <OrderMetric
          label={copy.orderedAt}
          value={formatDateTime(record.order.createdAt, language)}
        />
      </dl>

      <details className="mt-case-lg" data-customer-order-detail>
        <summary className="cursor-pointer text-small font-semibold text-primary">
          {copy.orderDetails}
        </summary>
        <ul className="mt-case-md divide-y divide-border border-y border-border">
          {record.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-case-xs py-case-md sm:flex-row sm:items-center sm:justify-between"
              data-customer-order-item={item.productId}
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.productName}</p>
                <p className="mt-case-xs text-small text-text-muted">
                  {copy.quantity}: {item.quantity}
                </p>
              </div>
              <p className="font-semibold text-foreground">
                {formatVnd(item.lineTotal)}
              </p>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function OrderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-case-md">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-case-xs font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function getPaymentMethodLabel(
  method: PaymentMethod | undefined,
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
  status: PaymentStatus | undefined,
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

function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}
