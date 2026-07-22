import crypto from "node:crypto";

import {
  getNotificationRuntimeConfig,
  isExternalNotificationChannelReady,
} from "@/lib/notifications/config";
import { createNotificationProvider } from "@/lib/notifications/providers";
import { supabaseNotificationOutboxRepository } from "@/lib/notifications/repository";
import {
  consumePhoneVerificationChallenge,
  createPhoneVerificationChallengeRecord,
  getCustomerPhoneVerificationProfile,
  verifyPhoneChallengeRecord,
} from "@/lib/repositories/supabase-notifications";
import {
  requestPhoneVerificationSchema,
  verifyPhoneChallengeSchema,
  type RequestPhoneVerification,
  type VerifyPhoneChallenge,
} from "@/lib/validation/notifications";
import type { UseCaseResult } from "@/lib/use-cases/result";

const OTP_EXPIRES_MINUTES = 10;

export function isCustomerSmsVerificationAvailable() {
  const config = getNotificationRuntimeConfig();
  return (
    config.mode === "live" &&
    Boolean(config.otpHashSecret) &&
    isExternalNotificationChannelReady("sms", config)
  );
}

export async function requestPhoneVerification(input: {
  customerId: string;
  request: RequestPhoneVerification;
}): Promise<UseCaseResult<{ challengeId: string; expiresAt: string }>> {
  const parsed = requestPhoneVerificationSchema.safeParse(input.request);

  if (!parsed.success) return failure("VALIDATION_ERROR", "Invalid phone number", 400);
  const config = getNotificationRuntimeConfig();

  if (
    config.mode !== "live" ||
    !config.otpHashSecret ||
    !isExternalNotificationChannelReady("sms", config)
  ) {
    return failure(
      "PHONE_VERIFICATION_UNAVAILABLE",
      "Phone verification is temporarily unavailable",
      503,
    );
  }

  const profile = await getCustomerPhoneVerificationProfile(input.customerId);

  if (!profile || profile.role !== "customer") {
    return failure("FORBIDDEN", "Customer role required", 403);
  }

  if (!profile.phone || profile.phone !== parsed.data.phone) {
    return failure(
      "PHONE_VERIFICATION_PROFILE_MISMATCH",
      "Save this phone number in your profile before verification",
      409,
    );
  }

  if (profile.phone_verified_at) {
    return failure("PHONE_ALREADY_VERIFIED", "Phone number is already verified", 409);
  }

  const challengeId = crypto.randomUUID();
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const otpHash = hashOtp({ challengeId, code, secret: config.otpHashSecret });
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000,
  ).toISOString();
  const challenge = await createPhoneVerificationChallengeRecord({
    challengeId,
    customerId: input.customerId,
    expiresAt,
    otpHash,
    phone: parsed.data.phone,
  });

  if (challenge.status === "rate-limited") {
    return failure(
      "PHONE_VERIFICATION_RATE_LIMITED",
      "Too many verification requests. Try again later",
      429,
    );
  }

  if (challenge.status !== "created") {
    return failure(
      "PHONE_VERIFICATION_PROFILE_MISMATCH",
      "Phone profile changed before verification",
      409,
    );
  }

  const provider = createNotificationProvider({ channel: "sms", config });
  let result;

  try {
    result = await provider.send({
      channel: "sms",
      content: {
        body: `Mã xác nhận của bạn là ${code}. Mã có hiệu lực trong ${OTP_EXPIRES_MINUTES} phút.`,
        locale: "vi",
        subject: null,
        title: "Xác nhận số điện thoại",
      },
      eventKey: `phone:${input.customerId}:challenge:${challengeId}:sms`,
      eventType: "phone.verification-requested",
      metadata: { challengeId },
      outboxId: challenge.outboxId,
      recipient: { customerId: input.customerId, email: null, phone: profile.phone },
      templateKey: "phone-verification-code",
    });
  } catch {
    await consumePhoneVerificationChallenge(challengeId);
    await supabaseNotificationOutboxRepository.markFailed({
      code: "SMS_PROVIDER_UNEXPECTED_ERROR",
      id: challenge.outboxId,
    });
    return failure(
      "PHONE_VERIFICATION_DELIVERY_FAILED",
      "Verification message could not be delivered",
      503,
    );
  }

  if (result.status === "sent") {
    await supabaseNotificationOutboxRepository.markSent({
      id: challenge.outboxId,
      providerMessageId: result.providerMessageId,
      sentAt: new Date().toISOString(),
    });
    return { data: { challengeId, expiresAt }, success: true };
  }

  await consumePhoneVerificationChallenge(challengeId);

  if (result.status === "blocked") {
    await supabaseNotificationOutboxRepository.markBlocked({
      code: result.code,
      id: challenge.outboxId,
    });
  } else {
    await supabaseNotificationOutboxRepository.markFailed({
      code: result.code,
      id: challenge.outboxId,
    });
  }

  return failure(
    "PHONE_VERIFICATION_DELIVERY_FAILED",
    "Verification message could not be delivered",
    503,
  );
}

export async function verifyPhoneChallenge(input: {
  customerId: string;
  request: VerifyPhoneChallenge;
}): Promise<UseCaseResult<{ phoneVerified: true }>> {
  const parsed = verifyPhoneChallengeSchema.safeParse(input.request);

  if (!parsed.success) return failure("VALIDATION_ERROR", "Invalid verification code", 400);
  const config = getNotificationRuntimeConfig();

  if (config.mode !== "live" || !config.otpHashSecret) {
    return failure(
      "PHONE_VERIFICATION_UNAVAILABLE",
      "Phone verification is temporarily unavailable",
      503,
    );
  }

  const otpHash = hashOtp({
    challengeId: parsed.data.challengeId,
    code: parsed.data.code,
    secret: config.otpHashSecret,
  });
  const result = await verifyPhoneChallengeRecord({
    challengeId: parsed.data.challengeId,
    customerId: input.customerId,
    otpHash,
    verifiedAt: new Date().toISOString(),
  });

  switch (result.status) {
    case "verified":
      return { data: { phoneVerified: true }, success: true };
    case "invalid":
      return failure("PHONE_VERIFICATION_INVALID", "Verification code is incorrect", 400);
    case "expired":
      return failure("PHONE_VERIFICATION_EXPIRED", "Verification code has expired", 409);
    case "locked":
    case "consumed":
      return failure("PHONE_VERIFICATION_LOCKED", "Verification challenge is no longer active", 409);
    case "not-found":
      return failure("PHONE_VERIFICATION_NOT_FOUND", "Verification challenge was not found", 404);
  }
}

export function hashOtp(input: { challengeId: string; code: string; secret: string }) {
  // Chi HMAC duoc luu/so sanh; OTP ro chi ton tai trong bo nho luc gui SMS.
  return crypto
    .createHmac("sha256", input.secret)
    .update(`${input.challengeId}:${input.code}`)
    .digest("hex");
}

function failure(
  code: Parameters<typeof createFailure>[0],
  message: string,
  status: number,
) {
  return createFailure(code, message, status);
}

function createFailure(
  code:
    | "FORBIDDEN"
    | "PHONE_ALREADY_VERIFIED"
    | "PHONE_VERIFICATION_DELIVERY_FAILED"
    | "PHONE_VERIFICATION_EXPIRED"
    | "PHONE_VERIFICATION_INVALID"
    | "PHONE_VERIFICATION_LOCKED"
    | "PHONE_VERIFICATION_NOT_FOUND"
    | "PHONE_VERIFICATION_PROFILE_MISMATCH"
    | "PHONE_VERIFICATION_RATE_LIMITED"
    | "PHONE_VERIFICATION_UNAVAILABLE"
    | "VALIDATION_ERROR",
  message: string,
  status: number,
) {
  return { code, message, status, success: false as const };
}
