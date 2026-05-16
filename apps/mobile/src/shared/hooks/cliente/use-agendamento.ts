import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

/**
 * Detalhe de um agendamento específico (cliente OU barbearia podem ler).
 * Endpoint: GET /agendamentos/:codigo (com x-tenant-id)
 */
export function useAgendamento(codigo: number) {
  const { barbearia } = useAuth();

  return useQuery<AgendamentoResponse>({
    queryKey: ["agendamento", barbearia?.codigo, codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<AgendamentoResponse>(
        `/agendamentos/${codigo}`,
      ),
    enabled: !!barbearia && !!codigo && codigo > 0,
    staleTime: 60_000,
  });
}

/**
 * Cancela um agendamento (soft delete — status vira CANCELADO).
 * Endpoint: DELETE /agendamentos/:codigo
 *
 * onSuccess: invalida cache do próprio agendamento e listas relacionadas.
 */
export function useCancelarAgendamento() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (codigo: number) =>
      tenantApi(barbearia!.codigo).delete<AgendamentoResponse>(
        `/agendamentos/${codigo}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendamento"] });
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
      qc.invalidateQueries({ queryKey: ["fila"] });
    },
  });
}
