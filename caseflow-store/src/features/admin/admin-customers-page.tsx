"use client";

import * as React from "react";

import { Badge, Input } from "@/components/ui";
import type { AdminCustomerApiItem } from "@/lib/api/admin-customers";
import type {
  AdminPermission,
  AdminWorkspaceRole,
} from "@/lib/auth/admin";
import { formatVnd } from "@/lib/format/currency";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";
import type { CustomerRequiredProfileField } from "@/types/domain";

import { AdminShellPage } from "./admin-shell-page";

const customerCopy = {
  en: {
    badge: "Customers",
    contact: "Contact state",
    createdAt: "Created",
    description:
      "Search customer profiles, profile readiness, and order activity with minimized sensitive data.",
    email: "Email",
    emailVerified: "Email verified",
    hasAddress: "Address summary",
    hasPhone: "Phone ending",
    lastOrder: "Last order",
    metrics: {
      complete: "Checkout-ready",
      ordered: "With orders",
      total: "Customers",
    },
    missing: "Missing",
    noAddress: "No address summary",
    noOrders: "No orders",
    noPhone: "No phone",
    noResults: "No customer matches this search.",
    orderCount: "Orders",
    phoneUnverified: "Phone unverified",
    phoneVerified: "Phone verified",
    profile: "Profile state",
    profileComplete: "Checkout-ready",
    profileIncomplete: "Incomplete",
    search: "Search name, email, order code, district, or province",
    selectedCustomer: "Customer detail",
    title: "Customer management",
    totalSpend: "Total spend",
    updatedAt: "Updated",
  },
  vi: {
    badge: "Khách hàng",
    contact: "Trạng thái liên hệ",
    createdAt: "Ngày tạo",
    description:
      "Tìm hồ sơ khách hàng, trạng thái sẵn sàng checkout và hoạt động đơn hàng với dữ liệu nhạy cảm tối thiểu.",
    email: "Email",
    emailVerified: "Email đã xác nhận",
    hasAddress: "Tóm tắt địa chỉ",
    hasPhone: "SĐT kết thúc",
    lastOrder: "Đơn gần nhất",
    metrics: {
      complete: "Sẵn sàng checkout",
      ordered: "Đã có đơn",
      total: "Khách hàng",
    },
    missing: "Thiếu",
    noAddress: "Chưa có tóm tắt địa chỉ",
    noOrders: "Chưa có đơn",
    noPhone: "Chưa có SĐT",
    noResults: "Không có khách hàng khớp tìm kiếm.",
    orderCount: "Số đơn",
    phoneUnverified: "SĐT chưa xác thực",
    phoneVerified: "SĐT đã xác thực",
    profile: "Trạng thái hồ sơ",
    profileComplete: "Sẵn sàng checkout",
    profileIncomplete: "Chưa đủ",
    search: "Tìm tên, email, mã đơn, quận/huyện hoặc tỉnh/thành",
    selectedCustomer: "Chi tiết khách hàng",
    title: "Quản lý khách hàng",
    totalSpend: "Tổng chi tiêu",
    updatedAt: "Cập nhật",
  },
} as const;

export function AdminCustomersPage({
  adminName,
  adminPermissions,
  adminRole,
  initialCustomers,
  language,
}: {
  adminName: string;
  adminPermissions: AdminPermission[];
  adminRole: AdminWorkspaceRole;
  initialCustomers: AdminCustomerApiItem[];
  language: Language;
}) {
  const copy = customerCopy[language];
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialCustomers[0]?.id ?? null,
  );
  const filteredCustomers = React.useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    if (!normalizedQuery) {
      return initialCustomers;
    }

    return initialCustomers.filter((customer) =>
      normalizeSearch(
        [
          customer.displayName,
          customer.email,
          customer.fullName,
          customer.lastOrderCode,
          customer.defaultShippingAddressSummary?.district,
          customer.defaultShippingAddressSummary?.province,
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(normalizedQuery),
    );
  }, [initialCustomers, query]);
  const selectedCustomer =
    filteredCustomers.find((customer) => customer.id === selectedId) ??
    filteredCustomers[0] ??
    null;
  const completeCount = initialCustomers.filter(
    (customer) => customer.profileCompleteness.isCompleteForCheckout,
  ).length;
  const orderedCount = initialCustomers.filter(
    (customer) => customer.orderCount > 0,
  ).length;
  const metrics = [
    { label: copy.metrics.total, value: String(initialCustomers.length) },
    { label: copy.metrics.complete, value: String(completeCount) },
    { label: copy.metrics.ordered, value: String(orderedCount) },
  ];

  return (
    <AdminShellPage
      active="customers"
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
        className="grid gap-case-lg xl:grid-cols-[minmax(0,1fr)_minmax(340px,440px)]"
        data-admin-customers-page
      >
        <div className="min-w-0 rounded-lg border border-admin/20 bg-surface p-case-lg shadow-[var(--case-shadow-soft)]">
          <Input
            label={copy.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            data-admin-customers-search
          />

          <div className="mt-case-lg grid gap-case-sm" data-admin-customers-list>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedId(customer.id)}
                  className={cn(
                    "rounded-md border p-case-md text-left transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    selectedCustomer?.id === customer.id
                      ? "border-admin bg-admin-muted"
                      : "border-border bg-surface hover:border-admin",
                  )}
                  data-admin-customer-item={customer.id}
                >
                  <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-body font-semibold text-foreground">
                        {customer.displayName}
                      </h2>
                      <p className="mt-case-xs break-words text-small text-text-muted">
                        {customer.email || "-"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-case-xs">
                      <Badge
                        variant={
                          customer.profileCompleteness.isCompleteForCheckout
                            ? "success"
                            : "warning"
                        }
                      >
                        {customer.profileCompleteness.isCompleteForCheckout
                          ? copy.profileComplete
                          : copy.profileIncomplete}
                      </Badge>
                      <Badge variant="neutral">
                        {copy.orderCount}: {customer.orderCount}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="rounded-md border border-border bg-surface-muted p-case-md text-body text-text-muted">
                {copy.noResults}
              </p>
            )}
          </div>
        </div>

        <CustomerDetailPanel
          copy={copy}
          customer={selectedCustomer}
          language={language}
        />
      </section>
    </AdminShellPage>
  );
}

function CustomerDetailPanel({
  copy,
  customer,
  language,
}: {
  copy: (typeof customerCopy)[Language];
  customer: AdminCustomerApiItem | null;
  language: Language;
}) {
  if (!customer) {
    return (
      <aside
        className="rounded-lg border border-operations/25 bg-operations-muted p-case-lg"
        data-admin-customer-detail
      >
        <h2 className="text-heading-3 font-semibold text-foreground">
          {copy.selectedCustomer}
        </h2>
        <p className="mt-case-sm text-body text-text-muted">{copy.noResults}</p>
      </aside>
    );
  }

  const addressSummary = customer.defaultShippingAddressSummary
    ? `${customer.defaultShippingAddressSummary.district}, ${customer.defaultShippingAddressSummary.province}`
    : copy.noAddress;

  return (
    <aside
      className="rounded-lg border border-operations/25 bg-operations-muted p-case-lg"
      data-admin-customer-detail={customer.id}
    >
      <div className="flex flex-col gap-case-sm">
        <h2 className="text-heading-3 font-semibold text-foreground">
          {copy.selectedCustomer}
        </h2>
        <div className="flex flex-wrap gap-case-xs">
          <Badge
            variant={
              customer.profileCompleteness.isCompleteForCheckout
                ? "success"
                : "warning"
            }
          >
            {customer.profileCompleteness.isCompleteForCheckout
              ? copy.profileComplete
              : copy.profileIncomplete}
          </Badge>
          <Badge variant={customer.emailVerified ? "success" : "warning"}>
            {customer.emailVerified ? copy.emailVerified : copy.missing}
          </Badge>
        </div>
      </div>

      <dl className="mt-case-lg grid gap-case-sm">
        <DetailMetric label={copy.email} value={customer.email || "-"} />
        <DetailMetric
          label={copy.hasPhone}
          value={
            customer.phoneLast4 ? `•••• ${customer.phoneLast4}` : copy.noPhone
          }
        />
        <DetailMetric
          label={copy.contact}
          value={customer.phoneVerified ? copy.phoneVerified : copy.phoneUnverified}
        />
        <DetailMetric label={copy.hasAddress} value={addressSummary} />
        <DetailMetric
          label={copy.profile}
          value={
            customer.profileCompleteness.isCompleteForCheckout
              ? copy.profileComplete
              : formatMissingFields(
                  copy,
                  customer.profileCompleteness.missingFields,
                )
          }
        />
        <DetailMetric
          dataAttr="data-admin-customer-order-count"
          label={copy.orderCount}
          value={String(customer.orderCount)}
        />
        <DetailMetric
          label={copy.totalSpend}
          value={formatVnd(customer.totalSpendVnd)}
        />
        <DetailMetric
          label={copy.lastOrder}
          value={customer.lastOrderCode ?? copy.noOrders}
        />
        <DetailMetric
          label={copy.createdAt}
          value={formatDateTime(customer.createdAt, language)}
        />
        <DetailMetric
          label={copy.updatedAt}
          value={formatDateTime(customer.updatedAt, language)}
        />
      </dl>
    </aside>
  );
}

function DetailMetric({
  dataAttr,
  label,
  value,
}: {
  dataAttr?: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-md border border-admin/20 bg-surface p-case-md"
      {...(dataAttr ? { [dataAttr]: true } : {})}
    >
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-case-xs break-words font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function formatMissingFields(
  copy: (typeof customerCopy)[Language],
  fields: CustomerRequiredProfileField[],
) {
  if (fields.length === 0) {
    return copy.profileComplete;
  }

  return `${copy.missing}: ${fields.join(", ")}`;
}

function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}
