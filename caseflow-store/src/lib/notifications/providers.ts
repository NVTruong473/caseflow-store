import type { NotificationRuntimeConfig } from "@/lib/notifications/config";
import { isExternalNotificationChannelReady } from "@/lib/notifications/config";
import type {
  NotificationChannel,
  NotificationProvider,
  NotificationProviderResult,
} from "@/types/notifications";
import { storefrontConfig } from "@/config/storefront";

type FetchLike = typeof fetch;

export function createNotificationProvider(input: {
  channel: NotificationChannel;
  config: NotificationRuntimeConfig;
  fetcher?: FetchLike;
}): NotificationProvider {
  if (input.channel === "in-app") return inAppProvider;
  if (input.config.mode === "disabled") return createDisabledProvider(input.channel);
  if (input.config.mode === "sandbox") return createSandboxProvider(input.channel);
  if (!isExternalNotificationChannelReady(input.channel, input.config)) {
    return createDisabledProvider(input.channel, "LIVE_CONFIGURATION_INCOMPLETE");
  }

  return input.channel === "email"
    ? createResendProvider(input.config, input.fetcher ?? fetch)
    : createTwilioProvider(input.config, input.fetcher ?? fetch);
}

const inAppProvider: NotificationProvider = {
  channel: "in-app",
  async send(request) {
    return {
      providerMessageId: `in-app:${request.outboxId}`,
      status: "sent",
    };
  },
};

function createDisabledProvider(
  channel: Exclude<NotificationChannel, "in-app">,
  code = "EXTERNAL_DELIVERY_DISABLED",
): NotificationProvider {
  return {
    channel,
    async send() {
      return { code, retryable: false, status: "blocked" };
    },
  };
}

function createSandboxProvider(
  channel: Exclude<NotificationChannel, "in-app">,
): NotificationProvider {
  return {
    channel,
    async send(request) {
      return {
        code: "SANDBOX_PREVIEW",
        preview: {
          body: request.content.body,
          channel,
          subject: request.content.subject ?? request.content.title,
        },
        retryable: false,
        status: "blocked",
      };
    },
  };
}

function createResendProvider(
  config: NotificationRuntimeConfig,
  fetcher: FetchLike,
): NotificationProvider {
  return {
    channel: "email",
    async send(request) {
      const email = request.recipient.email;

      if (!email || !config.email.apiKey || !config.email.from) {
        return unavailableRecipient("EMAIL_RECIPIENT_OR_CONFIG_MISSING");
      }

      const response = await fetcher("https://api.resend.com/emails", {
        body: JSON.stringify({
          from: config.email.from,
          html: `<p>${escapeHtml(request.content.body)}</p>`,
          reply_to: config.email.replyTo ?? undefined,
          subject: request.content.subject ?? request.content.title,
          text: request.content.body,
          to: [email],
        }),
        headers: {
          Authorization: `Bearer ${config.email.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": request.eventKey,
        },
        method: "POST",
      });

      if (!response.ok) return providerHttpFailure("RESEND", response.status);
      const body = (await response.json().catch(() => null)) as { id?: unknown } | null;

      return {
        providerMessageId:
          typeof body?.id === "string" ? body.id : `resend:${request.outboxId}`,
        status: "sent",
      };
    },
  };
}

function createTwilioProvider(
  config: NotificationRuntimeConfig,
  fetcher: FetchLike,
): NotificationProvider {
  return {
    channel: "sms",
    async send(request) {
      const phone = request.recipient.phone;

      if (!phone || !config.sms.accountSid || !config.sms.authToken) {
        return unavailableRecipient("SMS_RECIPIENT_OR_CONFIG_MISSING");
      }

      const body = new URLSearchParams({
        Body: `${storefrontConfig.name}: ${request.content.body}`,
        To: phone,
      });

      if (config.sms.messagingServiceSid) {
        body.set("MessagingServiceSid", config.sms.messagingServiceSid);
      } else if (config.sms.from) {
        body.set("From", config.sms.from);
      } else {
        return unavailableRecipient("SMS_SENDER_MISSING");
      }

      const basicAuth = Buffer.from(
        `${config.sms.accountSid}:${config.sms.authToken}`,
      ).toString("base64");
      const response = await fetcher(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.sms.accountSid)}/Messages.json`,
        {
          body,
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          method: "POST",
        },
      );

      if (!response.ok) return providerHttpFailure("TWILIO", response.status);
      const responseBody = (await response.json().catch(() => null)) as
        | { sid?: unknown }
        | null;

      return {
        providerMessageId:
          typeof responseBody?.sid === "string"
            ? responseBody.sid
            : `twilio:${request.outboxId}`,
        status: "sent",
      };
    },
  };
}

function providerHttpFailure(
  provider: "RESEND" | "TWILIO",
  status: number,
): NotificationProviderResult {
  return {
    code: `${provider}_HTTP_${status}`,
    retryable: status === 408 || status === 429 || status >= 500,
    status: "failed",
  };
}

function unavailableRecipient(code: string): NotificationProviderResult {
  return { code, retryable: false, status: "blocked" };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "\"": "&quot;",
      "&": "&amp;",
      "'": "&#039;",
      "<": "&lt;",
      ">": "&gt;",
    };
    return entities[character];
  });
}
