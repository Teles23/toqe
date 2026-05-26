import { api } from "@/shared/api/api-client";
import type {
  AdminMetrics,
  AdminRevenue,
  AdminActivityItem,
  AdminTenant,
} from "../types";

const BASE = "/admin";

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  return api.get(`${BASE}/metrics`);
}

export async function fetchAdminTenants(params?: {
  search?: string;
  plano?: string;
  status?: string;
}): Promise<AdminTenant[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.plano) query.set("plano", params.plano);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return api.get(`${BASE}/barbearias${qs ? `?${qs}` : ""}`);
}

export async function fetchAdminTenantById(id: number): Promise<AdminTenant> {
  return api.get(`${BASE}/barbearias/${id}`);
}

export async function updateTenantPlano(
  id: number,
  plano: string,
): Promise<void> {
  return api.patch(`${BASE}/barbearias/${id}/plano`, { plano });
}

export async function updateTenantStatus(
  id: number,
  status: string,
): Promise<void> {
  return api.patch(`${BASE}/barbearias/${id}/status`, { status });
}

export async function fetchAdminRevenue(): Promise<AdminRevenue> {
  return api.get(`${BASE}/revenue`);
}

export async function fetchAdminActivity(): Promise<AdminActivityItem[]> {
  return api.get(`${BASE}/activity`);
}
