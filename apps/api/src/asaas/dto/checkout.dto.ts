import { IsIn } from 'class-validator';

export const PLANOS_PAGOS = ['basic', 'pro', 'enterprise'] as const;
export type PlanoPago = (typeof PLANOS_PAGOS)[number];

export class CheckoutDto {
  @IsIn(PLANOS_PAGOS, {
    message: `plano deve ser um dos valores: ${PLANOS_PAGOS.join(', ')}`,
  })
  plano: PlanoPago;
}
