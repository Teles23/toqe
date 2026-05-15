"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS, STALE_TIME } from "@/shared/lib/constants";
import { fetchDashboardOverview } from "../services/dashboard.service";
import type { DashboardOverview } from "../types/dashboard.types";

export function useDashboardOverview(barCodigo: number | null) {
  return useQuery<DashboardOverview>({
    queryKey: QUERY_KEYS.dashboard(barCodigo ?? 0),
    queryFn: () => fetchDashboardOverview(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.REALTIME,
    refetchInterval: 60_000,
  });
}
