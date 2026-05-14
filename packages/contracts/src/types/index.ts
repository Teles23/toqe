// Tipos inferidos a partir dos schemas Zod.
// Use estes tipos em payloads de API, props de componentes e funções de domínio.

import { z } from "zod";
import {
  // auth
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  logoutSchema,
  authTokensSchema,
} from "../schemas/auth";

// ---- Auth ----
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;

// ---- API Response shapes ----
export type {
  Periodo,
  BarbeiroAPI,
  ClienteAPI,
  ServicoAPI,
  AgendamentoAPI,
  FaturamentoItem,
  AgendamentosItem,
  ServicoRelatorioItem,
  BarbeiroRelatorioItem,
  HorarioPicoItem,
} from "./api-responses";
