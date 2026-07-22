import { apiError } from "@/lib/api/response";
import { apiFromUseCaseResult } from "@/lib/api/use-case-response";
import { retryNotificationDeliveryUseCase } from "@/lib/use-cases/notifications/retry-notification-delivery";
import { idSchema } from "@/lib/validation/domain";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: RouteContext) {
  const parsedId = idSchema.safeParse((await params).id);

  if (!parsedId.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid notification id" },
      400,
    );
  }

  return apiFromUseCaseResult(
    await retryNotificationDeliveryUseCase(parsedId.data),
  );
}
