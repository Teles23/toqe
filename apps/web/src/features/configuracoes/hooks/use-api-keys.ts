"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiKey } from "../types/configuracao.types";

const BASE = "/api/v1";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function useApiKeys(barCodigo: number | null) {
  return useQuery<ApiKey[]>({
    queryKey: ["api-keys", barCodigo],
    queryFn: () =>
      fetchJson<ApiKey[]>(`${BASE}/api-keys`, {
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": String(barCodigo),
        },
      }),
    enabled: !!barCodigo,
  });
}

export function useCriarApiKey(barCodigo: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nome: string) =>
      fetchJson<{ key: string; apiKey: ApiKey }>(`${BASE}/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": String(barCodigo),
        },
        body: JSON.stringify({ nome }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-keys", barCodigo] });
    },
  });
}

export function useRevogarApiKey(barCodigo: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (codigo: number) =>
      fetchJson<void>(`${BASE}/api-keys/${codigo}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": String(barCodigo),
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-keys", barCodigo] });
    },
  });
}
