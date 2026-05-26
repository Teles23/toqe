import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { StatusAgendamento } from "@toqe/shared";

type UpdatableStatus = Exclude<StatusAgendamento, "pendente">;

interface UpdateStatusInput {
  codigo: number;
  status: UpdatableStatus;
}

/**
 * Atualiza o status de um agendamento.
 * Endpoint: PATCH /agendamentos/:codigo/status
 * Status aceitos pela API: confirmado | cancelado | concluido | no_show
 */
export function useUpdateStatus() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ codigo, status }: UpdateStatusInput) =>
      tenantApi(barbearia!.codigo).patch(`/agendamentos/${codigo}/status`, {
        status,
      }),
    onSuccess: () => {
      // Atualiza tanto a lista do dia (["agendamentos"]) quanto a fila de
      // walk-ins (["fila"]): ao "Atender →", o encaixe sai da fila e reaparece
      // como EM_ANDAMENTO na agenda. Espelha use-criar-walk-in.
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
      qc.invalidateQueries({ queryKey: ["fila"] });
    },
  });
}
