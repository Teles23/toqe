import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

export function useMeusAtendimentos(limit = 20) {
  const { barbearia } = useAuth();

  return useQuery<AgendamentoResponse[]>({
    queryKey: ["meus-atendimentos", barbearia?.codigo, limit],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<AgendamentoResponse[]>(
        `/agendamentos/meus-atendimentos?limit=${limit}`,
      ),
    enabled: !!barbearia,
    staleTime: 60_000,
  });
}
