import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

export const registerSchema = z.object({
  nome:  z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  telefone: z.string().optional(),
});

export type LoginInput    = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
