import { apiError, apiSuccess } from "@/lib/api/response";
import { ensureCustomerProfileForAuthUser } from "@/lib/auth/customer";
import { ensureCustomerSignupVouchers } from "@/lib/repositories/supabase-customer-vouchers";
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
    const redirectUrl = getCustomerEmailRedirectUrl(request);
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

    try {
      await ensureCustomerSignupVouchers(profileResult.user.id);
    } catch {
      return apiError(
        {
          code: "PROMOTION_WRITE_FAILED",
          message: "Customer account was created but welcome vouchers could not be issued",
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

function getCustomerEmailRedirectUrl(request: Request) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const publicOrigin =
    getValidOrigin(configuredSiteUrl) ?? getForwardedRequestOrigin(request);

  return new URL("/account", publicOrigin).toString();
}

function getForwardedRequestOrigin(request: Request) {
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost ?? firstHeaderValue(request.headers.get("host"));
  const forwardedProto =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ?? "https";
  const forwardedOrigin = host
    ? getValidOrigin(`${forwardedProto}://${host}`)
    : null;

  // Không dùng `request.url` làm nguồn duy nhất: trong serverless/proxy nó có
  // thể là localhost và làm email xác nhận trỏ về máy nội bộ thay vì domain public.
  return forwardedOrigin ?? new URL(request.url).origin;
}

function firstHeaderValue(value: string | null) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .find(Boolean);
}

function getValidOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}
