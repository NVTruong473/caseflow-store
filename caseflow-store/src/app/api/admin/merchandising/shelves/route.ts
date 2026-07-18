import { toAdminMerchandisingShelfApiItems } from "@/lib/api/admin-merchandising";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import { listSupabaseAdminBookCatalog } from "@/lib/repositories/supabase-books";
import {
  listSupabaseMerchandisingShelves,
  resolveSupabaseMerchandisingShelves,
  updateSupabaseAdminMerchandisingShelf,
} from "@/lib/repositories/supabase-merchandising";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { adminMerchandisingShelfUpdateSchema } from "@/lib/validation/merchandising";

export async function GET() {
  const adminAuth = await requireAdminPermission("merchandising:manage");

  if (!adminAuth.authorized) {
    return apiError(
      {
        code: adminAuth.code,
        message: adminAuth.message,
      },
      adminAuth.status,
    );
  }

  try {
    const data = await readAdminMerchandisingShelves();

    return apiSuccess(data, {
      meta: {
        count: data.length,
        resource: "admin-merchandising-shelves",
      },
    });
  } catch {
    return apiError(
      {
        code: "MERCHANDISING_READ_FAILED",
        message: "Merchandising shelves could not be loaded",
      },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const adminAuth = await requireAdminPermission("merchandising:manage");

  if (!adminAuth.authorized) {
    return apiError(
      {
        code: adminAuth.code,
        message: adminAuth.message,
      },
      adminAuth.status,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body",
      },
      400,
    );
  }

  const parsedBody = adminMerchandisingShelfUpdateSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid merchandising shelf update payload",
      },
      400,
    );
  }

  try {
    const updateInput = {
      ...(parsedBody.data.isActive !== undefined
        ? { isActive: parsedBody.data.isActive }
        : {}),
      ...(parsedBody.data.sortOrder !== undefined
        ? { sortOrder: parsedBody.data.sortOrder }
        : {}),
    };
    const shelf = await updateSupabaseAdminMerchandisingShelf(
      parsedBody.data.shelfId,
      updateInput,
    );

    if (!shelf) {
      return apiError(
        {
          code: "MERCHANDISING_SHELF_NOT_FOUND",
          message: "Merchandising shelf not found",
        },
        404,
      );
    }

    const data = await readAdminMerchandisingShelves();

    return apiSuccess(data, {
      meta: {
        count: data.length,
        resource: "admin-merchandising-shelves",
      },
    });
  } catch {
    return apiError(
      {
        code: "MERCHANDISING_WRITE_FAILED",
        message: "Merchandising shelf could not be updated",
      },
      500,
    );
  }
}

async function readAdminMerchandisingShelves() {
  const records = await listSupabaseAdminBookCatalog({ sort: "title-asc" });
  const shelves = await listSupabaseMerchandisingShelves({
    client: createSupabaseAdminClient(),
  });
  const resolvedShelves = resolveSupabaseMerchandisingShelves(records, shelves);

  return toAdminMerchandisingShelfApiItems(resolvedShelves);
}
