import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { localizedTextSchema } from "@/lib/validation/domain";
import { notificationEventSchema } from "@/lib/validation/notifications";
import type { CustomerNotification } from "@/types/notifications";
import type { Json, TableUpdate } from "@/types/supabase";

const customerNotificationRowSchema = z.object({
  body: localizedTextSchema,
  created_at: z.string().datetime({ offset: true }),
  event_type: notificationEventSchema,
  id: z.string().uuid(),
  order_id: z.string().uuid().nullable(),
  read_at: z.string().datetime({ offset: true }).nullable(),
  title: localizedTextSchema,
});

const phoneProfileSchema = z.object({
  phone: z.string().nullable(),
  phone_verified_at: z.string().datetime({ offset: true }).nullable(),
  role: z.enum(["customer", "staff", "admin"]),
});

const createChallengeResultSchema = z.union([
  z.object({ status: z.enum(["profile-mismatch", "rate-limited"]) }),
  z.object({
    challengeId: z.string().uuid(),
    expiresAt: z.string().datetime({ offset: true }),
    outboxId: z.string().uuid(),
    status: z.literal("created"),
  }),
]);

const verifyChallengeResultSchema = z.object({
  phone: z.string().optional(),
  status: z.enum([
    "not-found",
    "consumed",
    "expired",
    "locked",
    "invalid",
    "verified",
  ]),
});

export async function listCustomerNotifications(
  customerId: string,
  limit = 20,
): Promise<CustomerNotification[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_notifications")
    .select("id,order_id,event_type,title,body,read_at,created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) throw new Error("Failed to read customer notifications", { cause: error });

  return z.array(customerNotificationRowSchema).parse(data ?? []).map((row) => ({
    body: row.body,
    createdAt: row.created_at,
    eventType: row.event_type,
    id: row.id,
    orderId: row.order_id,
    readAt: row.read_at,
    title: row.title,
  }));
}

export async function markCustomerNotificationsRead(input: {
  customerId: string;
  notificationIds: string[];
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_notifications")
    .update({ read_at: new Date().toISOString() } satisfies TableUpdate<"customer_notifications">)
    .eq("customer_id", input.customerId)
    .in("id", input.notificationIds)
    .select("id");

  if (error) throw new Error("Failed to mark customer notifications read", { cause: error });
  return data?.length ?? 0;
}

export async function getCustomerPhoneVerificationProfile(customerId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("phone,phone_verified_at,role")
    .eq("id", customerId)
    .maybeSingle();

  if (error) throw new Error("Failed to read phone verification profile", { cause: error });
  return data ? phoneProfileSchema.parse(data) : null;
}

export async function createPhoneVerificationChallengeRecord(input: {
  challengeId: string;
  customerId: string;
  expiresAt: string;
  otpHash: string;
  phone: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("create_phone_verification_challenge", {
    p_challenge_id: input.challengeId,
    p_customer_id: input.customerId,
    p_expires_at: input.expiresAt,
    p_otp_hash: input.otpHash,
    p_phone: input.phone,
  });

  if (error) throw new Error("Failed to create phone verification challenge", { cause: error });
  return createChallengeResultSchema.parse(data);
}

export async function verifyPhoneChallengeRecord(input: {
  challengeId: string;
  customerId: string;
  otpHash: string;
  verifiedAt: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("verify_phone_challenge", {
    p_challenge_id: input.challengeId,
    p_customer_id: input.customerId,
    p_otp_hash: input.otpHash,
    p_verified_at: input.verifiedAt,
  });

  if (error) throw new Error("Failed to verify phone challenge", { cause: error });
  return verifyChallengeResultSchema.parse(data);
}

export async function consumePhoneVerificationChallenge(challengeId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("phone_verification_challenges")
    .update({ consumed_at: new Date().toISOString() } satisfies TableUpdate<"phone_verification_challenges">)
    .eq("id", challengeId)
    .is("consumed_at", null);

  if (error) throw new Error("Failed to close phone verification challenge", { cause: error });
}

export function asNotificationJson(value: Record<string, string>): Json {
  return value;
}
