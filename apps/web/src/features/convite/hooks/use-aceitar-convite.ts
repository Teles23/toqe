"use client";

import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/shared/hooks/use-auth";
import {
  requestAceitarConvite,
  type AceitarConviteResult,
} from "@/features/convite/services/convite.service";

export interface AceitarConviteInput {
  token: string;
  nome?: string;
  senha?: string;
}

/**
 * Aceita um convite de barbearia e faz **auto-login**: o BFF
 * (`POST /api/convite/:token/aceitar`) seta os cookies de sessão a partir dos
 * tokens retornados pelo backend; em seguida chamamos `establishSession()`
 * para popular o estado global (`/usuarios/me`).
 *
 * Erros propagados (ConviteServiceError com `status`):
 *   - 404: convite expirado ou não encontrado
 *   - 409: convite já utilizado
 *   - 401: senha incorreta
 *   - 400: senha < 8 caracteres
 */
export function useAceitarConvite() {
  const { establishSession } = useAuth();

  return useMutation<AceitarConviteResult, Error, AceitarConviteInput>({
    mutationKey: ["convite", "aceitar"],
    mutationFn: async ({ token, nome, senha }) => {
      const result = await requestAceitarConvite(token, { nome, senha });
      // Cookies já setados pelo BFF — popula o AuthProvider.
      await establishSession();
      return result;
    },
  });
}
