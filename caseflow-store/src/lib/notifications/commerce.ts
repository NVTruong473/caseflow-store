import { after } from "next/server";

import { dispatchQueuedNotifications } from "@/lib/notifications/dispatcher";

export async function dispatchCommerceNotificationsBestEffort() {
  try {
    // Don hang va thong bao trong app da commit. Email/SMS outbox chay sau
    // response de provider cham khong lam tre checkout hoac thao tac van hanh.
    after(async () => {
      try {
        await dispatchQueuedNotifications({ limit: 25 });
      } catch {
        // Internal dispatcher va retry co the tiep tuc xu ly outbox sau.
      }
    });
    return true;
  } catch {
    // Don hang da commit khong duoc bao that bai chi vi scheduler tam loi.
    return false;
  }
}
