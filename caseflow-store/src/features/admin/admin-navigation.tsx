import Link from "next/link";

import { Badge } from "@/components/ui";
import type {
  AdminPermission,
  AdminWorkspaceRole,
} from "@/lib/auth/admin";
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";

export type AdminNavigationKey =
  | "dashboard"
  | "orders"
  | "catalog"
  | "inventory"
  | "promotions"
  | "customers"
  | "notifications"
  | "settings";

type AdminNavigationItem = {
  key: AdminNavigationKey;
  href: string;
  requiredPermission: AdminPermission;
};

const navigationItems: AdminNavigationItem[] = [
  { key: "dashboard", href: "/admin", requiredPermission: "orders:read" },
  { key: "orders", href: "/admin/orders", requiredPermission: "orders:read" },
  {
    key: "catalog",
    href: "/admin/catalog",
    requiredPermission: "catalog:manage",
  },
  {
    key: "inventory",
    href: "/admin/inventory",
    requiredPermission: "inventory:adjust",
  },
  {
    key: "promotions",
    href: "/admin/promotions",
    requiredPermission: "promotions:manage",
  },
  {
    key: "customers",
    href: "/admin/customers",
    requiredPermission: "orders:read",
  },
  {
    key: "notifications",
    href: "/admin/notifications",
    requiredPermission: "notifications:read",
  },
  {
    key: "settings",
    href: "/admin/settings",
    requiredPermission: "settings:manage",
  },
];

const navigationCopy = {
  en: {
    adminOnly: "Admin only",
    ariaLabel: "Operations navigation",
    dashboard: "Dashboard",
    orders: "Orders",
    catalog: "Catalog",
    inventory: "Inventory",
    promotions: "Promotions",
    customers: "Customers",
    notifications: "Notifications",
    settings: "Settings",
  },
  vi: {
    adminOnly: "Chỉ admin",
    ariaLabel: "Điều hướng vận hành",
    dashboard: "Tổng quan",
    orders: "Đơn hàng",
    catalog: "Danh mục",
    inventory: "Tồn kho",
    promotions: "Khuyến mãi",
    customers: "Khách hàng",
    notifications: "Thông báo",
    settings: "Cài đặt",
  },
} as const;

export function AdminOperationsNavigation({
  active,
  language,
  permissions,
  role,
}: {
  active: AdminNavigationKey;
  language: Language;
  permissions: AdminPermission[];
  role: AdminWorkspaceRole;
}) {
  const copy = navigationCopy[language];
  const visibleItems = navigationItems.filter((item) =>
    permissions.includes(item.requiredPermission),
  );

  return (
    <nav
      aria-label={copy.ariaLabel}
      className="rounded-lg border border-admin bg-admin p-case-sm shadow-[var(--case-shadow-soft)]"
      data-admin-operations-navigation
      data-admin-navigation-role={role}
    >
      <ul className="grid gap-case-xs sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {visibleItems.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={item.key === active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-small font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                item.key === active
                  ? "border-surface bg-surface text-admin"
                  : "border-transparent text-admin-muted hover:bg-surface/10 hover:text-surface",
              )}
              data-admin-nav-item={item.key}
            >
              {copy[item.key]}
            </Link>
          </li>
        ))}
      </ul>
      {role === "admin" ? null : (
        <div className="mt-case-sm" data-admin-navigation-hidden-settings>
          <Badge variant="neutral">{copy.adminOnly}: {copy.settings}</Badge>
        </div>
      )}
    </nav>
  );
}
