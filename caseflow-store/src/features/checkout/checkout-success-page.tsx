"use client";

import Link from "next/link";
import * as React from "react";

import { Badge, Container, Skeleton } from "@/components/ui";
import {
  readCheckoutSuccessSnapshot,
  type CheckoutSuccessSnapshot,
} from "@/features/checkout/checkout-success-storage";
import { formatVnd } from "@/lib/format/currency";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/domain";

type SuccessPageState =
  | { status: "loading" }
  | { status: "ready"; snapshot: CheckoutSuccessSnapshot }
  | { status: "missing"; orderCode: string | null };

const checkoutSuccessCopy = {
  en: {
    browseMoreBooks: "Browse more books",
    cartCleared: "Cart was cleared after the order was created.",
    cartPreserved:
      "Your saved cart was not changed by this direct purchase.",
    continueShopping: "Continue shopping",
    directOpenDescription:
      "For privacy, this confirmation page only shows details from the current checkout. Use order tracking with your order code and contact information for later updates.",
    directOpenTitle: "Order details are not available here",
    items: "Items",
    missingBadge: "Order lookup unavailable",
    nextSteps: "Next steps",
    noCard: "Payment will follow the selected order method.",
    orderCode: "Order code",
    orderCodeFromUrl: "Order code from URL",
    orderPlaced: "Order placed",
    orderStatus:
      "Order status starts as pending for bookstore confirmation.",
    orderTotal: "Order total",
    paymentMethod: "Payment method",
    paymentStatus: "Payment status",
    quantity: "Quantity",
    returnToCheckout: "Return to checkout",
    status: "Status",
    successDescription:
      "Your order has been recorded. Keep the order code for support and fulfillment updates.",
    successTitle: "Order received",
    viewCheckout: "View checkout",
  },
  vi: {
    browseMoreBooks: "Duyệt thêm sách",
    cartCleared: "Giỏ hàng đã được xóa sau khi đơn hàng được tạo.",
    cartPreserved:
      "Giỏ hàng đã lưu không bị thay đổi bởi lần Mua ngay này.",
    continueShopping: "Tiếp tục mua sách",
    directOpenDescription:
      "Vì lý do riêng tư, trang xác nhận này chỉ hiển thị chi tiết từ lần checkout hiện tại. Hãy dùng mã đơn và thông tin liên hệ để theo dõi đơn sau đó.",
    directOpenTitle: "Không có chi tiết đơn hàng tại đây",
    items: "Sản phẩm",
    missingBadge: "Chưa tra cứu được đơn hàng",
    nextSteps: "Bước tiếp theo",
    noCard: "Thanh toán sẽ thực hiện theo phương thức đã chọn cho đơn hàng.",
    orderCode: "Mã đơn hàng",
    orderCodeFromUrl: "Mã đơn hàng từ URL",
    orderPlaced: "Đã đặt đơn",
    orderStatus: "Trạng thái đơn bắt đầu là đang chờ nhà sách xác nhận.",
    orderTotal: "Tổng đơn hàng",
    paymentMethod: "Phương thức thanh toán",
    paymentStatus: "Trạng thái thanh toán",
    quantity: "Số lượng",
    returnToCheckout: "Quay lại thanh toán",
    status: "Trạng thái",
    successDescription:
      "Đơn hàng đã được ghi nhận. Hãy giữ mã đơn để được hỗ trợ và cập nhật xử lý.",
    successTitle: "Đơn hàng đã được ghi nhận",
    viewCheckout: "Xem thanh toán",
  },
} as const;

export function CheckoutSuccessPage({ language }: { language: Language }) {
  const copy = checkoutSuccessCopy[language];
  const [state, setState] = React.useState<SuccessPageState>({
    status: "loading",
  });

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const orderCode =
        new URLSearchParams(window.location.search).get("orderCode") ?? null;
      const snapshot = readCheckoutSuccessSnapshot(window.sessionStorage);

      if (snapshot && (!orderCode || snapshot.orderCode === orderCode)) {
        setState({ status: "ready", snapshot });
        return;
      }

      setState({ status: "missing", orderCode });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main
      className="bg-background py-case-2xl text-foreground"
      data-checkout-success-page
    >
      <Container className="flex flex-col gap-case-xl">
        <Link
          href="/#featured"
          className="w-fit text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {copy.continueShopping}
        </Link>

        {state.status === "loading" ? <CheckoutSuccessLoading /> : null}
        {state.status === "ready" ? (
          <CheckoutSuccessDetails
            copy={copy}
            language={language}
            snapshot={state.snapshot}
          />
        ) : null}
        {state.status === "missing" ? (
          <CheckoutSuccessMissing copy={copy} orderCode={state.orderCode} />
        ) : null}
      </Container>
    </main>
  );
}

function CheckoutSuccessLoading() {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-xl"
      data-checkout-success-loading
    >
      <Skeleton className="h-7 w-44" />
      <Skeleton className="mt-case-md h-12 w-full max-w-xl" />
      <div className="mt-case-lg grid gap-case-md md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </section>
  );
}

function CheckoutSuccessDetails({
  copy,
  language,
  snapshot,
}: {
  copy: (typeof checkoutSuccessCopy)[Language];
  language: Language;
  snapshot: CheckoutSuccessSnapshot;
}) {
  return (
    <section className="grid gap-case-xl lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <Badge variant="success">{copy.orderPlaced}</Badge>
        <div className="mt-case-md max-w-3xl">
          <h1 className="text-heading-1 font-semibold text-foreground">
            {copy.successTitle}
          </h1>
          <p className="mt-case-sm text-body leading-7 text-text-muted">
            {copy.successDescription}
          </p>
        </div>

        <dl
          className="mt-case-xl divide-y divide-border border-y border-border bg-surface"
          data-checkout-success-summary
        >
          <CheckoutSuccessDetailRow
            dataAttribute="data-checkout-success-code"
            label={copy.orderCode}
            value={snapshot.orderCode}
          />
          <CheckoutSuccessDetailRow
            dataAttribute="data-checkout-success-status"
            label={copy.status}
            value={getOrderStatusLabel(snapshot.status, language)}
          />
          <CheckoutSuccessDetailRow
            dataAttribute="data-checkout-success-payment-method"
            label={copy.paymentMethod}
            value={getPaymentMethodLabel(snapshot.paymentMethod, language)}
          />
          <CheckoutSuccessDetailRow
            dataAttribute="data-checkout-success-payment-status"
            label={copy.paymentStatus}
            value={getPaymentStatusLabel(snapshot.paymentStatus, language)}
          />
          <CheckoutSuccessDetailRow
            dataAttribute="data-checkout-success-total"
            emphasize
            label={copy.orderTotal}
            value={formatVnd(snapshot.subtotal)}
          />
        </dl>

        <div className="mt-case-xl">
          <h2 className="text-heading-2 font-semibold text-foreground">
            {copy.items}
          </h2>
          <ul
            className="mt-case-md divide-y divide-border border-y border-border"
            data-checkout-success-items
          >
            {snapshot.items.map((item) => (
              <li
                key={`${item.productName}-${item.quantity}-${item.lineTotal}`}
                className="flex items-center justify-between gap-case-md py-case-md"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {item.productName}
                  </p>
                  <p className="mt-case-xs text-small text-text-muted">
                    {copy.quantity}: {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-foreground">
                  {formatVnd(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="rounded-lg border border-border bg-surface p-case-lg">
        <h2 className="text-heading-3 font-semibold text-foreground">
          {copy.nextSteps}
        </h2>
        <ul className="mt-case-md flex flex-col gap-case-sm text-small leading-6 text-text-muted">
          <li>{copy.orderStatus}</li>
          <li>{copy.noCard}</li>
          <li data-checkout-success-cart-behavior>
            {snapshot.checkoutSource === "buy-now"
              ? copy.cartPreserved
              : copy.cartCleared}
          </li>
        </ul>
        <div className="mt-case-lg grid gap-case-sm">
          <Link
            href="/#featured"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.browseMoreBooks}
          </Link>
          <Link
            href="/checkout"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.viewCheckout}
          </Link>
        </div>
      </aside>
    </section>
  );
}

function CheckoutSuccessDetailRow({
  dataAttribute,
  emphasize = false,
  label,
  value,
}: {
  dataAttribute: string;
  emphasize?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-w-0 gap-case-xs px-case-md py-case-md sm:grid-cols-[minmax(140px,0.8fr)_minmax(0,1.2fr)] sm:items-center">
      <dt className="min-w-0 text-small text-text-muted">{label}</dt>
      <dd
        className={cn(
          "min-w-0 [overflow-wrap:anywhere] font-semibold text-foreground sm:text-right",
          emphasize && "text-heading-3",
        )}
        {...{ [dataAttribute]: "" }}
      >
        {value}
      </dd>
    </div>
  );
}

function CheckoutSuccessMissing({
  copy,
  orderCode,
}: {
  copy: (typeof checkoutSuccessCopy)[Language];
  orderCode: string | null;
}) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-xl"
      data-checkout-success-missing
    >
      <Badge variant="neutral">{copy.missingBadge}</Badge>
      <div className="mt-case-md max-w-3xl">
        <h1 className="text-heading-1 font-semibold text-foreground">
          {copy.directOpenTitle}
        </h1>
        <p className="mt-case-sm text-body leading-7 text-text-muted">
          {copy.directOpenDescription}
        </p>
      </div>

      {orderCode ? (
        <dl className="mt-case-lg border-y border-border py-case-md">
          <dt className="text-small text-text-muted">{copy.orderCodeFromUrl}</dt>
          <dd
            className="mt-case-xs break-words font-semibold text-foreground"
            data-checkout-success-code
          >
            {orderCode}
          </dd>
        </dl>
      ) : null}

      <div className="mt-case-lg flex flex-col gap-case-sm sm:flex-row">
        <Link
          href="/#featured"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {copy.continueShopping}
        </Link>
        <Link
          href="/checkout"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {copy.returnToCheckout}
        </Link>
      </div>
    </section>
  );
}

function getPaymentMethodLabel(method: PaymentMethod, language: Language) {
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

function getPaymentStatusLabel(status: PaymentStatus, language: Language) {
  const labels: Record<Language, Record<PaymentStatus, string>> = {
    en: {
      "awaiting-provider-confirmation": "Awaiting provider confirmation",
      "awaiting-transfer": "Awaiting bank transfer",
      cancelled: "Cancelled",
      confirmed: "Confirmed",
      expired: "Expired",
      failed: "Failed",
      pending: "Pending",
    },
    vi: {
      "awaiting-provider-confirmation": "Đang chờ nhà cung cấp xác nhận",
      "awaiting-transfer": "Đang chờ chuyển khoản",
      cancelled: "Đã hủy",
      confirmed: "Đã xác nhận",
      expired: "Đã hết hạn",
      failed: "Thất bại",
      pending: "Đang chờ",
    },
  };

  return labels[language][status];
}
