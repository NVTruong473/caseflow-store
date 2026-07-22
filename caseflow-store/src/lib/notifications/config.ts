import {
  emailProviderSchema,
  notificationModeSchema,
  smsProviderSchema,
} from "@/lib/validation/notifications";
import type {
  EmailProviderName,
  NotificationChannel,
  NotificationMode,
  SmsProviderName,
} from "@/types/notifications";

type ExternalNotificationChannel = Exclude<NotificationChannel, "in-app">;

export type NotificationRuntimeConfig = {
  dispatchSecret: string | null;
  email: {
    apiKey: string | null;
    from: string | null;
    provider: EmailProviderName;
    replyTo: string | null;
  };
  issues: string[];
  mode: NotificationMode;
  otpHashSecret: string | null;
  sms: {
    accountSid: string | null;
    authToken: string | null;
    from: string | null;
    messagingServiceSid: string | null;
    provider: SmsProviderName;
  };
};

const PLACEHOLDER_VALUES = new Set([
  "change-me",
  "change-me-in-development",
  "replace-me",
]);

export function getNotificationRuntimeConfig(): NotificationRuntimeConfig {
  const mode = parseMode(process.env.NOTIFICATION_MODE);
  const emailProvider = parseEmailProvider(process.env.EMAIL_PROVIDER, mode);
  const smsProvider = parseSmsProvider(process.env.SMS_PROVIDER, mode);
  const config: NotificationRuntimeConfig = {
    dispatchSecret:
      readSecret("NOTIFICATION_DISPATCH_SECRET") ?? readSecret("CRON_SECRET"),
    email: {
      apiKey: readSecret("RESEND_API_KEY"),
      from: readValue("EMAIL_FROM"),
      provider: emailProvider,
      replyTo: readValue("EMAIL_REPLY_TO"),
    },
    issues: [],
    mode,
    otpHashSecret: readSecret("OTP_HASH_SECRET"),
    sms: {
      accountSid: readSecret("TWILIO_ACCOUNT_SID"),
      authToken: readSecret("TWILIO_AUTH_TOKEN"),
      from: readValue("TWILIO_FROM"),
      messagingServiceSid: readSecret("TWILIO_MESSAGING_SERVICE_SID"),
      provider: smsProvider,
    },
  };

  if (mode === "live") {
    if (emailProvider === "resend") {
      if (!config.email.apiKey) config.issues.push("RESEND_API_KEY is required");
      if (!config.email.from) config.issues.push("EMAIL_FROM is required");
    }

    if (smsProvider === "twilio") {
      if (!config.sms.accountSid) config.issues.push("TWILIO_ACCOUNT_SID is required");
      if (!config.sms.authToken) config.issues.push("TWILIO_AUTH_TOKEN is required");
      if (!config.sms.messagingServiceSid && !config.sms.from) {
        config.issues.push(
          "TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM is required",
        );
      }
      if (!config.otpHashSecret) config.issues.push("OTP_HASH_SECRET is required");
    }

    if (emailProvider === "disabled" && smsProvider === "disabled") {
      config.issues.push("At least one live notification provider is required");
    }
    if (!config.dispatchSecret) {
      config.issues.push("NOTIFICATION_DISPATCH_SECRET or CRON_SECRET is required");
    }
  }

  return config;
}

export function isExternalNotificationChannelReady(
  channel: ExternalNotificationChannel,
  config = getNotificationRuntimeConfig(),
) {
  if (config.mode === "disabled") return false;
  if (config.mode === "sandbox") return true;

  return channel === "email"
    ? config.email.provider === "resend" &&
        Boolean(config.email.apiKey && config.email.from)
    : config.sms.provider === "twilio" &&
        Boolean(
          config.sms.accountSid &&
            config.sms.authToken &&
            (config.sms.messagingServiceSid || config.sms.from),
        );
}

export function assertExternalNotificationChannelReady(
  channel: ExternalNotificationChannel,
  config = getNotificationRuntimeConfig(),
) {
  if (!isExternalNotificationChannelReady(channel, config)) {
    throw new Error(
      `External ${channel} notifications are unavailable in the current server configuration`,
    );
  }
}

export function getNotificationConfigurationSummary(
  config = getNotificationRuntimeConfig(),
) {
  return {
    dispatchReady:
      config.mode === "sandbox" ||
      (config.mode === "live" && Boolean(config.dispatchSecret)),
    emailProvider: config.email.provider,
    emailReady: isExternalNotificationChannelReady("email", config),
    issues: [...config.issues],
    mode: config.mode,
    otpReady:
      config.mode === "live" &&
      config.sms.provider === "twilio" &&
      Boolean(config.otpHashSecret) &&
      isExternalNotificationChannelReady("sms", config),
    smsProvider: config.sms.provider,
    smsReady: isExternalNotificationChannelReady("sms", config),
  } satisfies import("@/types/notifications").NotificationConfigurationSummary;
}

function parseMode(value: string | undefined): NotificationMode {
  const parsed = notificationModeSchema.safeParse(value?.trim().toLowerCase());
  return parsed.success ? parsed.data : "disabled";
}

function parseEmailProvider(
  value: string | undefined,
  mode: NotificationMode,
): EmailProviderName {
  const parsed = emailProviderSchema.safeParse(value?.trim().toLowerCase());
  if (parsed.success) return parsed.data;
  return mode === "sandbox" ? "sandbox" : "disabled";
}

function parseSmsProvider(
  value: string | undefined,
  mode: NotificationMode,
): SmsProviderName {
  const parsed = smsProviderSchema.safeParse(value?.trim().toLowerCase());
  if (parsed.success) return parsed.data;
  return mode === "sandbox" ? "sandbox" : "disabled";
}

function readValue(name: string) {
  const value = process.env[name]?.trim();
  return value && !PLACEHOLDER_VALUES.has(value.toLowerCase()) ? value : null;
}

function readSecret(name: string) {
  return readValue(name);
}
