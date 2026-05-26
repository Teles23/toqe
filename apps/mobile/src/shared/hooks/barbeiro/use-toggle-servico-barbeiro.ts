import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

export interface ToggleServicoBarbeiroInput {
  srvCodigo: number;
  ativo: boolean;
}

/**
 * Liga/desliga um serviço para o barbeiro autenticado.
 *
 * Endpoint: PATCH /servicos/barbeiro/:barbeiroId/:srvCodigo  { ativo }
 * onSuccess: invalida ['servicos-barbeiro'].
 */
export function useToggleServicoBarbeiro() {
  const { barbearia, user } = useAuth();
  const qc = useQueryClient();

  return useMutation<unknown, Error, ToggleServicoBarbeiroInput>({
    mutationFn: ({ srvCodigo, ativo }) =>
      tenantApi(barbearia!.codigo).patch(
        `/servicos/barbeiro/${user!.codigo}/${srvCodigo}`,
        { ativo },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos-barbeiro"] });
    },
  });
}
