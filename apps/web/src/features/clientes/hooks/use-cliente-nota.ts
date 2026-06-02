"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "@/shared/api/api-client";

interface NotaResponse {
  conteudo: string;
  atualizadoEm: string | null;
}

export function useClienteNota(
  barCodigo: number | null,
  clienteCodigo: number,
) {
  const queryClient = useQueryClient();
  const key = ["cliente-nota", barCodigo, clienteCodigo];

  const query = useQuery<NotaResponse>({
    queryKey: key,
    queryFn: () =>
      tenantApi(barCodigo!).get<NotaResponse>(
        `/clientes/${clienteCodigo}/nota`,
      ),
    enabled: !!barCodigo,
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: (conteudo: string) =>
      tenantApi(barCodigo!).put<NotaResponse>(
        `/clientes/${clienteCodigo}/nota`,
        { conteudo },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return {
    nota: query.data?.conteudo ?? "",
    isLoading: query.isLoading,
    salvar: mutation.mutate,
    isSalvando: mutation.isPending,
  };
}
