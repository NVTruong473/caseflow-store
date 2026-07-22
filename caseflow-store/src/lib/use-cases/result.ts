import type { ApiErrorCode } from "@/lib/api/error-codes";

export type UseCaseFailure = {
  code: ApiErrorCode;
  message: string;
  status: number;
  success: false;
};

export type UseCaseResult<TData> =
  | {
      data: TData;
      success: true;
    }
  | UseCaseFailure;

export function createUseCaseFailure(
  code: ApiErrorCode,
  message: string,
  status: number,
): UseCaseFailure {
  return {
    code,
    message,
    status,
    success: false,
  };
}
