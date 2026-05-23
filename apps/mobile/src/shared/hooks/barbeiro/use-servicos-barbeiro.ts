import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { ServicoBarbeiroResponse } from "@toqe/shared";

/**
 * Lista consolidada dos serviços sob a ótica do barbeiro autenticado:
 * serviços ativos da barbearia + os exclusivos dele, com preço/duração efetivos
 * e o estado `ativo` (se ele realiza ou não).
 *
 * Endpoint: GET /servicos/barbeiro/:barbeiroId  (x-tenant-id no header)
 */
export function useServicosBarbeiro() {
  const { barbearia, user } = useAuth();

  return useQuery<ServicoBarbeiroResponse[]>({
    queryKey: ["servicos-barbeiro", barbearia?.codigo, user?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<ServicoBarbeiroResponse[]>(
        `/servicos/barbeiro/${user!.codigo}`,
      ),
    enabled: !!barbearia && !!user,
    staleTime: 5 * 60_000,
  });
}
