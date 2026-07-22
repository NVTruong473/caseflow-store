import { dispatchQueuedNotifications } from "@/lib/notifications/dispatcher";

export async function dispatchCommerceNotificationsBestEffort() {
  try {
    await dispatchQueuedNotifications({ limit: 25 });
    return true;
  } catch {
    // Don hang da commit khong duoc bao that bai chi vi provider/outbox tam loi.
    return false;
  }
}
