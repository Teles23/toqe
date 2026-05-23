import { useMutation } from "@tanstack/react-query";

import { api } from "@/src/shared/api/api-client";
import { TokenStorage } from "@/src/shared/lib/secure-storage";
import type { ChangePasswordInput } from "@toqe/contracts";

/** O caller informa só as senhas; o refreshToken da sessão é anexado aqui. */
type MudarSenhaInput = Pick<ChangePasswordInput, "senhaAtual" | "novaSenha">;

/**
 * Altera a senha do usuário logado.
 * Endpoint: POST /auth/change-password
 *
 * Anexa o refresh token da sessão atual ao payload: o backend revoga apenas as
 * OUTRAS sessões (outros dispositivos) e mantém a atual ativa — trocar a senha
 * não deve deslogar quem fez a troca.
 *
 * `skipRefresh: true` impede que um 401 dessa rota dispare o interceptor de
 * refresh (que, ao falhar, deslogaria o usuário). Senha atual incorreta retorna
 * 400 — a tela trata isso como erro de campo, sem logout.
 */
export function useMudarSenha() {
  return useMutation({
    mutationFn: async (dto: MudarSenhaInput) => {
      const refreshToken = (await TokenStorage.getRefreshToken()) ?? undefined;
      return api.post<{ message: string }>(
        "/auth/change-password",
        { ...dto, refreshToken },
        { skipRefresh: true },
      );
    },
  });
}
