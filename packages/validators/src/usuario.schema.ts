import { z } from 'zod';

export const updateUsuarioSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .optional(),

  telefone: z
    .string()
    .regex(/^\+?[\d\s\-()]{8,20}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),

  avatarUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
