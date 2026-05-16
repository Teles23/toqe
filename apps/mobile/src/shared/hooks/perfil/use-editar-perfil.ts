import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/src/shared/api/api-client";
import type { UpdateUsuarioInput } from "@toqe/contracts";

/**
 * Atualiza dados do usuário logado (nome, telefone, avatarUrl).
 * Endpoint: PUT /usuarios/me
 *
 * onSuccess: invalida cache ['usuario-me'] para que o AuthProvider
 * recarregue (se quiser). Nesta versão a invalidação é cosmética —
 * o auth-provider tem seu próprio loadMe(); a única tela que usa
 * é o próprio perfil.
 */
export function useEditarPerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateUsuarioInput) =>
      api.put<UpdateUsuarioInput>("/usuarios/me", dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuario-me"] });
    },
  });
}
