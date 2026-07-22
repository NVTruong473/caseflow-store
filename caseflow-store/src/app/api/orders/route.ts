import { apiError } from "@/lib/api/response";
import { apiFromUseCaseResult } from "@/lib/api/use-case-response";
import { createBookOrderUseCase } from "@/lib/use-cases/orders/create-book-order";
import { createBookOrderRequestSchema } from "@/lib/validation/orders";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body",
      },
      400,
    );
  }

  const parsedBody = createBookOrderRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid order payload",
      },
      400,
    );
  }

  return apiFromUseCaseResult(
    await createBookOrderUseCase(parsedBody.data),
    { successStatus: 201 },
  );
}
