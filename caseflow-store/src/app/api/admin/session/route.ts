import { apiError, apiSuccess } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminLoginRequestSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
      400,
    );
  }

  const parsedBody = adminLoginRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid login credentials" },
      400,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword(parsedBody.data);

  if (authError || !authData.user) {
    return apiError(
      { code: "UNAUTHORIZED", message: "Invalid email or password" },
      401,
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name,role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return apiError(
      {
        code: "ADMIN_AUTH_UNAVAILABLE",
        message: "Admin authorization is temporarily unavailable",
      },
      503,
    );
  }

  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    return apiError(
      { code: "FORBIDDEN", message: "Admin role required" },
      403,
    );
  }

  return apiSuccess({
    email: authData.user.email ?? "",
    displayName: profile.display_name?.trim() || "CaseFlow Admin",
  });
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return apiError(
      { code: "SIGN_OUT_FAILED", message: "Admin session could not be cleared" },
      500,
    );
  }

  return apiSuccess({ signedOut: true });
}
