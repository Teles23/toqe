import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/shared/api/api-client";

export interface BarbeariaPublica {
  codigo: number;
  nome: string;
  slug: string;
  tema: { logoUrl: string | null } | null;
}

export function useBarbeariasPublico(q?: string) {
  return useQuery<BarbeariaPublica[]>({
    queryKey: ["barbearias-publico", q ?? ""],
    queryFn: () => {
      const params = q ? `?q=${encodeURIComponent(q)}` : "";
      return api.get<BarbeariaPublica[]>(`/barbearias/publico${params}`);
    },
    staleTime: 5 * 60_000,
  });
}
