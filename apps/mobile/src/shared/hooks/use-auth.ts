import { useContext } from "react";

import {
  AuthContext,
  type AuthContextValue,
} from "@/src/shared/providers/auth-provider";

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
