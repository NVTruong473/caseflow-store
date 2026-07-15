import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminIdentity = {
  id: string;
  email: string;
  displayName: string;
};

type AdminAuthResult =
  | { authorized: true; user: AdminIdentity }
  | {
      authorized: false;
      status: 401 | 403 | 503;
      code: "UNAUTHORIZED" | "FORBIDDEN" | "ADMIN_AUTH_UNAVAILABLE";
      message: string;
    };

export async function requireAdminRequest(): Promise<AdminAuthResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      authorized: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Admin authentication required",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      authorized: false,
      status: 503,
      code: "ADMIN_AUTH_UNAVAILABLE",
      message: "Admin authorization is temporarily unavailable",
    };
  }

  if (!profile || profile.role !== "admin") {
    return {
      authorized: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Admin role required",
    };
  }

  return {
    authorized: true,
    user: {
      id: user.id,
      email: user.email ?? "",
      displayName: profile.display_name?.trim() || "CaseFlow Admin",
    },
  };
}
