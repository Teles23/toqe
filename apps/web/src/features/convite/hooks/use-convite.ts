"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchConvite,
  ConviteServiceError,
  type ConviteData,
} from "@/features/convite/services/convite.service";

/**
 * Carrega os dados públicos de um convite (`GET /convite/:token` via BFF).
 *
 * Em 404/401 (convite inválido ou expirado) retorna `null` em vez de lançar —
 * a tela renderiza o estado "expirado". Outros erros (ex: 500/503) propagam
 * como `isError`, também tratado como "expirado" pela tela.
 */
export function useConvite(token: string | undefined) {
  return useQuery<ConviteData | null>({
    queryKey: ["convite", token],
    queryFn: async () => {
      try {
        return await fetchConvite(token!);
      } catch (err) {
        if (
          err instanceof ConviteServiceError &&
          (err.status === 404 || err.status === 401)
        ) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60_000,
  });
}
