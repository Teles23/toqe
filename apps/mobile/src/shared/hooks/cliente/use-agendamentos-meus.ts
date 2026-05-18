import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

export function useAgendamentosMeus() {
  const { barbearia } = useAuth();

  return useQuery<AgendamentoResponse[]>({
    queryKey: ["agendamentos-meus", barbearia?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<AgendamentoResponse[]>(
        "/agendamentos/meus",
      ),
    enabled: !!barbearia,
    staleTime: 60_000,
  });
}
