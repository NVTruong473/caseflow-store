import { apiError, apiSuccess } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { customerPasswordChangeRequestSchema } from "@/lib/validation/auth";

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

  const parsedBody = customerPasswordChangeRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid password change payload" },
      400,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const email = user?.email?.trim();

  if (userError || !user || !email) {
    return apiError(
      { code: "UNAUTHORIZED", message: "Account authentication required" },
      401,
    );
  }

  // Xác minh lại mật khẩu hiện tại trên server trước khi đổi mật khẩu.
  // Không để một session trình duyệt đang mở tự đổi mật khẩu mà không re-auth.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: parsedBody.data.currentPassword,
  });

  if (reauthError) {
    return apiError(
      { code: "UNAUTHORIZED", message: "Current password is incorrect" },
      401,
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsedBody.data.newPassword,
  });

  if (updateError) {
    return apiError(
      {
        code: "PASSWORD_UPDATE_FAILED",
        message: "Password could not be changed. Try again later.",
      },
      503,
    );
  }

  return apiSuccess({ passwordUpdated: true });
}
