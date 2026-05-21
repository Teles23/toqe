import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

// TODO: O endpoint PUT /servicos/:codigo requer perfil dono/gerente.
// Quando existir um endpoint de vínculo barbeiro-serviço (ex: PATCH /servicos/:codigo/barbeiro),
// atualizar este hook para usar o endpoint correto.
// Por enquanto, usa PUT /servicos/:codigo com apenas { ativo } — funciona para donos/gerentes.

export interface ToggleServicoInput {
  codigo: number;
  ativo: boolean;
}

interface ServicoAtualizado {
  codigo: number;
  ativo: boolean;
}

/**
 * Ativa ou desativa um serviço da barbearia.
 *
 * Endpoint: PUT /servicos/:codigo
 * Header: x-tenant-id = barbearia.codigo
 * Body: { ativo: boolean }
 *
 * onSuccess: invalida queryKey ['servicos'] para refletir a mudança.
 */
export function useToggleServico() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation<ServicoAtualizado, Error, ToggleServicoInput>({
    mutationFn: ({ codigo, ativo }) =>
      tenantApi(barbearia!.codigo).put<ServicoAtualizado>(
        `/servicos/${codigo}`,
        { ativo },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
    },
  });
}
