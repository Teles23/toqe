import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PLANOS_PAGOS = ['basic', 'pro', 'enterprise'] as const;
export type PlanoPago = (typeof PLANOS_PAGOS)[number];

export const checkoutSchema = z.object({
  plano: z.enum(PLANOS_PAGOS, {
    errorMap: () => ({
      message: `plano deve ser um dos valores: ${PLANOS_PAGOS.join(', ')}`,
    }),
  }),
});

export class CheckoutDto extends createZodDto(checkoutSchema) {}
