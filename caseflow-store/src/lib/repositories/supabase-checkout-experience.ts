import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  checkoutExperienceStatuses,
  type CheckoutExperienceHistoryRecord,
  type CheckoutExperienceStatus,
} from "@/types/checkout-experience";
import type { Json, TableInsert, TableRow } from "@/types/supabase";

const checkoutExperienceRowSchema = z.object({
  amount_vnd: z.number().int().positive(),
  cart_fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  client_request_id: z.string().uuid(),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  confirmation_code_hash: z.string().regex(/^[a-f0-9]{64}$/),
  confirmation_code_salt: z.string().regex(/^[a-f0-9]{64}$/),
  created_at: z.string().datetime({ offset: true }),
  currency: z.literal("VND"),
  customer_id: z.string().uuid(),
  expires_at: z.string().datetime({ offset: true }),
  failed_attempts: z.number().int().min(0).max(5),
  id: z.string().uuid(),
  status: z.enum(checkoutExperienceStatuses),
  token_hash: z.string().regex(/^[a-f0-9]{64}$/),
  transfer_content: z.string().min(8).max(40),
  updated_at: z.string().datetime({ offset: true }),
}) satisfies z.ZodType<TableRow<"checkout_experience_sessions">>;

const completionResultSchema = z.object({
  completedAt: z.string().datetime({ offset: true }).nullable().optional(),
  failedAttempts: z.number().int().min(0).max(5).optional(),
  result: z.enum([
    "completed",
    "expired",
    "invalid_confirmation",
    "invalid_state",
    "locked",
    "not_found",
  ]),
  status: z.enum(checkoutExperienceStatuses).optional(),
});

const checkoutExperienceHistoryRowSchema = checkoutExperienceRowSchema.pick({
  amount_vnd: true,
  completed_at: true,
  created_at: true,
  currency: true,
  expires_at: true,
  id: true,
  status: true,
  transfer_content: true,
});

export type CheckoutExperienceRow = z.infer<
  typeof checkoutExperienceRowSchema
>;
export type CheckoutExperienceCompletionResult = z.infer<
  typeof completionResultSchema
>;

export async function createOrRecoverCheckoutExperience(
  record: TableInsert<"checkout_experience_sessions">,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("checkout_experience_sessions")
    .insert(record)
    .select("*")
    .maybeSingle();

  if (!error && data) {
    return checkoutExperienceRowSchema.parse(data);
  }

  if (error?.code !== "23505") {
    throw new Error("Failed to create checkout experience session", {
      cause: error,
    });
  }

  const existing = await getCheckoutExperienceByCustomerRequest({
    clientRequestId: record.client_request_id,
    customerId: record.customer_id,
  });

  if (
    !existing ||
    existing.amount_vnd !== record.amount_vnd ||
    existing.cart_fingerprint !== record.cart_fingerprint ||
    existing.token_hash !== record.token_hash
  ) {
    throw new Error("Checkout experience idempotency conflict");
  }

  return existing;
}

export async function getCheckoutExperienceByTokenHash(tokenHash: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("checkout_experience_sessions")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to read checkout experience session", {
      cause: error,
    });
  }

  if (!data) {
    return null;
  }

  const record = checkoutExperienceRowSchema.parse(data);

  if (
    record.status === "pending" &&
    new Date(record.expires_at).getTime() <= Date.now()
  ) {
    const { data: expired, error: expireError } = await supabase
      .from("checkout_experience_sessions")
      .update({ status: "expired" })
      .eq("id", record.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();

    if (expireError) {
      throw new Error("Failed to expire checkout experience session", {
        cause: expireError,
      });
    }

    return expired ? checkoutExperienceRowSchema.parse(expired) : record;
  }

  return record;
}

export async function listCheckoutExperiencesForCustomer(
  customerId: string,
  limit = 20,
): Promise<CheckoutExperienceHistoryRecord[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("checkout_experience_sessions")
    .select(
      "id,amount_vnd,currency,status,transfer_content,expires_at,completed_at,created_at",
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error("Failed to list customer checkout experiences", {
      cause: error,
    });
  }

  const serverTime = Date.now();

  return (data ?? []).map((value) => {
    const row = checkoutExperienceHistoryRowSchema.parse(value);
    const status =
      row.status === "pending" &&
      new Date(row.expires_at).getTime() <= serverTime
        ? "expired"
        : row.status;

    return {
      amountVnd: row.amount_vnd,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      currency: row.currency,
      expiresAt: row.expires_at,
      id: row.id,
      status,
      transferContent: row.transfer_content,
    };
  });
}

export async function completeCheckoutExperience(input: {
  amountVnd: number;
  confirmationCodeHash: string;
  tokenHash: string;
}): Promise<CheckoutExperienceCompletionResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc(
    "complete_checkout_experience_session",
    {
      p_amount_vnd: input.amountVnd,
      p_confirmation_code_hash: input.confirmationCodeHash,
      p_token_hash: input.tokenHash,
    },
  );

  if (error) {
    throw new Error("Failed to complete checkout experience session", {
      cause: error,
    });
  }

  return completionResultSchema.parse(data as Json);
}

export async function cancelCheckoutExperienceForCustomer(input: {
  customerId: string;
  tokenHash: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("checkout_experience_sessions")
    .update({ status: "cancelled" })
    .eq("customer_id", input.customerId)
    .eq("token_hash", input.tokenHash)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error("Failed to cancel checkout experience session", {
      cause: error,
    });
  }

  if (data) {
    return checkoutExperienceRowSchema.parse(data);
  }

  return getCheckoutExperienceByTokenHash(input.tokenHash);
}

async function getCheckoutExperienceByCustomerRequest(input: {
  clientRequestId: string;
  customerId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("checkout_experience_sessions")
    .select("*")
    .eq("customer_id", input.customerId)
    .eq("client_request_id", input.clientRequestId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to recover checkout experience session", {
      cause: error,
    });
  }

  return data ? checkoutExperienceRowSchema.parse(data) : null;
}

export function getCheckoutExperienceStatus(
  record: CheckoutExperienceRow,
): CheckoutExperienceStatus {
  return record.status;
}
