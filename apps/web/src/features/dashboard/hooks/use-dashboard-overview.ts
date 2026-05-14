"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/lib/constants";
import { fetchDashboardOverview } from "../services/dashboard.service";
import type { DashboardOverview } from "../types/dashboard.types";

/**
 * Hook de overview do dashboard.
 *
 * Usa TanStack Query — cache automático (staleTime configurado no
 * QueryClient padrão), retry, loading/error states.
 *
 * Enquanto o backend não expõe `/dashboard/overview`, o service
 * retorna mock com latência simulada (~300ms) — o que serve para
 * exercitar o estado de loading no componente.
 */
export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: QUERY_KEYS.dashboard(),
    queryFn: fetchDashboardOverview,
  });
}
