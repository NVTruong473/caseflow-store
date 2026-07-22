import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminNotificationOperations } from "@/lib/notifications/repository";
import { adminNotificationFiltersSchema } from "@/lib/validation/notifications";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("notifications:read");

  if (!auth.authorized) {
    return apiError({ code: auth.code, message: auth.message }, auth.status);
  }

  const url = new URL(request.url);
  const filters = adminNotificationFiltersSchema.safeParse({
    channel: url.searchParams.get("channel") || undefined,
    eventType: url.searchParams.get("eventType") || undefined,
    q: url.searchParams.get("q") || undefined,
    status: url.searchParams.get("status") || undefined,
  });

  if (!filters.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid notification filters" },
      400,
    );
  }

  try {
    const notifications = await listAdminNotificationOperations(filters.data);
    return apiSuccess(notifications, {
      meta: { count: notifications.length, resource: "admin-notifications" },
    });
  } catch {
    return apiError(
      { code: "NOTIFICATION_READ_FAILED", message: "Notifications could not be loaded" },
      500,
    );
  }
}
