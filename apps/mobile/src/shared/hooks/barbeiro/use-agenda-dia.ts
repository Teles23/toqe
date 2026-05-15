import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

/**
 * Lista os agendamentos do barbeiro logado para uma data específica.
 *
 * Endpoint: GET /agendamentos?data=YYYY-MM-DD&barbeiroId=<usrCodigo>
 * Header obrigatório: x-tenant-id (código da barbearia ativa)
 */
export function useAgendaDia(data: Date) {
  const { barbearia, user } = useAuth();
  const dataStr = format(data, "yyyy-MM-dd");

  return useQuery<AgendamentoResponse[]>({
    queryKey: ["agendamentos", barbearia?.codigo, user?.codigo, dataStr],
    queryFn: () => {
      const params = new URLSearchParams({
        data: dataStr,
        barbeiroId: String(user!.codigo),
      });
      return tenantApi(barbearia!.codigo).get<AgendamentoResponse[]>(
        `/agendamentos?${params.toString()}`,
      );
    },
    enabled: !!barbearia && !!user,
    staleTime: 60_000, // 1 min — agenda muda com frequência
  });
}
