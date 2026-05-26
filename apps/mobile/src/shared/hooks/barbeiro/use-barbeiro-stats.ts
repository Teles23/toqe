import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

export interface BarbeiroStats {
  atendimentos: number;
  faturamento: number; // R$ float
  presenca: number; // 0-100 %
  ticketMedio: number; // R$ float
  periodo: string; // ex: "maio · 20 dias"
}

/**
 * Estatísticas mensais do barbeiro logado.
 *
 * Endpoint: GET /me/stats?periodo=mes
 * Header: x-tenant-id
 *
 * Se a API retornar 404/erro, data === undefined (nunca joga).
 * staleTime: 5 min.
 */
export function useBarbeiroStats() {
  const { barbearia } = useAuth();

  return useQuery<BarbeiroStats | undefined>({
    queryKey: ["barbeiro-stats", barbearia?.codigo],
    queryFn: async () => {
      try {
        return await tenantApi(barbearia!.codigo).get<BarbeiroStats>(
          "/me/stats?periodo=mes",
        );
      } catch {
        return undefined;
      }
    },
    enabled: !!barbearia,
    staleTime: 5 * 60_000,
  });
}
