import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  notificationChannelSchema,
  notificationEventSchema,
  notificationStatusSchema,
  notificationTemplateSchema,
} from "@/lib/validation/notifications";
import type {
  AdminNotificationOperationsItem,
  NotificationOutboxRecord,
  NotificationRecipient,
} from "@/types/notifications";
import type { AdminNotificationFilters } from "@/lib/validation/notifications";
import type { Json, TableUpdate } from "@/types/supabase";

const outboxRowSchema = z.object({
  attempts: z.number().int().min(0).max(20),
  channel: notificationChannelSchema,
  created_at: z.string().datetime({ offset: true }),
  customer_id: z.string().uuid(),
  event_key: z.string().min(8).max(180),
  event_type: notificationEventSchema,
  id: z.string().uuid(),
  last_error_code: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  next_attempt_at: z.string().datetime({ offset: true }).nullable(),
  order_id: z.string().uuid().nullable(),
  provider_message_id: z.string().nullable(),
  rendered_preview: z.record(z.string(), z.unknown()).nullable(),
  sent_at: z.string().datetime({ offset: true }).nullable(),
  status: notificationStatusSchema,
  template_key: notificationTemplateSchema,
  updated_at: z.string().datetime({ offset: true }),
});

const recipientRowSchema = z.object({
  email: z.string().email().nullable(),
  id: z.string().uuid(),
  phone: z.string().nullable(),
});

const adminOutboxRowSchema = outboxRowSchema.pick({
  attempts: true,
  channel: true,
  created_at: true,
  customer_id: true,
  event_type: true,
  id: true,
  last_error_code: true,
  metadata: true,
  sent_at: true,
  status: true,
  updated_at: true,
});

export interface NotificationOutboxRepository {
  claimBatch(limit: number): Promise<NotificationOutboxRecord[]>;
  getRecipient(customerId: string): Promise<NotificationRecipient | null>;
  markBlocked(input: {
    code: string;
    id: string;
    preview?: Record<string, string>;
  }): Promise<void>;
  markFailed(input: { code: string; id: string }): Promise<void>;
  markSent(input: {
    id: string;
    providerMessageId: string;
    sentAt: string;
  }): Promise<void>;
  releaseForRetry(input: {
    code: string;
    id: string;
    nextAttemptAt: string;
  }): Promise<void>;
}

export const supabaseNotificationOutboxRepository: NotificationOutboxRepository = {
  async claimBatch(limit) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("claim_notification_outbox", {
      p_limit: limit,
    });

    if (error) throw new Error("Failed to claim notification outbox", { cause: error });
    return z.array(outboxRowSchema).parse(data ?? []).map(mapOutboxRow);
  },

  async getRecipient(customerId) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,phone")
      .eq("id", customerId)
      .maybeSingle();

    if (error) throw new Error("Failed to read notification recipient", { cause: error });
    if (!data) return null;
    const row = recipientRowSchema.parse(data);
    return { customerId: row.id, email: row.email, phone: row.phone };
  },

  async markBlocked(input) {
    await updateOutbox(input.id, {
      last_error_code: input.code,
      next_attempt_at: new Date().toISOString(),
      rendered_preview: (input.preview ?? null) as Json | null,
      status: "blocked",
    });
  },

  async markFailed(input) {
    await updateOutbox(input.id, {
      last_error_code: input.code,
      next_attempt_at: new Date().toISOString(),
      status: "failed",
    });
  },

  async markSent(input) {
    await updateOutbox(input.id, {
      last_error_code: null,
      provider_message_id: input.providerMessageId,
      sent_at: input.sentAt,
      status: "sent",
    });
  },

  async releaseForRetry(input) {
    await updateOutbox(input.id, {
      last_error_code: input.code,
      next_attempt_at: input.nextAttemptAt,
      status: "queued",
    });
  },
};

export async function listAdminNotificationOperations(
  filters: AdminNotificationFilters = {},
): Promise<AdminNotificationOperationsItem[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("notification_outbox")
    .select(
      "id,event_type,channel,customer_id,status,attempts,last_error_code,metadata,sent_at,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.channel) query = query.eq("channel", filters.channel);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to read notification operations", { cause: error });
  }

  const normalizedQuery = filters.q?.trim().toLowerCase() ?? "";
  return (data ?? [])
    .map((row) => toAdminNotificationOperationsItem(adminOutboxRowSchema.parse(row)))
    .filter((item) =>
      normalizedQuery
        ? [item.id, item.orderCode, item.eventType, item.recipientLabel]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery))
        : true,
    );
}

export async function getAdminNotificationOperation(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_outbox")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Failed to read notification operation", { cause: error });
  return data ? mapOutboxRow(outboxRowSchema.parse(data)) : null;
}

export async function requeueAdminNotificationOperation(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_outbox")
    .update({
      attempts: 0,
      last_error_code: null,
      next_attempt_at: new Date().toISOString(),
      provider_message_id: null,
      rendered_preview: null,
      sent_at: null,
      status: "queued",
    })
    .eq("id", id)
    .in("status", ["blocked", "failed"])
    .select("*")
    .maybeSingle();

  if (error) throw new Error("Failed to requeue notification operation", { cause: error });
  return data ? mapOutboxRow(outboxRowSchema.parse(data)) : null;
}

async function updateOutbox(id: string, values: TableUpdate<"notification_outbox">) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("notification_outbox")
    .update(values)
    .eq("id", id)
    .eq("status", "processing");

  if (error) throw new Error("Failed to update notification outbox", { cause: error });
}

function mapOutboxRow(row: z.infer<typeof outboxRowSchema>): NotificationOutboxRecord {
  return {
    attempts: row.attempts,
    channel: row.channel,
    createdAt: row.created_at,
    customerId: row.customer_id,
    eventKey: row.event_key,
    eventType: row.event_type,
    id: row.id,
    lastErrorCode: row.last_error_code,
    metadata: row.metadata,
    nextAttemptAt: row.next_attempt_at,
    orderId: row.order_id,
    providerMessageId: row.provider_message_id,
    renderedPreview: row.rendered_preview,
    sentAt: row.sent_at,
    status: row.status,
    templateKey: row.template_key,
    updatedAt: row.updated_at,
  };
}

function toAdminNotificationOperationsItem(
  row: z.infer<typeof adminOutboxRowSchema>,
): AdminNotificationOperationsItem {
  const metadata = row.metadata;
  const orderCode =
    typeof metadata.orderCode === "string" ? metadata.orderCode.slice(0, 80) : null;

  return {
    attempts: row.attempts,
    channel: row.channel,
    createdAt: row.created_at,
    eventType: row.event_type,
    id: row.id,
    lastErrorCode: row.last_error_code,
    orderCode,
    recipientLabel: `Customer ${row.customer_id.slice(0, 8)}`,
    sentAt: row.sent_at,
    status: row.status,
    updatedAt: row.updated_at,
  };
}
