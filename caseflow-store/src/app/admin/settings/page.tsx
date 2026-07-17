import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShellPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Operations settings | CaseFlow Books",
  description: "Admin-only settings shell for CaseFlow Books operations.",
};

const settingsCopy = {
  en: {
    badge: "Settings",
    deniedDescription:
      "Settings are admin-only because they can affect role policy and business controls.",
    deniedTitle: "Settings require admin permission",
    description:
      "Admin-only settings boundary for future role, business, and integration controls.",
    metrics: [
      { label: "Permission", value: "settings:manage" },
      { label: "Access", value: "Admin only" },
    ],
    panel:
      "High-risk settings remain a boundary until a later task implements concrete controls.",
    title: "Operations settings",
  },
  vi: {
    badge: "Cài đặt",
    deniedDescription:
      "Cài đặt chỉ dành cho admin vì có thể ảnh hưởng chính sách vai trò và kiểm soát kinh doanh.",
    deniedTitle: "Cài đặt cần quyền admin",
    description:
      "Ranh giới cài đặt chỉ dành cho admin cho các kiểm soát vai trò, kinh doanh và tích hợp về sau.",
    metrics: [
      { label: "Permission", value: "settings:manage" },
      { label: "Truy cập", value: "Chỉ admin" },
    ],
    panel:
      "Cài đặt rủi ro cao vẫn là boundary cho đến khi task sau triển khai kiểm soát cụ thể.",
    title: "Cài đặt vận hành",
  },
} as const;

export default async function AdminSettingsRoute() {
  const language = await getRequestLanguage();
  const operationsAuth = await requireAdminPermission("orders:read");

  if (!operationsAuth.authorized) {
    redirect(`/admin/login?reason=${operationsAuth.code.toLowerCase()}`);
  }

  const copy = settingsCopy[language];
  const canManageSettings = operationsAuth.user.permissions.includes(
    "settings:manage",
  );

  return (
    <AdminShellPage
      active="settings"
      badge={copy.badge}
      description={
        canManageSettings ? copy.description : copy.deniedDescription
      }
      language={language}
      metrics={canManageSettings ? copy.metrics : []}
      permissions={operationsAuth.user.permissions}
      role={operationsAuth.user.role}
      title={canManageSettings ? copy.title : copy.deniedTitle}
      userName={operationsAuth.user.displayName}
    >
      <section
        className="rounded-lg border border-border bg-surface p-case-lg"
        data-admin-settings-shell
        data-admin-settings-state={canManageSettings ? "allowed" : "denied"}
      >
        <p className="text-body leading-7 text-text-muted">
          {canManageSettings ? copy.panel : copy.deniedDescription}
        </p>
      </section>
    </AdminShellPage>
  );
}
