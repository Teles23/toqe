import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export enum AsaasEvent {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  PAYMENT_DELETED = 'PAYMENT_DELETED',
  SUBSCRIPTION_INACTIVATED = 'SUBSCRIPTION_INACTIVATED',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
}

const asaasWebhookSchema = z.object({
  event: z.nativeEnum(AsaasEvent),
  payment: z
    .object({
      subscription: z.string().max(100),
      dueDate: z.string(),
    })
    .optional(),
  subscription: z
    .object({
      id: z.string().max(100),
      status: z.string(),
      nextDueDate: z.string(),
    })
    .optional(),
});

export class AsaasWebhookPayload extends createZodDto(asaasWebhookSchema) {}
