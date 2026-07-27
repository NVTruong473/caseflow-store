import { apiFromUseCaseResult } from "@/lib/api/use-case-response";
import { requestCustomerPasswordRecoveryUseCase } from "@/lib/use-cases/auth/password-change";

export async function POST() {
  return apiFromUseCaseResult(
    await requestCustomerPasswordRecoveryUseCase(),
  );
}
