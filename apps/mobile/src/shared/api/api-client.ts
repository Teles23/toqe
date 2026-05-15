import Constants from "expo-constants";
import { router } from "expo-router";

import { TokenStorage } from "@/src/shared/lib/secure-storage";

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  /** Código da barbearia ativa (multi-tenant) */
  tenantId?: number;
  /** Não tenta refresh automático em 401 */
  skipRefresh?: boolean;
}

async function buildHeaders(tenantId?: number): Promise<HeadersInit> {
  const token = await TokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (tenantId !== undefined) {
    headers["x-tenant-id"] = String(tenantId);
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    // 204 No Content
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }

  throw new ApiError(res.status, `HTTP ${res.status}: ${res.url}`, body);
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = await TokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };
    await TokenStorage.saveTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<T> {
  const headers = await buildHeaders(opts.tenantId);

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !opts.skipRefresh) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Retry com novo token
      const retryHeaders = await buildHeaders(opts.tenantId);
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (retryRes.status === 401) {
        // Refresh não resolveu — sessão expirada
        await TokenStorage.clearTokens();
        router.replace("/(auth)/login");
        throw new ApiError(401, "Sessão expirada. Faça login novamente.");
      }
      return handleResponse<T>(retryRes);
    } else {
      await TokenStorage.clearTokens();
      router.replace("/(auth)/login");
      throw new ApiError(401, "Sessão expirada. Faça login novamente.");
    }
  }

  return handleResponse<T>(res);
}

export const api = {
  get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return request<T>("GET", path, undefined, opts);
  },

  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return request<T>("POST", path, body, opts);
  },

  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return request<T>("PUT", path, body, opts);
  },

  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return request<T>("PATCH", path, body, opts);
  },

  delete<T>(path: string, opts?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, undefined, opts);
  },
};

/** Helper para rotas de tenant — anexa x-tenant-id automaticamente */
export function tenantApi(tenantId: number) {
  return {
    get<T>(path: string): Promise<T> {
      return api.get<T>(path, { tenantId });
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return api.post<T>(path, body, { tenantId });
    },
    put<T>(path: string, body?: unknown): Promise<T> {
      return api.put<T>(path, body, { tenantId });
    },
    patch<T>(path: string, body?: unknown): Promise<T> {
      return api.patch<T>(path, body, { tenantId });
    },
    delete<T>(path: string): Promise<T> {
      return api.delete<T>(path, { tenantId });
    },
  };
}
