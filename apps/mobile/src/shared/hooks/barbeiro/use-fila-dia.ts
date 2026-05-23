import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";

/**
 * Lista os walk-ins (tipo=WALK_IN) na fila para uma data específica.
 *
 * Endpoint:
 *   GET /agendamentos?data=YYYY-MM-DD&tipo=WALK_IN[&barbeiroId=X&barbeiroCompativel=true]
 * Header obrigatório: x-tenant-id (código da barbearia ativa)
 *
 * A fila não tem barbeiro designado — qualquer um compatível atende. Quando um
 * `barbeiroId` é informado, anexa `barbeiroCompativel=true`: o backend então
 * trata o `barbeiroId` como "compatível com este barbeiro" (exclui encaixes com
 * serviço que o barbeiro desativou) em vez de "designado a este barbeiro".
 *
 * @param data data alvo (default: hoje)
 * @param barbeiroId opcional — filtra a fila por compatibilidade deste barbeiro
 */
export function useFilaDia(data: Date = new Date(), barbeiroId?: number) {
  const { barbearia } = useAuth();
  const dataStr = format(data, "yyyy-MM-dd");

  return useQuery<AgendamentoResponse[]>({
    queryKey: ["fila", barbearia?.codigo, barbeiroId ?? null, dataStr],
    queryFn: () => {
      const params = new URLSearchParams({ data: dataStr, tipo: "WALK_IN" });
      if (barbeiroId) {
        params.set("barbeiroId", String(barbeiroId));
        params.set("barbeiroCompativel", "true");
      }
      return tenantApi(barbearia!.codigo).get<AgendamentoResponse[]>(
        `/agendamentos?${params.toString()}`,
      );
    },
    enabled: !!barbearia,
    staleTime: 30_000, // fila muda mais rápido que agenda (30s)
  });
}
