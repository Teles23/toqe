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

function getErrorMessageFromBody(body: unknown): string | undefined {
  if (typeof body === "string" && body.trim().length > 0) {
    return body;
  }

  if (!body || typeof body !== "object") {
    return undefined;
  }

  const maybeBody = body as { message?: unknown; error?: unknown };
  if (typeof maybeBody.message === "string" && maybeBody.message.length > 0) {
    return maybeBody.message;
  }

  if (Array.isArray(maybeBody.message) && maybeBody.message.length > 0) {
    return maybeBody.message.join("\n");
  }

  if (typeof maybeBody.error === "string" && maybeBody.error.length > 0) {
    return maybeBody.error;
  }

  return undefined;
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

  throw new ApiError(
    res.status,
    getErrorMessageFromBody(body) ?? `HTTP ${res.status}: ${res.url}`,
    body,
  );
}

// Dedup de refresh: se múltiplas requests 401 chegarem simultaneamente,
// todas aguardam o MESMO POST /auth/refresh em voo (single-flight).
// Evita race condition que invalidaria o refresh token recém-emitido.
let inflightRefresh: Promise<boolean> | null = null;

async function refreshTokensInternal(): Promise<boolean> {
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

async function refreshTokens(): Promise<boolean> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = refreshTokensInternal().finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
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

async function requestFormData<T>(
  path: string,
  formData: FormData,
  opts: RequestOptions = {},
): Promise<T> {
  const token = await TokenStorage.getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (opts.tenantId !== undefined)
    headers["x-tenant-id"] = String(opts.tenantId);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401 && !opts.skipRefresh) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const retryToken = await TokenStorage.getAccessToken();
      const retryHeaders: Record<string, string> = {};
      if (retryToken) retryHeaders["Authorization"] = `Bearer ${retryToken}`;
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: retryHeaders,
        body: formData,
      });
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

  postFormData<T>(
    path: string,
    formData: FormData,
    opts?: RequestOptions,
  ): Promise<T> {
    return requestFormData<T>(path, formData, opts);
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
