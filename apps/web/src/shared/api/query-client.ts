import { QueryClient } from "@tanstack/react-query";

/**
 * Configuração padrão do TanStack Query para o app `web`.
 *
 * Decisões:
 * - `staleTime` curto (30s) para dados de tela "ao vivo" (dashboard, agenda).
 *   Hooks específicos podem sobrescrever via opções do `useQuery`.
 * - `gcTime` (antes `cacheTime`) de 5min — equilibra memória vs. revalidação.
 * - `retry`: 1 tentativa para queries; 0 para mutations (deixa o caller decidir).
 * - `refetchOnWindowFocus` desabilitado por padrão para não bombardear a API
 *   ao voltar para a aba; rotas que dependem de freshness podem ativar.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
