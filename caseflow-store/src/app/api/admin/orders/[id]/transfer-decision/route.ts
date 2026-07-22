import { apiError } from "@/lib/api/response";
import { apiFromUseCaseResult } from "@/lib/api/use-case-response";
import { decideSimulatedTransferUseCase } from "@/lib/use-cases/orders/decide-simulated-transfer";
import { idSchema } from "@/lib/validation/domain";
import { simulatedTransferDecisionRequestSchema } from "@/lib/validation/orders";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const parsedId = idSchema.safeParse((await params).id);

  if (!parsedId.success) {
    return apiError({ code: "VALIDATION_ERROR", message: "Invalid order id" }, 400);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const parsed = simulatedTransferDecisionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid transfer decision" },
      400,
    );
  }

  return apiFromUseCaseResult(
    await decideSimulatedTransferUseCase({
      orderId: parsedId.data,
      request: parsed.data,
    }),
  );
}
