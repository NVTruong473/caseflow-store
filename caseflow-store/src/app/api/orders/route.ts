import { apiError, apiSuccess } from "@/lib/api/response";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { calculateBookCheckoutTotals } from "@/lib/checkout/book-totals";
import { getCurrencyDisplayRules } from "@/lib/format/currency-display.server";
import { getRequestLanguage } from "@/lib/i18n/server";
import { validateSupabaseBookCart } from "@/lib/repositories/supabase-books";
import {
  confirmCustomerSignupVoucherReservation,
  isSignupVoucherCode,
  releaseCustomerSignupVoucherReservation,
  reserveCustomerSignupVoucher,
} from "@/lib/repositories/supabase-customer-vouchers";
import { createSupabaseBookOrder } from "@/lib/repositories/supabase-orders";
import { evaluateSupabaseBookPromotion } from "@/lib/repositories/supabase-promotions";
import { createBookOrderRequestSchema } from "@/lib/validation/orders";

export async function POST(request: Request) {
  let body: unknown;
  let reservedSignupVoucher: {
    customerId: string;
    reservationToken: string;
  } | null = null;

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

  const parsedBody = createBookOrderRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid order payload",
      },
      400,
    );
  }

  try {
    const customerAuthState = await getCustomerAuthState();

    if (customerAuthState.status === "anonymous") {
      return apiError(
        {
          code: "UNAUTHORIZED",
          message: "Customer login is required before checkout",
        },
        401,
      );
    }

    if (customerAuthState.status === "error") {
      return apiError(
        {
          code: "CUSTOMER_PROFILE_UNAVAILABLE",
          message: customerAuthState.message,
        },
        503,
      );
    }

    if (customerAuthState.user.role !== "customer") {
      return apiError(
        {
          code: "FORBIDDEN",
          message: "Customer role is required before checkout",
        },
        403,
      );
    }

    if (!customerAuthState.user.profileCompleteness.isCompleteForCheckout) {
      return apiError(
        {
          code: "VALIDATION_ERROR",
          message: "Customer profile is incomplete for checkout",
        },
        400,
      );
    }

    const customerName =
      customerAuthState.user.fullName ?? customerAuthState.user.displayName;
    const customerEmail = customerAuthState.user.email;
    const customerPhone = customerAuthState.user.phone;

    if (
      parsedBody.data.customerName !== customerName ||
      parsedBody.data.customerEmail !== customerEmail ||
      parsedBody.data.customerPhone !== customerPhone ||
      !customerPhone
    ) {
      return apiError(
        {
          code: "VALIDATION_ERROR",
          message: "Customer contact confirmation does not match account",
        },
        400,
      );
    }

    const cartValidation = await validateSupabaseBookCart(
      parsedBody.data.items,
    );

    if (!cartValidation.success) {
      return apiError(
        {
          code: cartValidation.error.code,
          message: cartValidation.error.message,
        },
        cartValidation.error.status,
      );
    }

    const language = await getRequestLanguage();
    const currencyRules = getCurrencyDisplayRules();
    const promotionCode = parsedBody.data.promotionCode;
    const promotionEvaluation = promotionCode
      ? await evaluateSupabaseBookPromotion({
          code: promotionCode,
          customerId: customerAuthState.user.id,
          subtotalVnd: cartValidation.data.subtotal,
        })
      : null;

    if (promotionEvaluation && !promotionEvaluation.success) {
      return apiError(
        {
          code: promotionEvaluation.code,
          message: promotionEvaluation.message,
        },
        400,
      );
    }

    if (
      promotionEvaluation?.success &&
      promotionEvaluation.isCustomerSignupVoucher
    ) {
      const code = promotionEvaluation.promotion.code;

      if (!isSignupVoucherCode(code)) {
        return apiError(
          {
            code: "PROMOTION_INVALID",
            message: "Invalid account voucher configuration",
          },
          400,
        );
      }

      const reservation = await reserveCustomerSignupVoucher({
        code,
        customerId: customerAuthState.user.id,
      });

      if (!reservation.success) {
        return apiError(
          {
            code: reservation.code,
            message: reservation.message,
          },
          400,
        );
      }

      reservedSignupVoucher = {
        customerId: customerAuthState.user.id,
        reservationToken: reservation.reservationToken,
      };
    }

    const totals = calculateBookCheckoutTotals({
      currencyRules,
      discountTotalVnd: promotionEvaluation?.discountTotalVnd ?? 0,
      includeDisplayEstimate: language === "en",
      paymentMethod: parsedBody.data.paymentMethod,
      shippingMethod: parsedBody.data.shippingMethod,
      subtotalVnd: cartValidation.data.subtotal,
    });

    const result = await createSupabaseBookOrder({
      customerId: customerAuthState.user.id,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod: parsedBody.data.paymentMethod,
      promotionCode: promotionEvaluation?.promotion.code ?? null,
      shippingAddress: parsedBody.data.shippingAddress,
      shippingMethod: parsedBody.data.shippingMethod,
      totals,
      items: cartValidation.data.items.map((line) => ({
        editionId: line.editionId,
        quantity: line.quantity,
      })),
    });

    if (reservedSignupVoucher) {
      await confirmCustomerSignupVoucherReservation({
        customerId: reservedSignupVoucher.customerId,
        orderId: result.order.id,
        reservationToken: reservedSignupVoucher.reservationToken,
      });
      reservedSignupVoucher = null;
    }

    return apiSuccess(result, { status: 201 });
  } catch {
    if (reservedSignupVoucher) {
      try {
        await releaseCustomerSignupVoucherReservation(reservedSignupVoucher);
      } catch {
        // A failed order must not intentionally burn a customer signup voucher.
      }
    }

    return apiError(
      {
        code: "ORDER_CREATE_FAILED",
        message: "Order could not be created",
      },
      500,
    );
  }
}
