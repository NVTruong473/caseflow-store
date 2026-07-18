import { toAdminBookEditionApiItem } from "@/lib/api/admin-book-catalog";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import {
  updateSupabaseAdminBookEdition,
  validateSupabaseAdminBookEditionSourceApproval,
} from "@/lib/repositories/supabase-books";
import { adminBookEditionUpdateSchema } from "@/lib/validation/books";
import { idSchema } from "@/lib/validation/domain";

type AdminBookEditionRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: AdminBookEditionRouteContext,
) {
  const adminAuth = await requireAdminPermission("catalog:manage");

  if (!adminAuth.authorized) {
    return apiError(
      {
        code: adminAuth.code,
        message: adminAuth.message,
      },
      adminAuth.status,
    );
  }

  const { id } = await params;
  const parsedEditionId = idSchema.safeParse(id);

  if (!parsedEditionId.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid book edition id",
      },
      400,
    );
  }

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

  const parsedBody = adminBookEditionUpdateSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid book edition update payload",
      },
      400,
    );
  }

  const sourceFields = [
    "displayFacts",
    "omittedOptionalFactKeys",
    "sourceEditionKey",
    "sourceReviewStatus",
  ] as const;
  const bodyRecord =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const changesSourceReview = sourceFields.some(
    (field) => Object.prototype.hasOwnProperty.call(bodyRecord, field),
  );

  if (changesSourceReview && adminAuth.user.role !== "admin") {
    return apiError(
      {
        code: "FORBIDDEN",
        message: "Only admins can change source review fields",
      },
      403,
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(bodyRecord, "sourceReviewStatus") &&
    parsedBody.data.sourceReviewStatus === "approved"
  ) {
    const approvalCheck =
      await validateSupabaseAdminBookEditionSourceApproval(
        parsedEditionId.data,
        parsedBody.data,
      );

    if (!approvalCheck.allowed) {
      return apiError(
        {
          code: approvalCheck.code,
          message: approvalCheck.message,
        },
        approvalCheck.status,
      );
    }
  }

  try {
    const record = await updateSupabaseAdminBookEdition(
      parsedEditionId.data,
      parsedBody.data,
    );

    if (!record) {
      return apiError(
        {
          code: "BOOK_EDITION_NOT_FOUND",
          message: "Book edition not found",
        },
        404,
      );
    }

    return apiSuccess(toAdminBookEditionApiItem(record), {
      meta: { resource: "admin-book-edition" },
    });
  } catch {
    return apiError(
      {
        code: "BOOK_CATALOG_WRITE_FAILED",
        message: "Book edition could not be updated",
      },
      500,
    );
  }
}
