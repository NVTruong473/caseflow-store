import { apiError } from "@/lib/api/response";
import { apiFromUseCaseResult } from "@/lib/api/use-case-response";
import { completeCheckoutExperienceUseCase } from "@/lib/use-cases/checkout-experience/session";
import { checkoutExperienceCompleteRequestSchema } from "@/lib/validation/checkout-experience";

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

  const parsed = checkoutExperienceCompleteRequestSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid checkout experience confirmation",
      },
      400,
    );
  }

  return apiFromUseCaseResult(
    await completeCheckoutExperienceUseCase(parsed.data),
  );
}
