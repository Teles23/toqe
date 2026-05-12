/**
 * api-client.ts
 * Cliente HTTP centralizado para o portal Toqe.
 *
 * Responsabilidades:
 *  - Anexa Authorization: Bearer <access_token> em toda request autenticada
 *  - Anexa x-tenant-id: <barCodigo> em rotas de tenant
 *  - Em 401 → tenta refresh automático → retry da request original
 *  - Em 401 após retry → redireciona para /login
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API error ${status}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  /** Incluir header Authorization (padrão: true) */
  auth?: boolean;
  /** Código da barbearia para header x-tenant-id */
  tenantId?: number | string;
  /** Headers extras */
  headers?: Record<string, string>;
  /** AbortSignal para cancelamento */
  signal?: AbortSignal;
  /**
   * Em 401 sem refresh, redirecionar para /login (padrão: true).
   * Use `false` em checagens proativas de sessão (ex: AuthProvider em rotas públicas).
   */
  redirectOn401?: boolean;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

/**
 * Lê o access_token armazenado em cookie de sessão (setado pelo BFF).
 * No client-side usamos document.cookie; no server-side usamos cookies() do Next.js.
 */
function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : null;
}

/**
 * Chama o BFF de refresh e obtém novos tokens (rotaciona o cookie httpOnly).
 * Retorna true se conseguiu, false caso contrário.
 */
let _refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  // Evita chamadas paralelas de refresh (race condition)
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<T> {
  const { auth = true, tenantId, headers: extraHeaders = {}, signal, redirectOn401 = true } = opts;

  const buildHeaders = (token: string | null): HeadersInit => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    if (auth && token) h['Authorization'] = `Bearer ${token}`;
    if (tenantId !== undefined) h['x-tenant-id'] = String(tenantId);
    return h;
  };

  const execute = async (token: string | null): Promise<Response> =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: buildHeaders(token),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

  let token = getAccessToken();
  let res = await execute(token);

  // 401 → tenta refresh e retry uma vez
  if (res.status === 401 && auth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      token = getAccessToken();
      res = await execute(token);
    }
  }

  // Ainda 401 após retry → redireciona para login (se permitido)
  if (res.status === 401 && auth) {
    if (redirectOn401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError(401, null, 'Sessão expirada');
  }

  // Respostas sem body (204, 205)
  if (res.status === 204 || res.status === 205) {
    return undefined as unknown as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data as { message?: string })?.message ??
      `Erro ${res.status}`;
    throw new ApiError(res.status, data, message);
  }

  return data as T;
}

// ─── API pública ──────────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, opts);
  },

  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return request<T>('POST', path, body, opts);
  },

  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return request<T>('PUT', path, body, opts);
  },

  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, body, opts);
  },

  delete<T>(path: string, opts?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, undefined, opts);
  },
};

// ─── Helpers de rota com tenant ────────────────────────────────────────────────

/**
 * Cria um sub-objeto do api com tenantId já fixado,
 * para não precisar passar em cada chamada.
 *
 * Exemplo:
 *   const t = tenantApi(barbearia.codigo)
 *   const servicos = await t.get<ServicoResponse[]>('/servicos')
 */
export function tenantApi(barCodigo: number | string) {
  const opts = (extra?: RequestOptions): RequestOptions => ({
    ...extra,
    tenantId: barCodigo,
  });

  return {
    get<T>(path: string, extra?: RequestOptions): Promise<T> {
      return api.get<T>(path, opts(extra));
    },
    post<T>(path: string, body?: unknown, extra?: RequestOptions): Promise<T> {
      return api.post<T>(path, body, opts(extra));
    },
    put<T>(path: string, body?: unknown, extra?: RequestOptions): Promise<T> {
      return api.put<T>(path, body, opts(extra));
    },
    patch<T>(path: string, body?: unknown, extra?: RequestOptions): Promise<T> {
      return api.patch<T>(path, body, opts(extra));
    },
    delete<T>(path: string, extra?: RequestOptions): Promise<T> {
      return api.delete<T>(path, opts(extra));
    },
  };
}
