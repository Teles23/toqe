"use client";

import { useContext } from "react";
import {
  AuthContext,
  type AuthContextValue,
} from "@/shared/providers/auth-provider";

/**
 * Hook para acessar o estado e as ações de autenticação.
 * Lança erro se usado fora de `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
