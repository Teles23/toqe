import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

export interface BarbeiroComStats {
  usrCodigo: number;
  nome: string;
  avatarUrl: string | null;
  atendimentosHoje?: number;
  atendimentosMes?: number;
}

/**
 * Lista barbeiros da barbearia ativa (endpoint existente).
 *
 * Endpoint: GET /barbearias/:barCodigo/barbeiros
 * Header: x-tenant-id (mesmo barCodigo)
 *
 * Usado em dropdowns "Atender com:" no walk-in form.
 */
export function useBarbeirosDaBarbearia() {
  const { barbearia } = useAuth();

  return useQuery<BarbeiroComStats[]>({
    queryKey: ["barbearia-barbeiros", barbearia?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<BarbeiroComStats[]>(
        `/barbearias/${barbearia!.codigo}/barbeiros`,
      ),
    enabled: !!barbearia,
    staleTime: 5 * 60_000, // 5min — barbeiros não mudam com frequência
  });
}
