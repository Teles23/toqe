import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

export interface AtualizarServicoBarbeiroInput {
  srvCodigo: number;
  /** null = volta a usar o preço base da barbearia */
  precoProprio: number | null;
  duracaoMin: number;
}

/**
 * Personaliza preço/duração do barbeiro para um serviço.
 *
 * Endpoint: PUT /servicos/barbeiro/:barbeiroId/:srvCodigo { precoProprio?, duracaoMin }
 * 403 quando o dono não permite (barbeiroAlteraPreco=false).
 * onSuccess: invalida ['servicos-barbeiro'].
 */
export function useAtualizarServicoBarbeiro() {
  const { barbearia, user } = useAuth();
  const qc = useQueryClient();

  return useMutation<unknown, Error, AtualizarServicoBarbeiroInput>({
    mutationFn: ({ srvCodigo, precoProprio, duracaoMin }) =>
      tenantApi(barbearia!.codigo).put(
        `/servicos/barbeiro/${user!.codigo}/${srvCodigo}`,
        { precoProprio, duracaoMin },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos-barbeiro"] });
    },
  });
}
