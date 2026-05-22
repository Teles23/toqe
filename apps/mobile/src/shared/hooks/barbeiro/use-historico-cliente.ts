import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

/**
 * Histórico de agendamentos concluídos de um cliente específico.
 * O filtro por clienteId é feito no backend — não carrega toda a barbearia.
 */
export function useHistoricoCliente(clienteId: number, enabled: boolean) {
  const { barbearia } = useAuth();

  return useQuery<AgendamentoResponse[]>({
    queryKey: ["historico-cliente", barbearia?.codigo, clienteId],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<AgendamentoResponse[]>(
        `/agendamentos?status=concluido&clienteId=${clienteId}`,
      ),
    enabled: enabled && !!barbearia && !!clienteId,
    staleTime: 2 * 60_000,
  });
}
