import Link from "next/link";
import type React from "react";

import { Badge, Container } from "@/components/ui";
import type {
  AdminPermission,
  AdminWorkspaceRole,
} from "@/lib/auth/admin";
import type { Language } from "@/lib/i18n/language";

import {
  AdminOperationsNavigation,
  type AdminNavigationKey,
} from "./admin-navigation";

type ShellMetric = {
  label: string;
  value: string;
};

const shellCopy = {
  en: {
    backToStorefront: "Storefront",
    metricSignals: (count: number) => `${count} live signals`,
    operationsRail: "Operations rail",
    permissionScope: (count: number) => `${count} permissions`,
    signedInAs: (name: string) => `Signed in as ${name}`,
    surface: "Active surface",
    surfaces: {
      catalog: "Catalog operations",
      customers: "Customer operations",
      dashboard: "Sales overview",
      inventory: "Inventory control",
      notifications: "Notification delivery",
      orders: "Order queue",
      promotions: "Promotion desk",
      settings: "Workspace settings",
    },
    roleLabel: "Workspace role",
    roleNames: {
      admin: "Admin",
      staff: "Staff",
    },
  },
  vi: {
    backToStorefront: "Cửa hàng",
    metricSignals: (count: number) => `${count} tín hiệu`,
    operationsRail: "Thanh vận hành",
    permissionScope: (count: number) => `${count} quyền`,
    signedInAs: (name: string) => `Đã đăng nhập: ${name}`,
    surface: "Khu vực đang xử lý",
    surfaces: {
      catalog: "Vận hành danh mục",
      customers: "Vận hành khách hàng",
      dashboard: "Tổng quan doanh số",
      inventory: "Kiểm soát tồn kho",
      notifications: "Vận hành thông báo",
      orders: "Hàng đợi đơn",
      promotions: "Bàn khuyến mãi",
      settings: "Cài đặt workspace",
    },
    roleLabel: "Vai trò",
    roleNames: {
      admin: "Admin",
      staff: "Staff",
    },
  },
} as const;

export function AdminShellPage({
  active,
  badge,
  children,
  description,
  language,
  metrics = [],
  permissions,
  role,
  title,
  userName,
}: {
  active: AdminNavigationKey;
  badge: string;
  children?: React.ReactNode;
  description: string;
  language: Language;
  metrics?: readonly ShellMetric[];
  permissions: AdminPermission[];
  role: AdminWorkspaceRole;
  title: string;
  userName: string;
}) {
  const copy = shellCopy[language];

  return (
    <main
      className="bg-admin-muted py-case-2xl text-foreground"
      data-admin-shell-page={active}
      data-admin-workspace-role={role}
    >
      <Container className="flex flex-col gap-case-lg">
        <div className="flex flex-col gap-case-md rounded-lg border border-admin/20 bg-surface p-case-lg shadow-[var(--case-shadow-soft)] lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-small font-medium text-text-muted">
              {copy.signedInAs(userName)}
            </p>
            <div className="mt-case-md flex flex-wrap gap-case-sm">
              <Badge
                className="border-admin/20 bg-admin-muted text-admin"
                variant="neutral"
              >
                {badge}
              </Badge>
              <Badge variant="neutral" data-admin-role-badge={role}>
                {copy.roleLabel}: {copy.roleNames[role]}
              </Badge>
            </div>
            <h1 className="mt-case-sm text-heading-2 font-semibold text-foreground sm:text-heading-1">
              {title}
            </h1>
            <p className="mt-case-sm max-w-3xl text-body leading-7 text-text-muted">
              {description}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-admin/20 bg-admin px-4 py-2 text-body font-medium text-surface transition-colors hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.backToStorefront}
          </Link>
        </div>

        <AdminOperationsNavigation
          active={active}
          language={language}
          permissions={permissions}
          role={role}
        />

        <AdminOperationsRail
          active={active}
          language={language}
          metricsCount={metrics.length}
          permissions={permissions}
          role={role}
        />

        {metrics.length > 0 ? (
          <dl className="grid gap-case-sm sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="relative overflow-hidden rounded-md border border-admin/20 bg-surface p-case-md pl-case-lg shadow-[var(--case-shadow-soft)]"
                data-admin-shell-metric
              >
                <span className="absolute inset-y-0 left-0 w-1 bg-admin" />
                <dt className="text-small text-text-muted">{metric.label}</dt>
                <dd className="mt-case-xs text-heading-3 font-semibold text-foreground">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {children}
      </Container>
    </main>
  );
}

export function AdminOperationsRail({
  active,
  language,
  metricsCount,
  permissions,
  role,
}: {
  active: AdminNavigationKey;
  language: Language;
  metricsCount: number;
  permissions: AdminPermission[];
  role: AdminWorkspaceRole;
}) {
  const copy = shellCopy[language];
  const items = [
    {
      label: copy.surface,
      value: copy.surfaces[active],
    },
    {
      label: copy.roleLabel,
      value: copy.roleNames[role],
    },
    {
      label: language === "vi" ? "Phạm vi quyền" : "Permission scope",
      value: copy.permissionScope(permissions.length),
    },
    {
      label: language === "vi" ? "Tín hiệu hiển thị" : "Visible signals",
      value: copy.metricSignals(metricsCount),
    },
  ];

  return (
    <section
      aria-label={copy.operationsRail}
      className="grid gap-case-sm rounded-lg border border-admin/20 bg-surface p-case-md shadow-[var(--case-shadow-soft)] md:grid-cols-4"
      data-admin-operations-rail
      data-admin-operations-rail-active={active}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-md border-l-4 border-admin bg-admin-muted px-case-sm py-case-sm"
          data-admin-operations-rail-item
        >
          <p className="text-small text-text-muted">{item.label}</p>
          <p className="mt-1 break-words text-small font-semibold text-admin">
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}
