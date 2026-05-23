import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

export interface CriarServicoExclusivoInput {
  nome: string;
  precoBase: number;
  duracaoBase: number;
  descricao?: string;
}

/**
 * Cria um serviço EXCLUSIVO do barbeiro autenticado.
 *
 * Endpoint: POST /servicos/barbeiro/:barbeiroId { nome, precoBase, duracaoBase }
 * 403 quando o dono não permite (barbeiroCriaServico=false); 409 em nome duplicado.
 * onSuccess: invalida ['servicos-barbeiro'].
 */
export function useCriarServicoExclusivo() {
  const { barbearia, user } = useAuth();
  const qc = useQueryClient();

  return useMutation<unknown, Error, CriarServicoExclusivoInput>({
    mutationFn: (dto) =>
      tenantApi(barbearia!.codigo).post(
        `/servicos/barbeiro/${user!.codigo}`,
        dto,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos-barbeiro"] });
    },
  });
}
