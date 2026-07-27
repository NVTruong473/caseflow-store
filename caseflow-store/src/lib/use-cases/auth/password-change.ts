import { getCustomerAuthState } from "@/lib/auth/customer";
import {
  createIsolatedSupabaseAuthClient,
  verifyOperationsPasswordSecret,
} from "@/lib/auth/password-assurance";
import { absoluteUrl } from "@/lib/seo/metadata";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { operationsPasswordChangeRequestSchema } from "@/lib/validation/auth";
import {
  createUseCaseFailure,
  type UseCaseResult,
} from "@/lib/use-cases/result";

type PasswordUpdateResult = {
  passwordUpdated: true;
  signedOut: boolean;
};

export async function requestCustomerPasswordRecoveryUseCase(): Promise<
  UseCaseResult<{ recoveryRequested: true; deliveryAddress: string }>
> {
  const auth = await getCustomerAuthState();

  if (auth.status !== "authenticated") {
    return createUseCaseFailure(
      auth.status === "error" ? "CUSTOMER_PROFILE_UNAVAILABLE" : "UNAUTHORIZED",
      auth.status === "error"
        ? auth.message
        : "Account authentication required",
      auth.status === "error" ? 503 : 401,
    );
  }

  if (auth.user.role !== "customer") {
    return createUseCaseFailure("FORBIDDEN", "Customer role required", 403);
  }

  const isolatedAuth = createIsolatedSupabaseAuthClient();
  const { error } = await isolatedAuth.auth.resetPasswordForEmail(
    auth.user.email,
    {
      redirectTo: absoluteUrl("/account/password-reset"),
    },
  );

  if (error) {
    if (error.status === 429) {
      return createUseCaseFailure(
        "PASSWORD_RECOVERY_RATE_LIMITED",
        "Please wait before requesting another password reset email",
        429,
      );
    }

    return createUseCaseFailure(
      "PASSWORD_RECOVERY_DELIVERY_FAILED",
      "Password reset email could not be sent",
      503,
    );
  }

  return {
    data: {
      recoveryRequested: true,
      deliveryAddress: maskEmail(auth.user.email),
    },
    success: true,
  };
}

export async function changePasswordWithRoleAssuranceUseCase(
  body: unknown,
): Promise<UseCaseResult<PasswordUpdateResult>> {
  const auth = await getCustomerAuthState();

  if (auth.status !== "authenticated") {
    return createUseCaseFailure(
      auth.status === "error" ? "CUSTOMER_PROFILE_UNAVAILABLE" : "UNAUTHORIZED",
      auth.status === "error"
        ? auth.message
        : "Account authentication required",
      auth.status === "error" ? 503 : 401,
    );
  }

  if (auth.user.role === "customer") {
    return createUseCaseFailure(
      "PASSWORD_ASSURANCE_FAILED",
      "Customer passwords can only be changed from the secure email link",
      403,
    );
  }

  if (auth.user.role === "admin" || auth.user.role === "staff") {
    return changeOperationsPassword({
      body,
      email: auth.user.email,
      userId: auth.user.id,
    });
  }

  return createUseCaseFailure("FORBIDDEN", "Unsupported account role", 403);
}

async function changeOperationsPassword(input: {
  body: unknown;
  email: string;
  userId: string;
}): Promise<UseCaseResult<PasswordUpdateResult>> {
  const parsed = operationsPasswordChangeRequestSchema.safeParse(input.body);

  if (!parsed.success) {
    return createUseCaseFailure(
      "VALIDATION_ERROR",
      "Invalid operations password change payload",
      400,
    );
  }

  let secretValid = false;
  try {
    secretValid = verifyOperationsPasswordSecret(
      parsed.data.operationsSecret,
    );
  } catch {
    return createUseCaseFailure(
      "PASSWORD_UPDATE_FAILED",
      "Password assurance is not configured",
      503,
    );
  }

  const isolatedAuth = createIsolatedSupabaseAuthClient();
  const { data, error } = await isolatedAuth.auth.signInWithPassword({
    email: input.email,
    password: parsed.data.currentPassword,
  });

  if (error || data.user?.id !== input.userId || !secretValid) {
    return createUseCaseFailure(
      "PASSWORD_ASSURANCE_FAILED",
      "Current password or operations verification key is incorrect",
      401,
    );
  }

  return updatePasswordAndSignOut({
    newPassword: parsed.data.newPassword,
    userId: input.userId,
  });
}

async function updatePasswordAndSignOut(input: {
  newPassword: string;
  userId: string;
}): Promise<UseCaseResult<PasswordUpdateResult>> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(input.userId, {
    password: input.newPassword,
  });

  if (error) {
    return createUseCaseFailure(
      "PASSWORD_UPDATE_FAILED",
      "Password could not be changed",
      503,
    );
  }

  const serverAuth = await createSupabaseServerClient();

  return signOutAfterPasswordChange(serverAuth);
}

async function signOutAfterPasswordChange(
  serverAuth: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<UseCaseResult<PasswordUpdateResult>> {
  const globalSignOut = await serverAuth.auth.signOut({ scope: "global" });
  let signedOut = globalSignOut.error === null;

  if (globalSignOut.error) {
    const localSignOut = await serverAuth.auth.signOut({ scope: "local" });
    signedOut = localSignOut.error === null;
  }

  return {
    data: {
      passwordUpdated: true,
      signedOut,
    },
    success: true,
  };
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "***";
  }

  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"*".repeat(Math.max(2, localPart.length - visible.length))}@${domain}`;
}
