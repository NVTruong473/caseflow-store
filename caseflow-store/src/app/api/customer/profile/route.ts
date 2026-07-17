import { apiError, apiSuccess } from "@/lib/api/response";
import { updateCustomerProfileForAuthUser } from "@/lib/auth/customer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { customerProfileUpdateRequestSchema } from "@/lib/validation/domain";

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

  const parsedBody = customerProfileUpdateRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid customer profile payload" },
      400,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return apiError(
      { code: "UNAUTHORIZED", message: "Customer authentication required" },
      401,
    );
  }

  const updateResult = await updateCustomerProfileForAuthUser({
    profile: parsedBody.data,
    user,
  });

  if (!updateResult.success) {
    return apiError(
      {
        code:
          updateResult.status === 403
            ? "FORBIDDEN"
            : "CUSTOMER_PROFILE_UNAVAILABLE",
        message: updateResult.message,
      },
      updateResult.status,
    );
  }

  return apiSuccess(updateResult.user);
}
