"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminTenants,
  updateTenantPlano,
  updateTenantStatus,
} from "../services/admin.service";

export function useAdminTenants(filters?: {
  search?: string;
  plano?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["admin", "tenants", filters],
    queryFn: () => fetchAdminTenants(filters),
    staleTime: 30_000,
  });
}

export function useUpdateTenantPlano() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plano }: { id: number; plano: string }) =>
      updateTenantPlano(id, plano),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useUpdateTenantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateTenantStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}
