import { useMutation } from "@tanstack/react-query";

import { api } from "@/src/shared/api/api-client";

export interface AceitarConviteInput {
  token: string;
  nome?: string;
  senha?: string;
}

export interface AceitarConviteResult {
  access_token: string;
  refresh_token: string;
  user: { codigo: number; nome: string; email: string };
  isNew: boolean;
  barbeariaNome: string;
}

/**
 * Aceita um convite de barbearia, vincula o usuário e faz **auto-login**:
 * o backend retorna access/refresh tokens (a posse do link é a prova de
 * identidade). O chamador usa `establishSession(tokens)` para entrar.
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
