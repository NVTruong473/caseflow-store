import { apiFromUseCaseResult } from "@/lib/api/use-case-response";
import { createCheckoutExperienceUseCase } from "@/lib/use-cases/checkout-experience/session";
import { checkoutExperienceCreateRequestSchema } from "@/lib/validation/checkout-experience";
import { apiError } from "@/lib/api/response";

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

  const parsed = checkoutExperienceCreateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid checkout experience payload",
      },
      400,
    );
  }

  return apiFromUseCaseResult(
    await createCheckoutExperienceUseCase({
      origin: new URL(request.url).origin,
      request: parsed.data,
    }),
    { successStatus: 201 },
  );
}
