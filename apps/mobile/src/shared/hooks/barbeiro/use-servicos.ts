import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

export interface ServicoResumo {
  codigo: number;
  nome: string;
  duracaoBase: number;
  precoBase: number;
  ativo: boolean;
}

/**
 * Lista serviços ativos da barbearia (endpoint existente).
 *
 * Endpoint: GET /servicos
 * Header: x-tenant-id
 *
 * Usado em dropdowns de seleção de serviço (walk-in, agendamento).
 */
export function useServicos() {
  const { barbearia } = useAuth();

  return useQuery<ServicoResumo[]>({
    queryKey: ["servicos", barbearia?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<ServicoResumo[]>("/servicos"),
    enabled: !!barbearia,
    staleTime: 5 * 60_000,
    select: (data) => data.filter((s) => s.ativo !== false),
  });
}
