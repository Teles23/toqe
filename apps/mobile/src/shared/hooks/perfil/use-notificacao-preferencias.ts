import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { UpdatePreferenciasInput } from "@toqe/contracts";

export interface PreferenciasNotificacao {
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  sms: boolean;
}

/**
 * Lê preferências de notificação do user na barbearia ativa.
 * Endpoint: GET /notificacoes/preferencias (com x-tenant-id)
 *
 * Defaults do backend: email=true, push=false, whatsapp=false, sms=false.
 */
export function useNotificacaoPreferencias() {
  const { barbearia } = useAuth();
  return useQuery<PreferenciasNotificacao>({
    queryKey: ["notif-prefs", barbearia?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<PreferenciasNotificacao>(
        "/notificacoes/preferencias",
      ),
    enabled: !!barbearia,
    staleTime: 60_000,
  });
}

/**
 * Atualiza preferências de notificação.
 * Endpoint: PUT /notificacoes/preferencias
 *
 * Implementa atualização otimista: a UI muda imediatamente; se a request
 * falhar, a query é re-buscada e desfaz a mudança.
 */
export function useAtualizarPreferenciasNotificacao() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["notif-prefs", barbearia?.codigo];

  return useMutation({
    mutationFn: (input: UpdatePreferenciasInput) =>
      tenantApi(barbearia!.codigo).put<PreferenciasNotificacao>(
        "/notificacoes/preferencias",
        input,
      ),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<PreferenciasNotificacao>(queryKey);
      qc.setQueryData<PreferenciasNotificacao>(queryKey, input);
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      // Rollback
      if (ctx?.previous) {
        qc.setQueryData(queryKey, ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
}
