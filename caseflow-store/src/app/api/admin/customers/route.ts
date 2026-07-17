import { z } from "zod";

import { toAdminCustomerApiItem } from "@/lib/api/admin-customers";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import { listSupabaseAdminCustomers } from "@/lib/repositories/supabase-customers";

const adminCustomerListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
});

export async function GET(request: Request) {
  const adminAuth = await requireAdminPermission("orders:read");

  if (!adminAuth.authorized) {
    return apiError(
      {
        code: adminAuth.code,
        message: adminAuth.message,
      },
      adminAuth.status,
    );
  }

  const url = new URL(request.url);
  const parsedQuery = adminCustomerListQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
  });

  if (!parsedQuery.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid customer search query",
      },
      400,
    );
  }

  try {
    const customers = await listSupabaseAdminCustomers(parsedQuery.data.q);

    return apiSuccess(customers.map(toAdminCustomerApiItem), {
      meta: {
        completeCount: customers.filter(
          (customer) => customer.profileCompleteness.isCompleteForCheckout,
        ).length,
        count: customers.length,
        resource: "admin-customers",
      },
    });
  } catch {
    return apiError(
      {
        code: "CUSTOMER_READ_FAILED",
        message: "Customers could not be loaded",
      },
      500,
    );
  }
}
