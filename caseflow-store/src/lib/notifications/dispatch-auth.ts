import crypto from "node:crypto";

import { getNotificationRuntimeConfig } from "@/lib/notifications/config";

export function isNotificationDispatchAuthorized(request: Request) {
  const expected = getNotificationRuntimeConfig().dispatchSecret;
  const authorization = request.headers.get("authorization");
  const supplied = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;

  if (!expected || !supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  return (
    expectedBuffer.length === suppliedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}
