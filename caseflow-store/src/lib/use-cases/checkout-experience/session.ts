import { randomUUID } from "node:crypto";

import { getCustomerAuthState } from "@/lib/auth/customer";
import { calculateBookCheckoutTotals } from "@/lib/checkout/book-totals";
import { getCheckoutExperienceConfig } from "@/lib/checkout-experience/config";
import {
  createCheckoutExperienceCartFingerprint,
  deriveCheckoutExperienceCredentials,
  hashCheckoutExperienceConfirmationCode,
  hashCheckoutExperienceToken,
} from "@/lib/checkout-experience/crypto";
import { getCurrencyDisplayRules } from "@/lib/format/currency-display.server";
import {
  cancelCheckoutExperienceForCustomer,
  completeCheckoutExperience,
  createOrRecoverCheckoutExperience,
  getCheckoutExperienceByTokenHash,
  type CheckoutExperienceRow,
} from "@/lib/repositories/supabase-checkout-experience";
import { validateSupabaseBookCart } from "@/lib/repositories/supabase-books";
import {
  createUseCaseFailure,
  type UseCaseResult,
} from "@/lib/use-cases/result";
import type {
  CheckoutExperienceCreatedSession,
  CheckoutExperienceSession,
} from "@/types/checkout-experience";
import type {
  CheckoutExperienceCompleteRequest,
  CheckoutExperienceCreateRequest,
} from "@/lib/validation/checkout-experience";

export async function createCheckoutExperienceUseCase(input: {
  origin: string;
  request: CheckoutExperienceCreateRequest;
}): Promise<UseCaseResult<CheckoutExperienceCreatedSession>> {
  const auth = await getCustomerAuthState();

  if (auth.status === "anonymous") {
    return createUseCaseFailure(
      "UNAUTHORIZED",
      "Customer authentication required",
      401,
    );
  }

  if (auth.status === "error") {
    return createUseCaseFailure(
      "CUSTOMER_PROFILE_UNAVAILABLE",
      auth.message,
      503,
    );
  }

  if (auth.user.role !== "customer") {
    return createUseCaseFailure("FORBIDDEN", "Customer role required", 403);
  }

  try {
    const cart = await validateSupabaseBookCart(input.request.items);

    if (!cart.success) {
      return createUseCaseFailure(
        cart.error.code,
        cart.error.message,
        cart.error.status,
      );
    }

    if (cart.data.items.length === 0 || cart.data.subtotal <= 0) {
      return createUseCaseFailure(
        "VALIDATION_ERROR",
        "A non-empty cart is required",
        400,
      );
    }

    const config = getCheckoutExperienceConfig();
    const credentials = deriveCheckoutExperienceCredentials({
      clientRequestId: input.request.clientRequestId,
      customerId: auth.user.id,
      secret: config.tokenSecret,
    });
    const totals = calculateBookCheckoutTotals({
      currencyRules: getCurrencyDisplayRules(),
      paymentMethod: "bank-transfer",
      shippingMethod: "standard",
      subtotalVnd: cart.data.subtotal,
    });
    const createdAt = new Date();
    const expiresAt = new Date(
      createdAt.getTime() + config.durationMinutes * 60_000,
    );
    const transferContent = createTransferContent(
      input.request.clientRequestId,
    );
    const record = await createOrRecoverCheckoutExperience({
      amount_vnd: totals.totalVnd,
      cart_fingerprint: createCheckoutExperienceCartFingerprint(
        input.request.items,
      ),
      client_request_id: input.request.clientRequestId,
      confirmation_code_hash: credentials.confirmationCodeHash,
      confirmation_code_salt: credentials.confirmationCodeSalt,
      currency: "VND",
      customer_id: auth.user.id,
      expires_at: expiresAt.toISOString(),
      failed_attempts: 0,
      id: randomUUID(),
      status: "pending",
      token_hash: credentials.tokenHash,
      transfer_content: transferContent,
    });
    const scanUrl = createScanUrl(input.origin, credentials.accessToken);

    return {
      data: {
        ...mapCheckoutExperienceSession(record, config),
        accessToken: credentials.accessToken,
        clientRequestId: input.request.clientRequestId,
        confirmationCode: credentials.confirmationCode,
        scanUrl,
      },
      success: true,
    };
  } catch {
    return createUseCaseFailure(
      "CHECKOUT_EXPERIENCE_UNAVAILABLE",
      "Checkout experience could not be created",
      503,
    );
  }
}

export async function getCheckoutExperienceUseCase(
  token: string,
): Promise<UseCaseResult<CheckoutExperienceSession>> {
  try {
    const record = await getCheckoutExperienceByTokenHash(
      hashCheckoutExperienceToken(token),
    );

    if (!record) {
      return createUseCaseFailure(
        "CHECKOUT_EXPERIENCE_NOT_FOUND",
        "Checkout experience session not found",
        404,
      );
    }

    return {
      data: mapCheckoutExperienceSession(
        record,
        getCheckoutExperienceConfig(),
      ),
      success: true,
    };
  } catch {
    return createUseCaseFailure(
      "CHECKOUT_EXPERIENCE_UNAVAILABLE",
      "Checkout experience status is unavailable",
      503,
    );
  }
}

export async function completeCheckoutExperienceUseCase(
  request: CheckoutExperienceCompleteRequest,
): Promise<UseCaseResult<CheckoutExperienceSession>> {
  try {
    const tokenHash = hashCheckoutExperienceToken(request.token);
    const current = await getCheckoutExperienceByTokenHash(tokenHash);

    if (!current) {
      return createUseCaseFailure(
        "CHECKOUT_EXPERIENCE_NOT_FOUND",
        "Checkout experience session not found",
        404,
      );
    }

    const result = await completeCheckoutExperience({
      amountVnd: request.amountVnd,
      confirmationCodeHash: hashCheckoutExperienceConfirmationCode({
        code: request.confirmationCode,
        salt: current.confirmation_code_salt,
      }),
      tokenHash,
    });

    if (result.result === "invalid_confirmation") {
      return createUseCaseFailure(
        "CHECKOUT_EXPERIENCE_CONFIRMATION_INVALID",
        "Amount or confirmation code is incorrect",
        400,
      );
    }

    if (result.result === "locked") {
      return createUseCaseFailure(
        "CHECKOUT_EXPERIENCE_LOCKED",
        "Checkout experience session is locked",
        423,
      );
    }

    if (result.result === "expired") {
      return createUseCaseFailure(
        "CHECKOUT_EXPERIENCE_EXPIRED",
        "Checkout experience session has expired",
        410,
      );
    }

    if (result.result === "not_found") {
      return createUseCaseFailure(
        "CHECKOUT_EXPERIENCE_NOT_FOUND",
        "Checkout experience session not found",
        404,
      );
    }

    if (result.result === "invalid_state") {
      return createUseCaseFailure(
        "CHECKOUT_EXPERIENCE_INVALID_STATE",
        "Checkout experience cannot be completed in its current state",
        409,
      );
    }

    const updated = await getCheckoutExperienceByTokenHash(tokenHash);

    if (!updated) {
      return createUseCaseFailure(
        "CHECKOUT_EXPERIENCE_NOT_FOUND",
        "Checkout experience session not found",
        404,
      );
    }

    return {
      data: mapCheckoutExperienceSession(
        updated,
        getCheckoutExperienceConfig(),
      ),
      success: true,
    };
  } catch {
    return createUseCaseFailure(
      "CHECKOUT_EXPERIENCE_UNAVAILABLE",
      "Checkout experience could not be completed",
      503,
    );
  }
}

export async function cancelCheckoutExperienceUseCase(
  token: string,
): Promise<UseCaseResult<CheckoutExperienceSession>> {
  const auth = await getCustomerAuthState();

  if (auth.status === "anonymous") {
    return createUseCaseFailure(
      "UNAUTHORIZED",
      "Customer authentication required",
      401,
    );
  }

  if (auth.status === "error") {
    return createUseCaseFailure(
      "CUSTOMER_PROFILE_UNAVAILABLE",
      auth.message,
      503,
    );
  }

  if (auth.user.role !== "customer") {
    return createUseCaseFailure("FORBIDDEN", "Customer role required", 403);
  }

  try {
    const record = await cancelCheckoutExperienceForCustomer({
      customerId: auth.user.id,
      tokenHash: hashCheckoutExperienceToken(token),
    });

    if (!record || record.customer_id !== auth.user.id) {
      return createUseCaseFailure(
        "CHECKOUT_EXPERIENCE_NOT_FOUND",
        "Checkout experience session not found",
        404,
      );
    }

    return {
      data: mapCheckoutExperienceSession(
        record,
        getCheckoutExperienceConfig(),
      ),
      success: true,
    };
  } catch {
    return createUseCaseFailure(
      "CHECKOUT_EXPERIENCE_UNAVAILABLE",
      "Checkout experience could not be cancelled",
      503,
    );
  }
}

function mapCheckoutExperienceSession(
  record: CheckoutExperienceRow,
  config: ReturnType<typeof getCheckoutExperienceConfig>,
): CheckoutExperienceSession {
  return {
    amountVnd: record.amount_vnd,
    completedAt: record.completed_at,
    currency: record.currency,
    expiresAt: record.expires_at,
    failedAttemptsRemaining: Math.max(0, 5 - record.failed_attempts),
    merchant: {
      accountName: config.accountName,
      accountNumber: config.accountNumber,
      bankName: config.bankName,
      name: config.merchantName,
    },
    serverTime: new Date().toISOString(),
    status: record.status,
    transferContent: record.transfer_content,
  };
}

function createTransferContent(clientRequestId: string) {
  return `CFX ${clientRequestId.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

function createScanUrl(origin: string, token: string) {
  const url = new URL("/experience/transfer", origin);
  url.hash = token;
  return url.toString();
}
