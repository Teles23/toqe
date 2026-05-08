import { z } from 'zod';

export const updatePreferenciasSchema = z.object({
  canal: z.enum(['email', 'push', 'whatsapp', 'sms'], {
    errorMap: () => ({ message: 'Canal inválido' }),
  }),
  ativo: z.boolean(),
});

export type UpdatePreferenciasInput = z.infer<typeof updatePreferenciasSchema>;
