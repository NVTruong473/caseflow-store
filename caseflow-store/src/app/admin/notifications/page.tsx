import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminNotificationsPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getNotificationConfigurationSummary } from "@/lib/notifications/config";
import { listAdminNotificationOperations } from "@/lib/notifications/repository";

export const metadata: Metadata = {
  title: "Notification operations | CaseFlow Books",
  description: "Transactional notification delivery operations for CaseFlow Books.",
};

export default async function AdminNotificationsRoute() {
  const language = await getRequestLanguage();
  const auth = await requireAdminPermission("notifications:read");

  if (!auth.authorized) {
    redirect(`/admin/login?reason=${auth.code.toLowerCase()}`);
  }

  let notifications: Awaited<
    ReturnType<typeof listAdminNotificationOperations>
  > = [];
  let loadError: string | null = null;

  try {
    notifications = await listAdminNotificationOperations();
  } catch {
    loadError =
      language === "vi"
        ? "Không thể tải dữ liệu vận hành thông báo."
        : "Notification operations could not be loaded.";
  }

  return (
    <AdminNotificationsPage
      adminName={auth.user.displayName}
      adminPermissions={auth.user.permissions}
      adminRole={auth.user.role}
      initialConfiguration={
        auth.user.permissions.includes("notifications:manage-config")
          ? getNotificationConfigurationSummary()
          : null
      }
      initialLoadError={loadError}
      initialNotifications={notifications}
      language={language}
    />
  );
}
