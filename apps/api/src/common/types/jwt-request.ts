export interface JwtRequest {
  user: { sub: number };
}

export interface TenantRequest {
  user: { sub: number; perfil?: string; barCodigo?: number };
  params: Record<string, string | undefined>;
  body: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  runInTenant?: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
}
