import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

/** Subconjunto de BarbeariaResponse com as permissões usadas no app barbeiro. */
interface BarbeariaConfig {
  codigo: number;
  barbeiroCriaServico: boolean;
  barbeiroAlteraPreco: boolean;
}

/**
 * Configurações/permissões da barbearia ativa (definidas pelo dono).
 *
 * Endpoint: GET /barbearias/:codigo (retorna o registro completo, inclui as
 * flags de permissão dos barbeiros).
 */
export function useBarbeariaConfig() {
  const { barbearia } = useAuth();

  return useQuery<BarbeariaConfig>({
    queryKey: ["barbearia-config", barbearia?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<BarbeariaConfig>(
        `/barbearias/${barbearia!.codigo}`,
      ),
    enabled: !!barbearia,
    staleTime: 5 * 60_000,
  });
}
