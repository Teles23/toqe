import { useMutation } from "@tanstack/react-query";

import { api } from "@/src/shared/api/api-client";
import type { ChangePasswordInput } from "@toqe/contracts";

/**
 * Altera a senha do usuário logado.
 * Endpoint: POST /auth/change-password
 * Validação: senhaAtual obrigatória, novaSenha min 6 chars, ≠ atual (Zod no backend)
 *
 * Backend invalida TODOS os refresh tokens existentes ao alterar a senha
 * (segurança — força logout em outros dispositivos).
 */
export function useMudarSenha() {
  return useMutation({
    mutationFn: (dto: ChangePasswordInput) =>
      api.post<{ message: string }>("/auth/change-password", dto),
  });
}
