import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";

export async function GET() {
  const adminAuth = await requireAdminPermission("settings:manage");

  if (!adminAuth.authorized) {
    return apiError(
      {
        code: adminAuth.code,
        message: adminAuth.message,
      },
      adminAuth.status,
    );
  }

  return apiSuccess(
    {
      permissions: adminAuth.user.permissions,
      resource: "admin-settings",
      role: adminAuth.user.role,
    },
    {
      meta: {
        resource: "admin-settings",
      },
    },
  );
}
