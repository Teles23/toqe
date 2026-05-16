import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

/**
 * Histórico de agendamentos concluídos de um cliente específico.
 *
 * O backend não expõe filtro por clienteId no /agendamentos, então:
 *   1. Buscamos todos os concluídos da barbearia (já indexado por barCodigo)
 *   2. Filtramos no cliente por `cliente.codigo === clienteId`
 *
 * Hook lazy: só dispara quando `enabled=true` (passado pelo modal de detalhe
 * quando abre). Evita carregar lista grande sem necessidade.
 */
export function useHistoricoCliente(clienteId: number, enabled: boolean) {
  const { barbearia } = useAuth();

  return useQuery<AgendamentoResponse[]>({
    queryKey: ["historico-cliente", barbearia?.codigo, clienteId],
    queryFn: async () => {
      const lista = await tenantApi(barbearia!.codigo).get<
        AgendamentoResponse[]
      >(`/agendamentos?status=concluido`);
      return lista.filter((a) => a.cliente?.usrCodigo === clienteId);
    },
    enabled: enabled && !!barbearia && !!clienteId,
    staleTime: 2 * 60_000,
  });
}
