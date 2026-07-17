import { apiError, apiSuccess } from "@/lib/api/response";
import { ensureCustomerProfileForAuthUser } from "@/lib/auth/customer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { customerSessionRequestSchema } from "@/lib/validation/auth";

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

  const parsedBody = customerSessionRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid customer auth payload" },
      400,
    );
  }

  const supabase = await createSupabaseServerClient();

  if (parsedBody.data.intent === "sign-up") {
    const redirectUrl = new URL("/account", request.url);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: parsedBody.data.email,
      password: parsedBody.data.password,
      options: {
        data: { full_name: parsedBody.data.fullName },
        emailRedirectTo: redirectUrl.toString(),
      },
    });

    if (authError || !authData.user) {
      const isRateLimited = authError?.status === 429;

      return apiError(
        {
          code: "CUSTOMER_AUTH_FAILED",
          message: isRateLimited
            ? "Customer sign-up is temporarily rate-limited. Try again later."
            : "Customer sign-up could not be completed",
        },
        isRateLimited ? 429 : 400,
      );
    }

    const profileResult = await ensureCustomerProfileForAuthUser({
      fullName: parsedBody.data.fullName,
      user: authData.user,
    });

    if (!profileResult.success) {
      return apiError(
        {
          code: "CUSTOMER_PROFILE_UNAVAILABLE",
          message: profileResult.message,
        },
        503,
      );
    }

    return apiSuccess(
      {
        ...profileResult.user,
        verification: authData.session
          ? "session-active"
          : "email-confirmation-required",
      },
      { status: 201 },
    );
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: parsedBody.data.email,
      password: parsedBody.data.password,
    });

  if (authError || !authData.user) {
    return apiError(
      { code: "UNAUTHORIZED", message: "Invalid email or password" },
      401,
    );
  }

  const profileResult = await ensureCustomerProfileForAuthUser({
    user: authData.user,
  });

  if (!profileResult.success) {
    await supabase.auth.signOut();
    return apiError(
      {
        code: "CUSTOMER_PROFILE_UNAVAILABLE",
        message: profileResult.message,
      },
      503,
    );
  }

  return apiSuccess({
    ...profileResult.user,
    verification: profileResult.user.emailVerified
      ? "email-verified"
      : "email-unverified",
  });
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return apiError(
      {
        code: "SIGN_OUT_FAILED",
        message: "Customer session could not be cleared",
      },
      500,
    );
  }

  return apiSuccess({ signedOut: true });
}
