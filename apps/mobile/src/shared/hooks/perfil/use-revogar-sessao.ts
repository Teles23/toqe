import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/src/shared/api/api-client";

/**
 * Revoga uma sessão específica (encerra login em um device).
 * Endpoint: DELETE /auth/sessions/:codigo
 *
 * onSuccess: invalida ['sessoes'] para refletir a lista atualizada.
 */
export function useRevogarSessao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (codigo: number) =>
      api.delete<{ message: string }>(`/auth/sessions/${codigo}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessoes"] });
    },
  });
}

/**
 * Revoga todas as sessões (logout global em outros devices).
 * Endpoint: DELETE /auth/sessions
 */
export function useRevogarTodasSessoes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<{ message: string }>("/auth/sessions"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessoes"] });
    },
  });
}
