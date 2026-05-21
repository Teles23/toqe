"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminRevenue } from "../services/admin.service";

export function useAdminRevenue() {
  return useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: fetchAdminRevenue,
    staleTime: 60_000,
  });
}
