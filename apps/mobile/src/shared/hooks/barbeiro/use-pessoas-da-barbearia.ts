import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { PessoaAPI } from "@toqe/contracts";

/**
 * Lista unificada de clientes (TQE_USR) e contatos de walk-in (TQE_CONTATO).
 *
 * Endpoint: GET /barbearias/:barCodigo/pessoas
 * Discriminador `tipo`: "usuario" | "contato"
 *
 * staleTime 5min — dados mudam pouco; sem refetch em cada navegação.
 */
export function usePessoasDaBarbearia() {
  const { barbearia } = useAuth();

  return useQuery<PessoaAPI[]>({
    queryKey: ["pessoas", barbearia?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<PessoaAPI[]>(
        `/barbearias/${barbearia!.codigo}/pessoas`,
      ),
    enabled: !!barbearia,
    staleTime: 5 * 60_000,
  });
}
