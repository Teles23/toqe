import { z } from "zod";

// ---- Inputs ----

export const loginSchema = z
  .object({
    email: z.string().email("E-mail inválido").max(100, "E-mail muito longo"),
    senha: z
      .string()
      .min(8, "Senha deve ter ao menos 8 caracteres")
      .max(128, "Senha muito longa"),
  })
  .strict();

export const registerSchema = z
  .object({
    nome: z
      .string()
      .min(2, "Nome deve ter ao menos 2 caracteres")
      .max(100, "Nome muito longo"),
    email: z.string().email("E-mail inválido").max(100, "E-mail muito longo"),
    senha: z
      .string()
      .min(8, "Senha deve ter ao menos 8 caracteres")
      .max(128, "Senha muito longa"),
    telefone: z
      .string()
      .regex(/^\+?[\d\s\-()]{8,20}$/, "Telefone inválido")
      .max(20, "Telefone muito longo")
      .optional()
      .or(z.literal("")),
  })
  .strict();

export const criarClienteRapidoSchema = z
  .object({
    nome: z
      .string()
      .min(2, "Nome deve ter ao menos 2 caracteres")
      .max(100, "Nome muito longo"),
    email: z.string().email("E-mail inválido").max(100, "E-mail muito longo"),
    telefone: z
      .string()
      .regex(/^\+?[\d\s\-()]{8,20}$/, "Telefone inválido")
      .max(20, "Telefone muito longo")
      .optional()
      .or(z.literal("")),
  })
  .strict();

/**
 * Cadastro manual de cliente pelo barbeiro (tela Clientes do app).
 *
 * Diferente do `criarClienteRapidoSchema` (booking público, e-mail
 * obrigatório), aqui o e-mail é OPCIONAL — quando ausente o backend gera um
 * sintético determinístico, igual ao walk-in. `nome` continua obrigatório e
 * `telefone` é validado quando presente. A obrigatoriedade do telefone é regra
 * da UI mobile (o endpoint é compartilhado com a web, onde telefone é opcional).
 */
export const criarClienteManualSchema = criarClienteRapidoSchema.partial({
  email: true,
});

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

export const forgotPasswordSchema = z
  .object({
    email: z.string().email("E-mail inválido").max(100, "E-mail muito longo"),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token obrigatório"),
    novaSenha: z
      .string()
      .min(8, "Senha deve ter ao menos 8 caracteres")
      .max(128, "Senha muito longa"),
  })
  .strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    senhaAtual: z
      .string()
      .min(1, "Senha atual é obrigatória")
      .max(128, "Senha muito longa"),
    novaSenha: z
      .string()
      .min(8, "Nova senha deve ter ao menos 8 caracteres")
      .max(128, "Senha muito longa"),
    // Refresh token da sessão atual. Quando enviado, o backend revoga apenas
    // as OUTRAS sessões (outros dispositivos), mantendo a sessão atual ativa —
    // trocar a senha não deve deslogar quem fez a troca.
    refreshToken: z.string().optional(),
  })
  .strict()
  .refine((d) => d.senhaAtual !== d.novaSenha, {
    message: "Nova senha deve ser diferente da senha atual",
    path: ["novaSenha"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const googleAuthSchema = z
  .object({
    idToken: z.string().min(1, "ID token Google é obrigatório"),
  })
  .strict();

export const twoFaSetupSchema = z
  .object({
    code: z
      .string()
      .length(6, "Código deve ter 6 dígitos")
      .regex(/^\d{6}$/, "Código deve conter apenas números"),
  })
  .strict();
export const twoFaVerifySchema = z
  .object({
    code: z
      .string()
      .length(6, "Código deve ter 6 dígitos")
      .regex(/^\d{6}$/, "Código deve conter apenas números"),
    tempToken: z.string().min(1),
  })
  .strict();
export type TwoFaSetupInput = z.infer<typeof twoFaSetupSchema>;
export type TwoFaVerifyInput = z.infer<typeof twoFaVerifySchema>;

/**
 * Contato operacional — walk-in ou cliente sem conta no app.
 * Diferente do `criarClienteRapidoSchema`, e-mail não existe aqui: contatos
 * nunca fazem login, por isso não há coluna de e-mail em TQE_CONTATO.
 */
export const criarContatoSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100, "Nome muito longo"),
  telefone: z
    .string()
    .regex(/^\+?[\d\s\-()]{8,20}$/, "Telefone inválido")
    .max(20, "Telefone muito longo")
    .optional()
    .or(z.literal("")),
});

export type CriarContatoInput = z.infer<typeof criarContatoSchema>;

// Tipos inferidos vivem em `src/types/index.ts` (single source) para evitar
// duplicação de exports através do barrel raiz.
