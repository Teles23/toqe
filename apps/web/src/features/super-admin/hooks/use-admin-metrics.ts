"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminMetrics,
  fetchAdminActivity,
} from "../services/admin.service";

export function useAdminMetrics() {
  return useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: fetchAdminMetrics,
    staleTime: 30_000,
  });
}

export function useAdminActivity() {
  return useQuery({
    queryKey: ["admin", "activity"],
    queryFn: fetchAdminActivity,
    staleTime: 30_000,
    refetchInterval: 60_000, // atualiza a cada 1 minuto
  });
}
