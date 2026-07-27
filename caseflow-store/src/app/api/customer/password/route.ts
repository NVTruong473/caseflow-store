import { apiError } from "@/lib/api/response";
import { apiFromUseCaseResult } from "@/lib/api/use-case-response";
import { changePasswordWithRoleAssuranceUseCase } from "@/lib/use-cases/auth/password-change";

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
      400,
    );
  }

  return apiFromUseCaseResult(
    await changePasswordWithRoleAssuranceUseCase(body),
  );
}
