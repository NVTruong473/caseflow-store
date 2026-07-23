import { storefrontConfig } from "@/config/storefront";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export type AdminWorkspaceRole = Extract<UserRole, "admin" | "staff">;
export type AdminPermission =
  | "catalog:manage"
  | "inventory:adjust"
  | "merchandising:manage"
  | "orders:read"
  | "orders:update-status"
  | "notifications:read"
  | "notifications:retry"
  | "notifications:manage-config"
  | "promotions:manage"
  | "settings:manage";

export type AdminIdentity = {
  id: string;
  email: string;
  displayName: string;
  permissions: AdminPermission[];
  role: AdminWorkspaceRole;
};

export type AdminAuthResult =
  | { authorized: true; user: AdminIdentity }
  | {
      authorized: false;
      status: 401 | 403 | 503;
      code: "UNAUTHORIZED" | "FORBIDDEN" | "ADMIN_AUTH_UNAVAILABLE";
      message: string;
    };

const permissionsByRole: Record<AdminWorkspaceRole, AdminPermission[]> = {
  admin: [
    "catalog:manage",
    "inventory:adjust",
    "merchandising:manage",
    "orders:read",
    "orders:update-status",
    "notifications:read",
    "notifications:retry",
    "notifications:manage-config",
    "promotions:manage",
    "settings:manage",
  ],
  staff: [
    "catalog:manage",
    "inventory:adjust",
    "merchandising:manage",
    "orders:read",
    "orders:update-status",
    "notifications:read",
    "notifications:retry",
  ],
};

export async function requireAdminRequest(): Promise<AdminAuthResult> {
  return requireAdminPermission("settings:manage");
}

export async function requireAdminPermission(
  permission: AdminPermission,
): Promise<AdminAuthResult> {
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
      message: "Operations authentication required",
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

  if (!profile || !isAdminWorkspaceRole(profile.role)) {
    return {
      authorized: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Admin or staff role required",
    };
  }

  const permissions = permissionsByRole[profile.role];

  if (!permissions.includes(permission)) {
    return {
      authorized: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Role is not allowed to perform this operation",
    };
  }

  return {
    authorized: true,
    user: {
      id: user.id,
      email: user.email ?? "",
      displayName:
        profile.display_name?.trim() || getAdminRoleFallbackName(profile.role),
      permissions,
      role: profile.role,
    },
  };
}

export function isAdminWorkspaceRole(
  role: UserRole | null | undefined,
): role is AdminWorkspaceRole {
  return role === "admin" || role === "staff";
}

export function getAdminPermissions(role: AdminWorkspaceRole) {
  return permissionsByRole[role];
}

export function getAdminRoleFallbackName(role: AdminWorkspaceRole) {
  return role === "admin"
    ? `${storefrontConfig.name} Admin`
    : `${storefrontConfig.name} Staff`;
}
