"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { barbeariaApi, api } from "@/shared/api/api-client";
import { STALE_TIME } from "@/shared/lib/constants";

export interface PlanoConfig {
  plano: string;
  planoStatus: string;
  planoValidoAte: string | null;
  trialFim: string | null;
}

const PLANO_QUERY_KEY = (barCodigo: number) =>
  ["configuracoes", "plano", barCodigo] as const;

export function useConfiguracaoPlano(barCodigo: number | null) {
  return useQuery<PlanoConfig>({
    queryKey: PLANO_QUERY_KEY(barCodigo ?? 0),
    queryFn: () =>
      barbeariaApi(barCodigo!).get<PlanoConfig>(`/barbearias/${barCodigo}`),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
    select: (data) => ({
      plano: data.plano,
      planoStatus: data.planoStatus,
      planoValidoAte: data.planoValidoAte,
      trialFim: data.trialFim,
    }),
  });
}

export function useCheckout(barCodigo: number | null) {
  return useMutation({
    mutationFn: (plano: string) =>
      api.post<{ url: string }>(
        `/asaas/checkout/${barCodigo}`,
        { plano },
        { tenantId: barCodigo ?? undefined },
      ),
  });
}
