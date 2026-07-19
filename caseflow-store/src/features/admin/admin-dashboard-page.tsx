import Link from "next/link";

import { Badge } from "@/components/ui";
import { formatVnd } from "@/lib/format/currency";
import type {
  AdminDashboardData,
  AdminDashboardStatusSummary,
} from "@/lib/repositories/supabase-dashboard";
import type {
  AdminPermission,
  AdminWorkspaceRole,
} from "@/lib/auth/admin";
import type { DashboardRange } from "@/lib/validation/dashboard";
import type { InventoryStatus, OrderStatus, PaymentStatus } from "@/types/domain";
import type { Language } from "@/lib/i18n/language";

import { AdminShellPage } from "./admin-shell-page";

const dashboardCopy = {
  en: {
    activeEditions: "Active editions",
    averageOrder: "Average order",
    badge: "Operations workspace",
    customRange: "Custom range",
    dashboard: "Dashboard",
    dateRange: "Date range",
    description:
      "Track sales estimates, order state, payment state, stock risk, and recent operations from server-owned data.",
    emptyOrders:
      "No orders match this range. Inventory risk remains visible because stock is independent from order date filters.",
    exportOrders: "Export orders CSV",
    generated: "Generated",
    inventoryRisk: "Inventory risk",
    lowStock: "Low stock",
    lowStockEmpty: "No active low-stock editions.",
    lowStockThreshold: "Threshold",
    noRecentOrders: "No recent orders in this range.",
    noTopBooks: "No sold books in this range.",
    orderCount: "Orders",
    orderStatus: "Order status",
    paymentState: "Payment state",
    recentOrders: "Recent orders",
    revenueEstimate: "Revenue estimate",
    stock: "Stock",
    title: "Sales and inventory dashboard",
    topBooks: "Top books",
    units: "Units",
  },
  vi: {
    activeEditions: "Ấn bản đang bán",
    averageOrder: "Trung bình đơn",
    badge: "Khu vực vận hành",
    customRange: "Khoảng tùy chỉnh",
    dashboard: "Tổng quan",
    dateRange: "Khoảng ngày",
    description:
      "Theo dõi doanh số ước tính, trạng thái đơn, trạng thái thanh toán, rủi ro tồn kho và đơn gần đây từ dữ liệu server.",
    emptyOrders:
      "Không có đơn trong khoảng này. Rủi ro tồn kho vẫn hiển thị vì tồn kho độc lập với ngày đơn hàng.",
    exportOrders: "Xuất CSV đơn hàng",
    generated: "Tạo lúc",
    inventoryRisk: "Rủi ro tồn kho",
    lowStock: "Sắp hết hàng",
    lowStockEmpty: "Không có ấn bản active đang sắp hết hàng.",
    lowStockThreshold: "Ngưỡng",
    noRecentOrders: "Không có đơn gần đây trong khoảng này.",
    noTopBooks: "Không có sách đã bán trong khoảng này.",
    orderCount: "Đơn hàng",
    orderStatus: "Trạng thái đơn",
    paymentState: "Thanh toán",
    recentOrders: "Đơn gần đây",
    revenueEstimate: "Doanh số ước tính",
    stock: "Tồn",
    title: "Dashboard doanh số và tồn kho",
    topBooks: "Sách bán tốt",
    units: "Cuốn",
  },
} as const;

const rangeLabels: Record<Language, Record<DashboardRange, string>> = {
  en: {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    all: "All time",
  },
  vi: {
    "7d": "7 ngày gần đây",
    "30d": "30 ngày gần đây",
    all: "Toàn bộ",
  },
};

const orderStatusLabels: Record<Language, Record<OrderStatus, string>> = {
  en: {
    pending: "Pending",
    confirmed: "Confirmed",
    shipping: "Shipping",
    completed: "Completed",
    cancelled: "Cancelled",
  },
  vi: {
    pending: "Đang chờ",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
  },
};

const paymentStatusLabels: Record<Language, Record<PaymentStatus, string>> = {
  en: {
    pending: "Pending",
    "awaiting-transfer": "Awaiting transfer",
    "awaiting-provider-confirmation": "Awaiting provider",
    confirmed: "Confirmed",
    failed: "Failed",
    cancelled: "Cancelled",
  },
  vi: {
    pending: "Đang chờ",
    "awaiting-transfer": "Chờ chuyển khoản",
    "awaiting-provider-confirmation": "Chờ nhà cung cấp",
    confirmed: "Đã xác nhận",
    failed: "Thất bại",
    cancelled: "Đã hủy",
  },
};

const inventoryStatusLabels: Record<Language, Record<InventoryStatus, string>> = {
  en: {
    "discontinued": "Discontinued",
    "in-stock": "In stock",
    "low-stock": "Low stock",
    "out-of-stock": "Out of stock",
    preorder: "Preorder",
  },
  vi: {
    "discontinued": "Ngừng bán",
    "in-stock": "Còn hàng",
    "low-stock": "Sắp hết",
    "out-of-stock": "Hết hàng",
    preorder: "Đặt trước",
  },
};

export function AdminDashboardPage({
  dashboard,
  language,
  permissions,
  role,
  userName,
}: {
  dashboard: AdminDashboardData;
  language: Language;
  permissions: AdminPermission[];
  role: AdminWorkspaceRole;
  userName: string;
}) {
  const copy = dashboardCopy[language];
  const metrics = [
    {
      label: copy.revenueEstimate,
      value: formatVnd(dashboard.revenueEstimateVnd),
    },
    {
      label: copy.orderCount,
      value: dashboard.orderCount.toString(),
    },
    {
      label: copy.averageOrder,
      value: formatVnd(dashboard.averageOrderValueVnd),
    },
    {
      label: copy.activeEditions,
      value: dashboard.inventorySummary.activeEditions.toString(),
    },
  ];

  return (
    <AdminShellPage
      active="dashboard"
      badge={copy.badge}
      description={copy.description}
      language={language}
      metrics={metrics}
      permissions={permissions}
      role={role}
      title={copy.title}
      userName={userName}
    >
      <section
        className="grid min-w-0 gap-case-lg"
        data-admin-dashboard-page
        data-admin-dashboard-range={dashboard.range.label}
      >
        <DashboardRangeLinks dashboard={dashboard} language={language} />

        {dashboard.orderCount === 0 ? (
          <section
            className="rounded-lg border border-admin/20 bg-surface p-case-md shadow-[var(--case-shadow-soft)]"
            data-admin-dashboard-empty-orders
          >
            <Badge variant="neutral">{copy.orderCount}: 0</Badge>
            <p className="mt-case-sm text-body leading-7 text-text-muted">
              {copy.emptyOrders}
            </p>
          </section>
        ) : null}

        <div className="grid min-w-0 gap-case-md xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <StatusSummarySection
            copyTitle={copy.paymentState}
            dataAttribute="data-admin-dashboard-payment-summary"
            labels={paymentStatusLabels[language]}
            rows={dashboard.paymentSummary}
          />
          <StatusSummarySection
            copyTitle={copy.orderStatus}
            dataAttribute="data-admin-dashboard-order-status-summary"
            labels={orderStatusLabels[language]}
            rows={dashboard.orderStatusSummary}
          />
        </div>

        <div className="grid min-w-0 gap-case-md xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <TopBooksSection dashboard={dashboard} language={language} />
          <LowStockSection dashboard={dashboard} language={language} />
        </div>

        <RecentOrdersSection dashboard={dashboard} language={language} />
      </section>
    </AdminShellPage>
  );
}

function DashboardRangeLinks({
  dashboard,
  language,
}: {
  dashboard: AdminDashboardData;
  language: Language;
}) {
  const copy = dashboardCopy[language];

  return (
    <section className="min-w-0 rounded-lg border border-admin/20 bg-surface p-case-md shadow-[var(--case-shadow-soft)]">
      <div className="flex flex-col gap-case-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-heading-3 font-semibold text-foreground">
            {copy.dateRange}
          </h2>
          <p className="mt-1 text-small text-text-muted">
            {copy.generated}: {formatDateTime(dashboard.generatedAt, language)}
          </p>
        </div>
        <div className="flex flex-wrap gap-case-sm" data-admin-dashboard-ranges>
          {(["7d", "30d", "all"] as const).map((range) => (
            <Link
              key={range}
              href={`/admin?range=${range}`}
              className={rangeLinkClass(dashboard.range.label === range)}
              data-admin-dashboard-range-link={range}
            >
              {rangeLabels[language][range]}
            </Link>
          ))}
          {dashboard.range.label === "custom" ? (
            <Badge variant="primary">{copy.customRange}</Badge>
          ) : null}
          <Link
            href={buildOrdersExportHref(dashboard)}
            className={rangeLinkClass(false)}
            data-admin-dashboard-export-orders
          >
            {copy.exportOrders}
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatusSummarySection<TStatus extends string>({
  copyTitle,
  dataAttribute,
  labels,
  rows,
}: {
  copyTitle: string;
  dataAttribute: string;
  labels: Record<TStatus, string>;
  rows: AdminDashboardStatusSummary<TStatus>[];
}) {
  const totalCount = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section
      className="min-w-0 rounded-lg border border-admin/20 bg-surface p-case-md shadow-[var(--case-shadow-soft)]"
      {...{ [dataAttribute]: true }}
    >
      <h2 className="text-heading-3 font-semibold text-foreground">
        {copyTitle}
      </h2>
      <div className="mt-case-md grid gap-case-sm">
        {rows.map((row) => (
          <div
            key={row.status}
            className="grid gap-case-xs border-b border-border pb-case-sm text-small last:border-b-0 last:pb-0"
            data-admin-dashboard-status-row={row.status}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_72px_minmax(96px,auto)] gap-case-sm">
              <span className="font-medium text-foreground">
                {labels[row.status]}
              </span>
              <span className="text-right text-text-muted">{row.count}</span>
              <span className="text-right font-semibold text-foreground">
                {formatVnd(row.totalVnd)}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-admin-muted"
              data-admin-dashboard-status-rail={row.status}
            >
              <span
                className="block h-full rounded-full bg-admin"
                style={{
                  width: `${getStatusSharePercent(row.count, totalCount)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function getStatusSharePercent(count: number, totalCount: number) {
  if (totalCount <= 0 || count <= 0) {
    return 0;
  }

  return Math.max(6, Math.round((count / totalCount) * 100));
}

function TopBooksSection({
  dashboard,
  language,
}: {
  dashboard: AdminDashboardData;
  language: Language;
}) {
  const copy = dashboardCopy[language];

  return (
    <section
      className="min-w-0 rounded-lg border border-discovery/20 bg-surface p-case-md shadow-[var(--case-shadow-soft)]"
      data-admin-dashboard-top-books
    >
      <h2 className="text-heading-3 font-semibold text-foreground">
        {copy.topBooks}
      </h2>
      {dashboard.topBooks.length === 0 ? (
        <p className="mt-case-md text-body text-text-muted">{copy.noTopBooks}</p>
      ) : (
        <ol className="mt-case-md grid gap-case-sm">
          {dashboard.topBooks.map((book, index) => (
            <li
              key={`${book.editionId ?? book.title}-${index}`}
              className="grid gap-1 border-b border-border pb-case-sm last:border-b-0 last:pb-0"
              data-admin-dashboard-top-book
            >
              <div className="flex items-start justify-between gap-case-sm">
                <span className="min-w-0 break-words font-medium text-foreground">
                  {index + 1}. {book.title}
                </span>
                <span className="shrink-0 text-small font-semibold text-foreground">
                  {formatVnd(book.revenueVnd)}
                </span>
              </div>
              <p className="text-small text-text-muted">
                {book.quantitySold} {copy.units}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function LowStockSection({
  dashboard,
  language,
}: {
  dashboard: AdminDashboardData;
  language: Language;
}) {
  const copy = dashboardCopy[language];

  return (
    <section
      className="min-w-0 rounded-lg border border-warning/30 bg-offer-muted p-case-md shadow-[var(--case-shadow-soft)]"
      data-admin-dashboard-low-stock
    >
      <div className="flex items-start justify-between gap-case-sm">
        <div>
          <h2 className="text-heading-3 font-semibold text-foreground">
            {copy.inventoryRisk}
          </h2>
          <p className="mt-1 text-small text-text-muted">
            {copy.lowStock}: {dashboard.inventorySummary.lowStockCount} ·{" "}
            {inventoryStatusLabels[language]["out-of-stock"]}:{" "}
            {dashboard.inventorySummary.outOfStockCount}
          </p>
        </div>
      </div>
      {dashboard.lowStockEditions.length === 0 ? (
        <p className="mt-case-md text-body text-text-muted">
          {copy.lowStockEmpty}
        </p>
      ) : (
        <ul className="mt-case-md grid gap-case-sm">
          {dashboard.lowStockEditions.map((edition) => (
            <li
              key={edition.id}
              className="grid gap-1 border-b border-border pb-case-sm text-small last:border-b-0 last:pb-0"
              data-admin-dashboard-low-stock-item
            >
              <div className="flex items-start justify-between gap-case-sm">
                <span className="min-w-0 break-words font-medium text-foreground">
                  {edition.title}
                </span>
                <Badge
                  variant={
                    edition.inventoryStatus === "out-of-stock"
                      ? "error"
                      : "warning"
                  }
                >
                  {inventoryStatusLabels[language][edition.inventoryStatus]}
                </Badge>
              </div>
              <p className="text-text-muted">
                {copy.stock}: {edition.stockQuantity} · {copy.lowStockThreshold}:{" "}
                {edition.lowStockThreshold}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentOrdersSection({
  dashboard,
  language,
}: {
  dashboard: AdminDashboardData;
  language: Language;
}) {
  const copy = dashboardCopy[language];

  return (
    <section
      className="min-w-0 rounded-lg border border-admin/20 bg-surface p-case-md shadow-[var(--case-shadow-soft)]"
      data-admin-dashboard-recent-orders
    >
      <h2 className="text-heading-3 font-semibold text-foreground">
        {copy.recentOrders}
      </h2>
      {dashboard.recentOrders.length === 0 ? (
        <p className="mt-case-md text-body text-text-muted">
          {copy.noRecentOrders}
        </p>
      ) : (
        <>
        <div className="mt-case-md grid gap-case-sm md:hidden">
          {dashboard.recentOrders.map((order) => (
            <article
              key={order.orderCode}
              className="rounded-md border border-admin/20 bg-admin-muted p-case-sm"
              data-admin-dashboard-recent-order
            >
              <div className="flex items-start justify-between gap-case-sm">
                <div className="min-w-0">
                  <p className="break-words text-small font-semibold text-foreground">
                    {order.orderCode}
                  </p>
                  <p className="mt-1 text-small text-text-muted">
                    {order.customerName}
                  </p>
                </div>
                <p className="shrink-0 text-small font-semibold text-foreground">
                  {formatVnd(order.totalVnd)}
                </p>
              </div>
              <div className="mt-case-sm grid grid-cols-2 gap-case-xs text-small text-text-muted">
                <span>{orderStatusLabels[language][order.status]}</span>
                <span className="text-right">
                  {paymentStatusLabels[language][order.paymentStatus]}
                </span>
              </div>
              <p className="mt-case-xs text-small text-text-muted">
                {formatDateTime(order.createdAt, language)}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-case-md hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] border-collapse text-left text-small">
            <thead className="bg-admin-muted text-text-muted">
              <tr>
                <th className="px-case-sm py-case-sm font-semibold uppercase tracking-normal">
                  {copy.orderCount}
                </th>
                <th className="px-case-sm py-case-sm font-semibold uppercase tracking-normal">
                  {copy.paymentState}
                </th>
                <th className="px-case-sm py-case-sm font-semibold uppercase tracking-normal">
                  {copy.revenueEstimate}
                </th>
                <th className="px-case-sm py-case-sm font-semibold uppercase tracking-normal">
                  {copy.generated}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dashboard.recentOrders.map((order) => (
                <tr key={order.orderCode} data-admin-dashboard-recent-order>
                  <td className="px-case-sm py-case-sm align-top">
                    <p className="font-semibold text-foreground">
                      {order.orderCode}
                    </p>
                    <p className="mt-1 text-text-muted">{order.customerName}</p>
                  </td>
                  <td className="px-case-sm py-case-sm align-top">
                    <p>{orderStatusLabels[language][order.status]}</p>
                    <p className="mt-1 text-text-muted">
                      {paymentStatusLabels[language][order.paymentStatus]}
                    </p>
                  </td>
                  <td className="px-case-sm py-case-sm align-top font-semibold text-foreground">
                    {formatVnd(order.totalVnd)}
                  </td>
                  <td className="px-case-sm py-case-sm align-top text-text-muted">
                    {formatDateTime(order.createdAt, language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}

function rangeLinkClass(active: boolean) {
  return [
    "inline-flex min-h-10 items-center justify-center rounded-md border px-3 py-2 text-small font-medium transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    active
      ? "border-primary bg-primary text-surface"
      : "border-border bg-surface text-foreground hover:border-primary hover:text-primary",
  ].join(" ");
}

function buildOrdersExportHref(dashboard: AdminDashboardData) {
  const params = new URLSearchParams();

  if (dashboard.range.label === "custom") {
    if (dashboard.range.from) {
      params.set("from", dashboard.range.from.slice(0, 10));
    }

    if (dashboard.range.to) {
      const toInclusive = new Date(dashboard.range.to);
      toInclusive.setUTCDate(toInclusive.getUTCDate() - 1);
      params.set("to", toInclusive.toISOString().slice(0, 10));
    }
  } else {
    params.set("range", dashboard.range.label);
  }

  const query = params.toString();

  return query
    ? `/api/admin/exports/orders?${query}`
    : "/api/admin/exports/orders";
}

function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
