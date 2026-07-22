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
import {
  createSupabaseBookOrder,
  type SupabaseOrderRecord,
} from "@/lib/repositories/supabase-orders";
import { evaluateSupabaseBookPromotion } from "@/lib/repositories/supabase-promotions";
import {
  type UseCaseResult,
  createUseCaseFailure,
} from "@/lib/use-cases/result";
import type { CreateBookOrderRequest } from "@/lib/validation/orders";

type ReservedSignupVoucher = {
  customerId: string;
  reservationToken: string;
};

export async function createBookOrderUseCase(
  request: CreateBookOrderRequest,
): Promise<UseCaseResult<SupabaseOrderRecord>> {
  let reservedSignupVoucher: ReservedSignupVoucher | null = null;

  try {
    const customerAuthState = await getCustomerAuthState();

    if (customerAuthState.status === "anonymous") {
      return createUseCaseFailure(
        "UNAUTHORIZED",
        "Customer login is required before checkout",
        401,
      );
    }

    if (customerAuthState.status === "error") {
      return createUseCaseFailure(
        "CUSTOMER_PROFILE_UNAVAILABLE",
        customerAuthState.message,
        503,
      );
    }

    if (customerAuthState.user.role !== "customer") {
      return createUseCaseFailure(
        "FORBIDDEN",
        "Customer role is required before checkout",
        403,
      );
    }

    if (!customerAuthState.user.profileCompleteness.isCompleteForCheckout) {
      return createUseCaseFailure(
        "VALIDATION_ERROR",
        "Customer profile is incomplete for checkout",
        400,
      );
    }

    const customerName =
      customerAuthState.user.fullName ?? customerAuthState.user.displayName;
    const customerEmail = customerAuthState.user.email;
    const customerPhone = customerAuthState.user.phone;

    if (
      request.customerName !== customerName ||
      request.customerEmail !== customerEmail ||
      request.customerPhone !== customerPhone ||
      !customerPhone
    ) {
      return createUseCaseFailure(
        "VALIDATION_ERROR",
        "Customer contact confirmation does not match account",
        400,
      );
    }

    const cartValidation = await validateSupabaseBookCart(request.items);

    if (!cartValidation.success) {
      return createUseCaseFailure(
        cartValidation.error.code,
        cartValidation.error.message,
        cartValidation.error.status,
      );
    }

    const language = await getRequestLanguage();
    const currencyRules = getCurrencyDisplayRules();
    const promotionEvaluation = request.promotionCode
      ? await evaluateSupabaseBookPromotion({
          code: request.promotionCode,
          customerId: customerAuthState.user.id,
          subtotalVnd: cartValidation.data.subtotal,
        })
      : null;

    if (promotionEvaluation && !promotionEvaluation.success) {
      return createUseCaseFailure(
        promotionEvaluation.code,
        promotionEvaluation.message,
        400,
      );
    }

    if (
      promotionEvaluation?.success &&
      promotionEvaluation.isCustomerSignupVoucher
    ) {
      const code = promotionEvaluation.promotion.code;

      if (!isSignupVoucherCode(code)) {
        return createUseCaseFailure(
          "PROMOTION_INVALID",
          "Invalid account voucher configuration",
          400,
        );
      }

      const reservation = await reserveCustomerSignupVoucher({
        code,
        customerId: customerAuthState.user.id,
      });

      if (!reservation.success) {
        return createUseCaseFailure(
          reservation.code,
          reservation.message,
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
      paymentMethod: request.paymentMethod,
      shippingMethod: request.shippingMethod,
      subtotalVnd: cartValidation.data.subtotal,
    });

    const data = await createSupabaseBookOrder({
      customerId: customerAuthState.user.id,
      customerName,
      customerEmail,
      customerPhone,
      items: cartValidation.data.items.map((line) => ({
        editionId: line.editionId,
        quantity: line.quantity,
      })),
      paymentMethod: request.paymentMethod,
      promotionCode: promotionEvaluation?.promotion.code ?? null,
      shippingAddress: request.shippingAddress,
      shippingMethod: request.shippingMethod,
      totals,
    });

    if (reservedSignupVoucher) {
      await confirmCustomerSignupVoucherReservation({
        customerId: reservedSignupVoucher.customerId,
        orderId: data.order.id,
        reservationToken: reservedSignupVoucher.reservationToken,
      });
      reservedSignupVoucher = null;
    }

    return {
      data,
      success: true,
    };
  } catch {
    if (reservedSignupVoucher) {
      try {
        await releaseCustomerSignupVoucherReservation(reservedSignupVoucher);
      } catch {
        // A failed order must not intentionally burn a customer signup voucher.
      }
    }

    return createUseCaseFailure(
      "ORDER_CREATE_FAILED",
      "Order could not be created",
      500,
    );
  }
}
