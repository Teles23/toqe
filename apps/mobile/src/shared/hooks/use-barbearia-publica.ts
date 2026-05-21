import { useQuery } from "@tanstack/react-query";

import { api, ApiError } from "@/src/shared/api/api-client";

export interface BarbeariaPublicaDetalhe {
  codigo: number;
  nome: string;
  slug: string;
  descricao: string | null;
  telefone: string | null;
  endereco: string | null;
  ratingMedio: number | null;
  servicoCount: number;
  barbeiros: {
    usrCodigo: number;
    nome: string;
    avatarUrl: string | null;
    especialidade: string | null;
  }[];
  tema: { logoUrl: string | null } | null;
}

export function useBarbeariaPublica(slug: string | undefined) {
  return useQuery<BarbeariaPublicaDetalhe | null>({
    queryKey: ["barbearia-publica", slug ?? ""],
    queryFn: async () => {
      try {
        return await api.get<BarbeariaPublicaDetalhe>(`/publico/${slug}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });
}
