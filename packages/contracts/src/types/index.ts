// Tipos inferidos a partir dos schemas Zod.
// Use estes tipos em payloads de API, props de componentes e funções de domínio.

import { z } from "zod";
import {
  // auth
  loginSchema,
  registerSchema,
  criarClienteRapidoSchema,
  refreshTokenSchema,
  logoutSchema,
  authTokensSchema,
  googleAuthSchema,
} from "../schemas/auth";

// ---- Auth ----
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CriarClienteRapidoInput = z.infer<typeof criarClienteRapidoSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

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
