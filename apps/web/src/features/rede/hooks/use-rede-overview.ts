"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE_TIME } from "@/shared/lib/constants";
import { fetchRedeOverview } from "../services/rede.service";
import type { RedeOverview } from "../types/rede.types";

export function useRedeOverview() {
  return useQuery<RedeOverview>({
    queryKey: ["rede", "overview"],
    queryFn: fetchRedeOverview,
    staleTime: STALE_TIME.REALTIME,
    refetchInterval: 60_000,
  });
}
