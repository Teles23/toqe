import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

interface ReagendarInput {
  codigo: number;
  inicio: string;
  fim?: string;
}

export function useReagendarAgendamento() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ codigo, inicio, fim }: ReagendarInput) =>
      tenantApi(barbearia!.codigo).patch(
        `/agendamentos/${codigo}/reagendar`,
        { inicio, fim },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
      qc.invalidateQueries({ queryKey: ["agendamento"] });
      qc.invalidateQueries({ queryKey: ["agendamentos-meus"] });
    },
  });
}
