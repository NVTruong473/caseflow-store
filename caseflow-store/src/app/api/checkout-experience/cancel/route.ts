import { apiError } from "@/lib/api/response";
import { apiFromUseCaseResult } from "@/lib/api/use-case-response";
import { cancelCheckoutExperienceUseCase } from "@/lib/use-cases/checkout-experience/session";
import { checkoutExperienceCancelRequestSchema } from "@/lib/validation/checkout-experience";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
      400,
    );
  }

  const parsed = checkoutExperienceCancelRequestSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid experience token" },
      400,
    );
  }

  return apiFromUseCaseResult(
    await cancelCheckoutExperienceUseCase(parsed.data.token),
  );
}
