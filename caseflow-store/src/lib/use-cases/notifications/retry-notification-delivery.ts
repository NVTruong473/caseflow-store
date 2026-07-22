import { requireAdminPermission } from "@/lib/auth/admin";
import {
  getNotificationRuntimeConfig,
  isExternalNotificationChannelReady,
} from "@/lib/notifications/config";
import { dispatchQueuedNotifications } from "@/lib/notifications/dispatcher";
import {
  getAdminNotificationOperation,
  requeueAdminNotificationOperation,
} from "@/lib/notifications/repository";
import { createUseCaseFailure, type UseCaseResult } from "@/lib/use-cases/result";
import type { NotificationStatus } from "@/types/notifications";

type RetryNotificationDeliveryResult = {
  id: string;
  status: NotificationStatus;
  updatedAt: string;
};

export async function retryNotificationDeliveryUseCase(
  notificationId: string,
): Promise<UseCaseResult<RetryNotificationDeliveryResult>> {
  const auth = await requireAdminPermission("notifications:retry");

  if (!auth.authorized) {
    return createUseCaseFailure(auth.code, auth.message, auth.status);
  }

  try {
    const record = await getAdminNotificationOperation(notificationId);

    if (!record) {
      return createUseCaseFailure(
        "NOTIFICATION_RETRY_NOT_ALLOWED",
        "Notification delivery was not found",
        404,
      );
    }

    const config = getNotificationRuntimeConfig();
    const retryableState = record.status === "blocked" || record.status === "failed";
    const sandboxPreview = record.lastErrorCode === "SANDBOX_PREVIEW";
    const externalReady =
      record.channel !== "in-app" &&
      isExternalNotificationChannelReady(record.channel, config);

    if (!retryableState || sandboxPreview || !externalReady) {
      return createUseCaseFailure(
        "NOTIFICATION_RETRY_NOT_ALLOWED",
        "This delivery cannot be retried in the current state or server configuration",
        409,
      );
    }

    const requeued = await requeueAdminNotificationOperation(notificationId);

    if (!requeued) {
      return createUseCaseFailure(
        "NOTIFICATION_RETRY_NOT_ALLOWED",
        "Notification state changed before it could be retried",
        409,
      );
    }

    // Việc gửi lại vẫn đi qua dispatcher chung để giữ nguyên retry và idempotency.
    await dispatchQueuedNotifications({ limit: 100 });
    const processed = (await getAdminNotificationOperation(notificationId)) ?? requeued;
    return {
      data: {
        id: processed.id,
        status: processed.status,
        updatedAt: processed.updatedAt,
      },
      success: true,
    };
  } catch {
    return createUseCaseFailure(
      "NOTIFICATION_WRITE_FAILED",
      "Notification delivery could not be retried",
      500,
    );
  }
}
