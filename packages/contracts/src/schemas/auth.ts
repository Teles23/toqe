import { z } from "zod";

// ---- Inputs ----

export const loginSchema = z
  .object({
    email: z.string().email("E-mail inválido"),
    senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  })
  .strict();

export const registerSchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
    telefone: z.string().optional(),
  })
  .strict();

export const criarClienteRapidoSchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    telefone: z.string().optional(),
  })
  .strict();

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, "Refresh token é obrigatório"),
  })
  .strict();

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(1, "Refresh token é obrigatório"),
  })
  .strict();

// ---- Outputs (respostas da API de auth) ----

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive().optional(),
});

// Tipos inferidos vivem em `src/types/index.ts` (single source) para evitar
// duplicação de exports através do barrel raiz.
