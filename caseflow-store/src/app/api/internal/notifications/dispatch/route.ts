import { apiError, apiSuccess } from "@/lib/api/response";
import { isNotificationDispatchAuthorized } from "@/lib/notifications/dispatch-auth";
import { dispatchQueuedNotifications } from "@/lib/notifications/dispatcher";

export async function POST(request: Request) {
  if (!isNotificationDispatchAuthorized(request)) {
    return apiError(
      { code: "UNAUTHORIZED", message: "Notification dispatcher is unavailable" },
      401,
    );
  }

  try {
    const summary = await dispatchQueuedNotifications();
    return apiSuccess(summary);
  } catch {
    return apiError(
      { code: "NOTIFICATION_DISPATCH_FAILED", message: "Notification dispatch failed" },
      500,
    );
  }
}
