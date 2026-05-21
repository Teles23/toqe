import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

interface AvaliarAgendamentoInput {
  codigo: number;
  nota: number;
  comentario?: string;
}

/**
 * Envia avaliação de um agendamento concluído.
 * Endpoint: POST /agendamentos/:codigo/avaliacao
 * Body: { nota: number; comentario?: string }
 */
export function useAvaliarAgendamento() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ codigo, nota, comentario }: AvaliarAgendamentoInput) =>
      tenantApi(barbearia!.codigo).post(`/agendamentos/${codigo}/avaliacao`, {
        nota,
        comentario,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
      qc.invalidateQueries({ queryKey: ["agendamento"] });
      qc.invalidateQueries({ queryKey: ["agendamentos-meus"] });
    },
  });
}
