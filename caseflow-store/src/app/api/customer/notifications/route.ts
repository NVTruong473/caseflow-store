import { apiError, apiSuccess } from "@/lib/api/response";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { isCustomerSmsVerificationAvailable } from "@/lib/notifications/phone-verification";
import {
  listCustomerNotifications,
  markCustomerNotificationsRead,
} from "@/lib/repositories/supabase-notifications";
import { markCustomerNotificationsReadSchema } from "@/lib/validation/notifications";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.success) return auth.response;

  try {
    const items = await listCustomerNotifications(auth.customerId);
    return apiSuccess({
      items,
      smsVerificationAvailable: isCustomerSmsVerificationAvailable(),
      unreadCount: items.filter((item) => item.readAt === null).length,
    });
  } catch {
    return apiError(
      { code: "NOTIFICATION_READ_FAILED", message: "Notifications could not be read" },
      503,
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireCustomer();
  if (!auth.success) return auth.response;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const parsed = markCustomerNotificationsReadSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid notification read request" },
      400,
    );
  }

  try {
    const changed = await markCustomerNotificationsRead({
      customerId: auth.customerId,
      notificationIds: parsed.data.notificationIds,
    });
    return apiSuccess({ changed });
  } catch {
    return apiError(
      { code: "NOTIFICATION_WRITE_FAILED", message: "Notifications could not be updated" },
      503,
    );
  }
}

async function requireCustomer() {
  const authState = await getCustomerAuthState();

  if (authState.status === "anonymous") {
    return {
      response: apiError(
        { code: "UNAUTHORIZED", message: "Customer authentication required" },
        401,
      ),
      success: false as const,
    };
  }

  if (authState.status === "error") {
    return {
      response: apiError(
        { code: "CUSTOMER_PROFILE_UNAVAILABLE", message: authState.message },
        503,
      ),
      success: false as const,
    };
  }

  if (authState.user.role !== "customer") {
    return {
      response: apiError({ code: "FORBIDDEN", message: "Customer role required" }, 403),
      success: false as const,
    };
  }

  return { customerId: authState.user.id, success: true as const };
}
