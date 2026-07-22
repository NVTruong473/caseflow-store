export const NOTIFICATION_CHANNELS = ["in-app", "email", "sms"] as const;

export const NOTIFICATION_STATUSES = [
  "queued",
  "processing",
  "sent",
  "blocked",
  "failed",
] as const;

export const NOTIFICATION_EVENTS = [
  "order.created",
  "order.confirmed",
  "order.cancelled",
  "payment.awaiting-transfer",
  "payment.confirmed",
  "payment.rejected",
  "shipping.shipped",
  "order.completed",
  "phone.verification-requested",
  "phone.verified",
] as const;

export const NOTIFICATION_TEMPLATES = [
  "order-created",
  "order-confirmed",
  "order-cancelled",
  "payment-awaiting-transfer",
  "payment-confirmed",
  "payment-rejected",
  "shipping-shipped",
  "order-completed",
  "phone-verification-code",
  "phone-verified",
] as const;

export const NOTIFICATION_MODES = ["disabled", "sandbox", "live"] as const;
export const EMAIL_PROVIDERS = ["disabled", "sandbox", "resend"] as const;
export const SMS_PROVIDERS = ["disabled", "sandbox", "twilio"] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];
export type NotificationTemplate = (typeof NOTIFICATION_TEMPLATES)[number];
export type NotificationMode = (typeof NOTIFICATION_MODES)[number];
export type EmailProviderName = (typeof EMAIL_PROVIDERS)[number];
export type SmsProviderName = (typeof SMS_PROVIDERS)[number];

export type NotificationLocale = "en" | "vi";

export type NotificationRecipient = {
  customerId: string;
  email: string | null;
  phone: string | null;
};

export type NotificationContent = {
  body: string;
  locale: NotificationLocale;
  subject: string | null;
  title: string;
};

export type NotificationDeliveryRequest = {
  channel: NotificationChannel;
  content: NotificationContent;
  eventKey: string;
  eventType: NotificationEvent;
  metadata: Record<string, string | number | boolean | null>;
  outboxId: string;
  recipient: NotificationRecipient;
  templateKey: NotificationTemplate;
};

export type NotificationProviderResult =
  | {
      providerMessageId: string;
      preview?: Record<string, string>;
      status: "sent";
    }
  | {
      code: string;
      preview?: Record<string, string>;
      retryable: boolean;
      status: "blocked" | "failed";
    };

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(request: NotificationDeliveryRequest): Promise<NotificationProviderResult>;
}

export type NotificationOutboxRecord = {
  attempts: number;
  channel: NotificationChannel;
  createdAt: string;
  customerId: string;
  eventKey: string;
  eventType: NotificationEvent;
  id: string;
  lastErrorCode: string | null;
  metadata: Record<string, unknown>;
  nextAttemptAt: string | null;
  orderId: string | null;
  providerMessageId: string | null;
  renderedPreview: Record<string, unknown> | null;
  sentAt: string | null;
  status: NotificationStatus;
  templateKey: NotificationTemplate;
  updatedAt: string;
};

export type AdminNotificationOperationsItem = {
  attempts: number;
  channel: NotificationChannel;
  createdAt: string;
  eventType: NotificationEvent;
  id: string;
  lastErrorCode: string | null;
  orderCode: string | null;
  recipientLabel: string;
  sentAt: string | null;
  status: NotificationStatus;
  updatedAt: string;
};

export type NotificationConfigurationSummary = {
  dispatchReady: boolean;
  emailProvider: EmailProviderName;
  emailReady: boolean;
  issues: string[];
  mode: NotificationMode;
  otpReady: boolean;
  smsProvider: SmsProviderName;
  smsReady: boolean;
};

export type CustomerNotification = {
  body: Record<NotificationLocale, string>;
  createdAt: string;
  eventType: NotificationEvent;
  id: string;
  orderId: string | null;
  readAt: string | null;
  title: Record<NotificationLocale, string>;
};

export type PhoneVerificationChallenge = {
  attempts: number;
  consumedAt: string | null;
  createdAt: string;
  customerId: string;
  expiresAt: string;
  id: string;
  maxAttempts: number;
  phone: string;
};
