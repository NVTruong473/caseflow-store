import { getNotificationRuntimeConfig } from "@/lib/notifications/config";
import { createNotificationProvider } from "@/lib/notifications/providers";
import {
  supabaseNotificationOutboxRepository,
  type NotificationOutboxRepository,
} from "@/lib/notifications/repository";
import { renderNotificationContent } from "@/lib/notifications/templates";
import type {
  NotificationChannel,
  NotificationProvider,
} from "@/types/notifications";

const MAX_DELIVERY_ATTEMPTS = 5;

export type NotificationDispatchSummary = {
  blocked: number;
  claimed: number;
  failed: number;
  retried: number;
  sent: number;
};

export async function dispatchQueuedNotifications(input: { limit?: number } = {}) {
  const config = getNotificationRuntimeConfig();

  return dispatchNotificationBatch({
    limit: input.limit ?? 25,
    repository: supabaseNotificationOutboxRepository,
    resolveProvider: (channel) => createNotificationProvider({ channel, config }),
  });
}

export async function dispatchNotificationBatch(input: {
  limit: number;
  now?: Date;
  repository: NotificationOutboxRepository;
  resolveProvider: (channel: NotificationChannel) => NotificationProvider;
}): Promise<NotificationDispatchSummary> {
  const now = input.now ?? new Date();
  const records = await input.repository.claimBatch(Math.min(Math.max(input.limit, 1), 100));
  const summary: NotificationDispatchSummary = {
    blocked: 0,
    claimed: records.length,
    failed: 0,
    retried: 0,
    sent: 0,
  };

  for (const record of records) {
    try {
      const recipient = await input.repository.getRecipient(record.customerId);

      if (!recipient) {
        await input.repository.markFailed({ code: "RECIPIENT_NOT_FOUND", id: record.id });
        summary.failed += 1;
        continue;
      }

      const provider = input.resolveProvider(record.channel);
      const result = await provider.send({
        channel: record.channel,
        content: renderNotificationContent({
          eventType: record.eventType,
          metadata: record.metadata,
        }),
        eventKey: `${record.eventKey}:${record.channel}`,
        eventType: record.eventType,
        metadata: primitiveMetadata(record.metadata),
        outboxId: record.id,
        recipient,
        templateKey: record.templateKey,
      });

      if (result.status === "sent") {
        await input.repository.markSent({
          id: record.id,
          providerMessageId: result.providerMessageId,
          sentAt: now.toISOString(),
        });
        summary.sent += 1;
      } else if (result.status === "blocked") {
        await input.repository.markBlocked({
          code: result.code,
          id: record.id,
          preview: result.preview,
        });
        summary.blocked += 1;
      } else if (result.retryable && record.attempts < MAX_DELIVERY_ATTEMPTS) {
        await input.repository.releaseForRetry({
          code: result.code,
          id: record.id,
          nextAttemptAt: getNotificationRetryAt(record.attempts, now),
        });
        summary.retried += 1;
      } else {
        await input.repository.markFailed({ code: result.code, id: record.id });
        summary.failed += 1;
      }
    } catch {
      if (record.attempts < MAX_DELIVERY_ATTEMPTS) {
        await input.repository.releaseForRetry({
          code: "PROVIDER_UNEXPECTED_ERROR",
          id: record.id,
          nextAttemptAt: getNotificationRetryAt(record.attempts, now),
        });
        summary.retried += 1;
      } else {
        await input.repository.markFailed({
          code: "PROVIDER_UNEXPECTED_ERROR",
          id: record.id,
        });
        summary.failed += 1;
      }
    }
  }

  return summary;
}

export function getNotificationRetryAt(attempts: number, now = new Date()) {
  const safeAttempts = Math.max(1, Math.min(attempts, MAX_DELIVERY_ATTEMPTS));
  const delaySeconds = Math.min(30 * 2 ** (safeAttempts - 1), 60 * 60);
  return new Date(now.getTime() + delaySeconds * 1000).toISOString();
}

function primitiveMetadata(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) =>
      value === null || ["boolean", "number", "string"].includes(typeof value),
    ),
  ) as Record<string, string | number | boolean | null>;
}
