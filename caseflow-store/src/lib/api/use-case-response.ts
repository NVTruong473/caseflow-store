import { apiError, apiSuccess } from "@/lib/api/response";
import type { UseCaseResult } from "@/lib/use-cases/result";

export function apiFromUseCaseResult<TData>(
  result: UseCaseResult<TData>,
  options: { successStatus?: number } = {},
) {
  if (!result.success) {
    return apiError(
      {
        code: result.code,
        message: result.message,
      },
      result.status,
    );
  }

  return apiSuccess(result.data, { status: options.successStatus });
}
