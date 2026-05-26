import { useMutation } from "@tanstack/react-query";

import { api } from "@/src/shared/api/api-client";

export interface RejeitarConviteResult {
  sucesso: boolean;
}

/**
 * Rejeita um convite de barbearia — remove o token no backend (não cria conta
 * nem vínculo). Idempotente.
 *
 * Endpoint: DELETE /convite/:token
 * Autenticação: não requerida (endpoint público).
 */
export function useRejeitarConvite() {
  return useMutation<RejeitarConviteResult, Error, string>({
    mutationFn: (token) =>
      api.delete<RejeitarConviteResult>(`/convite/${token}`, {
        skipRefresh: true,
      }),
  });
}
