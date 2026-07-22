import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getNotificationConfigurationSummary } from "@/lib/notifications/config";

export async function GET() {
  const auth = await requireAdminPermission("notifications:manage-config");

  if (!auth.authorized) {
    return apiError({ code: auth.code, message: auth.message }, auth.status);
  }

  return apiSuccess(getNotificationConfigurationSummary());
}
