import { useMutation } from "@tanstack/react-query";

import { api } from "@/src/shared/api/api-client";

export interface AceitarConviteInput {
  token: string;
  nome?: string;
  senha?: string;
}

export interface AceitarConviteResult {
  sucesso: boolean;
  userId: number;
}

/**
 * Aceita um convite de barbearia e vincula o usuário como Barbeiro.
 *
 * Endpoint: POST /convite/:token/aceitar
 * Autenticação: não requerida (endpoint público).
 * Body: { nome?: string; senha?: string }
 *
 * Erros esperados:
 *   - 404: convite não encontrado ou expirado
 *   - 409: convite já utilizado
 */
export function useAceitarConvite() {
  return useMutation<AceitarConviteResult, Error, AceitarConviteInput>({
    mutationFn: ({ token, nome, senha }) =>
      api.post<AceitarConviteResult>(
        `/convite/${token}/aceitar`,
        { nome, senha },
        { skipRefresh: true },
      ),
  });
}
