"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE_TIME, QUERY_KEYS } from "@/shared/lib/constants";
import { tenantApi } from "@/shared/api/api-client";

export interface ServicoMetricas {
  totalAtivos: number;
  pedidosMes: number;
  receitaMes: number;
  ticketMedio: number;
}

export function useServicosMetricas(barCodigo: number | null) {
  return useQuery<ServicoMetricas>({
    queryKey: [...QUERY_KEYS.servicos(barCodigo ?? 0), "metricas"],
    queryFn: () =>
      tenantApi(barCodigo!).get<ServicoMetricas>("/servicos/metricas"),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });
}
