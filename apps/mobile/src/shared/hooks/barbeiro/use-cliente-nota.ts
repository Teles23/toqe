import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

export interface ClienteNota {
  conteudo: string;
  atualizadoEm: string | null;
}

/**
 * Nota privada do barbeiro logado sobre um cliente (slide 13).
 *
 * GET `/clientes/:clienteId/nota` — o barbeiro é o usuário logado (backend usa
 * `req.user.sub`), escopo de barbearia via `x-tenant-id`. Lazy: só busca quando
 * `enabled` (modal de detalhe aberto).
 */
export function useClienteNota(clienteId: number, enabled: boolean) {
  const { barbearia } = useAuth();

  return useQuery<ClienteNota>({
    queryKey: ["cliente-nota", barbearia?.codigo, clienteId],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<ClienteNota>(
        `/clientes/${clienteId}/nota`,
      ),
    enabled: enabled && !!barbearia && !!clienteId,
    staleTime: 60_000,
  });
}

/**
 * Salva (upsert) ou remove (conteúdo vazio) a nota. Atualiza o cache da query
 * `['cliente-nota', ...]` no sucesso.
 */
export function useSalvarNotaCliente(clienteId: number) {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation<ClienteNota, Error, string>({
    mutationFn: (conteudo) =>
      tenantApi(barbearia!.codigo).put<ClienteNota>(
        `/clientes/${clienteId}/nota`,
        { conteudo },
      ),
    onSuccess: (data) => {
      qc.setQueryData(["cliente-nota", barbearia?.codigo, clienteId], data);
    },
  });
}
