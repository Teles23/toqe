import { z } from 'zod';

/** Slug: lowercase, hífens, sem espaços — mesmo regex do NestJS */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createBarbeariaSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(100, 'Nome muito longo'),

  slug: z
    .string()
    .min(3, 'Slug deve ter ao menos 3 caracteres')
    .max(60, 'Slug muito longo')
    .regex(slugRegex, 'Slug inválido — use apenas letras, números e hífens (ex: minha-barbearia)'),
});

export const updateBarbeariaSchema = z.object({
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

  email: z
    .string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),

  endereco: z
    .string()
    .max(200, 'Endereço muito longo')
    .optional()
    .or(z.literal('')),

  logoUrl: z
    .string()
    .url('URL de logo inválida')
    .optional()
    .or(z.literal('')),
});

export const convidarMembroSchema = z.object({
  email:  z.string().email('E-mail inválido'),
  perfil: z.enum(['dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente'], {
    errorMap: () => ({ message: 'Perfil inválido' }),
  }),
});

export type CreateBarbeariaInput = z.infer<typeof createBarbeariaSchema>;
export type UpdateBarbeariaInput = z.infer<typeof updateBarbeariaSchema>;
export type ConvidarMembroInput  = z.infer<typeof convidarMembroSchema>;
