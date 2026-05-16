import { useQuery } from "@tanstack/react-query";

import { api } from "@/src/shared/api/api-client";

export interface SessaoAtiva {
  codigo: number;
  criadoEm: string; // ISO datetime
  expiraEm: string; // ISO datetime
}

/**
 * Lista sessões ativas (refresh tokens não revogados e não expirados).
 * Endpoint: GET /auth/sessions
 *
 * staleTime curto (30s) — sessões podem mudar quando user faz login em
 * outro device. Refetch automático ao focar tela.
 */
export function useSessoes() {
  return useQuery<SessaoAtiva[]>({
    queryKey: ["sessoes"],
    queryFn: () => api.get<SessaoAtiva[]>("/auth/sessions"),
    staleTime: 30_000,
  });
}
