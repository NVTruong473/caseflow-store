import { z } from "zod";

import { customerPhoneSchema } from "@/lib/validation/domain";
import {
  EMAIL_PROVIDERS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  NOTIFICATION_MODES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TEMPLATES,
  SMS_PROVIDERS,
} from "@/types/notifications";

export const notificationChannelSchema = z.enum(NOTIFICATION_CHANNELS);
export const notificationStatusSchema = z.enum(NOTIFICATION_STATUSES);
export const notificationEventSchema = z.enum(NOTIFICATION_EVENTS);
export const notificationTemplateSchema = z.enum(NOTIFICATION_TEMPLATES);
export const notificationModeSchema = z.enum(NOTIFICATION_MODES);
export const emailProviderSchema = z.enum(EMAIL_PROVIDERS);
export const smsProviderSchema = z.enum(SMS_PROVIDERS);

export const notificationEventKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(180)
  .regex(/^[a-z0-9][a-z0-9:._-]+$/i);

export const notificationMetadataSchema = z.record(
  z.string().trim().min(1).max(80),
  z.union([z.string().max(500), z.number(), z.boolean(), z.null()]),
);

export const requestPhoneVerificationSchema = z
  .object({
    phone: customerPhoneSchema,
  })
  .strict();

export const verifyPhoneChallengeSchema = z
  .object({
    challengeId: z.string().uuid(),
    code: z.string().trim().regex(/^\d{6}$/),
  })
  .strict();

export const markCustomerNotificationsReadSchema = z
  .object({
    notificationIds: z.array(z.string().uuid()).min(1).max(100),
  })
  .strict();

export const adminNotificationFiltersSchema = z
  .object({
    channel: notificationChannelSchema.optional(),
    eventType: notificationEventSchema.optional(),
    q: z.string().trim().max(120).optional(),
    status: notificationStatusSchema.optional(),
  })
  .strict();

export const retryNotificationSchema = z
  .object({
    notificationId: z.string().uuid(),
  })
  .strict();

export type RequestPhoneVerification = z.infer<
  typeof requestPhoneVerificationSchema
>;
export type VerifyPhoneChallenge = z.infer<typeof verifyPhoneChallengeSchema>;
export type MarkCustomerNotificationsRead = z.infer<
  typeof markCustomerNotificationsReadSchema
>;
export type AdminNotificationFilters = z.infer<
  typeof adminNotificationFiltersSchema
>;
