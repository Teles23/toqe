import type { Prisma } from '../../generated/prisma';

export interface JwtRequest {
  user: { sub: number };
}

export interface TenantRequest {
  user: {
    sub: number;
    email?: string;
    perfil?: string;
    barCodigo?: number;
    superAdmin?: boolean;
  };
  params: Record<string, string | undefined>;
  body: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  runInTenant?: <T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ) => Promise<T>;
}
