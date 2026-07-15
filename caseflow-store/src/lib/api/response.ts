import { NextResponse } from "next/server";

import type { ApiErrorCode } from "@/lib/api/error-codes";

type ApiResponseMeta = Record<string, unknown> | null;

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
};

export function apiSuccess<TData>(
  data: TData,
  options: { status?: number; meta?: ApiResponseMeta } = {},
) {
  return NextResponse.json(
    {
      data,
      error: null,
      meta: options.meta ?? null,
    },
    { status: options.status ?? 200 },
  );
}

export function apiError(error: ApiErrorBody, status: number) {
  return NextResponse.json(
    {
      data: null,
      error,
      meta: null,
    },
    { status },
  );
}
