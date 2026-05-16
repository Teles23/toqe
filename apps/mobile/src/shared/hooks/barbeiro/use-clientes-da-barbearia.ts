import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { ClienteAPI } from "@toqe/contracts";

/**
 * Lista clientes da barbearia ativa com métricas agregadas.
 *
 * Endpoint: GET /barbearias/:barCodigo/clientes
 * Header obrigatório: x-tenant-id (mesmo barCodigo)
 *
 * Retorna ClienteAPI[] — cada item já vem com totalVisitas, totalGasto,
 * ticketMedio, ultimaVisita e servicoFav calculados pelo backend.
 *
 * staleTime 5min — clientes mudam pouco; navegar entre telas não dispara refetch.
 */
export function useClientesDaBarbearia() {
  const { barbearia } = useAuth();

  return useQuery<ClienteAPI[]>({
    queryKey: ["clientes", barbearia?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<ClienteAPI[]>(
        `/barbearias/${barbearia!.codigo}/clientes`,
      ),
    enabled: !!barbearia,
    staleTime: 5 * 60_000,
  });
}
