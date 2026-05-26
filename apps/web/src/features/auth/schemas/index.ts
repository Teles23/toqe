// Re-exports convenientes dos schemas Zod compartilhados em @toqe/contracts.
// Permite que componentes/hooks da feature `auth` importem de um lugar
// só (`@/features/auth/schemas`) sem precisar conhecer o caminho exato
// dentro do package de contratos.

export {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  logoutSchema,
  authTokensSchema,
} from "@toqe/contracts";

export type {
  LoginInput,
  RegisterInput,
  RefreshTokenInput,
  LogoutInput,
  AuthTokens,
} from "@toqe/contracts";
