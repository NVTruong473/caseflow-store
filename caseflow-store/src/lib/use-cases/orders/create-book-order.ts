import { getCustomerAuthState } from "@/lib/auth/customer";
import { calculateBookCheckoutTotals } from "@/lib/checkout/book-totals";
import { getCurrencyDisplayRules } from "@/lib/format/currency-display.server";
import { getRequestLanguage } from "@/lib/i18n/server";
import { validateSupabaseBookCart } from "@/lib/repositories/supabase-books";
import { isSignupVoucherCode } from "@/lib/repositories/supabase-customer-vouchers";
import {
  createSupabaseBookOrder,
  getSupabaseOrderForCheckoutAttempt,
  SignupVoucherConsumptionError,
  type SupabaseOrderRecord,
} from "@/lib/repositories/supabase-orders";
import { evaluateSupabaseBookPromotion } from "@/lib/repositories/supabase-promotions";
import {
  type UseCaseResult,
  createUseCaseFailure,
} from "@/lib/use-cases/result";
import type { CreateBookOrderRequest } from "@/lib/validation/orders";

export async function createBookOrderUseCase(
  request: CreateBookOrderRequest,
): Promise<UseCaseResult<SupabaseOrderRecord>> {
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

    const existingOrder = await getSupabaseOrderForCheckoutAttempt(
      customerAuthState.user.id,
      request.checkoutAttemptId,
    );

    if (existingOrder) {
      return {
        data: existingOrder,
        success: true,
      };
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
      // Một request cùng attempt ID có thể vừa commit giữa lần đọc đầu tiên và
      // lúc kiểm tra voucher. Trả lại order đó thay vì báo voucher đã dùng.
      const concurrentlyCreatedOrder =
        await getSupabaseOrderForCheckoutAttempt(
          customerAuthState.user.id,
          request.checkoutAttemptId,
        );

      if (concurrentlyCreatedOrder) {
        return {
          data: concurrentlyCreatedOrder,
          success: true,
        };
      }

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
      checkoutAttemptId: request.checkoutAttemptId,
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

    return {
      data,
      success: true,
    };
  } catch (error) {
    if (error instanceof SignupVoucherConsumptionError) {
      return createUseCaseFailure(
        "PROMOTION_INVALID",
        "This account voucher is expired, reserved, or already used.",
        400,
      );
    }

    return createUseCaseFailure(
      "ORDER_CREATE_FAILED",
      "Order could not be created",
      500,
    );
  }
}
