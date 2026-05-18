import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

export function useAgendamentoAtual() {
  const { barbearia } = useAuth();

  return useQuery<AgendamentoResponse | null>({
    queryKey: ["agendamento-atual", barbearia?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<AgendamentoResponse | null>(
        "/agendamentos/atual",
      ),
    enabled: !!barbearia,
    staleTime: 30_000,
  });
}
