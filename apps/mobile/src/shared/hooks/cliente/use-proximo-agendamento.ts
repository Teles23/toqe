import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

export function useProximoAgendamento() {
  const { barbearia } = useAuth();

  return useQuery<AgendamentoResponse | null>({
    queryKey: ["proximo-agendamento", barbearia?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<AgendamentoResponse | null>(
        "/agendamentos/proximo",
      ),
    enabled: !!barbearia,
    staleTime: 60_000,
  });
}
