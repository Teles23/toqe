import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { TenantStore } from '../tenant-store';
import type { Prisma } from '../../generated/prisma';
import type { TenantRequest } from '../../common/types/jwt-request';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantCtx: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<TenantRequest>();
    // Tenant only from URL params or header — never from body (prevents parameter tampering).
    // Falls back to apiKeyBarCodigo set by ApiKeyGuard for api-publica routes.
    const barCodigo =
      req.params?.['barCodigo'] ??
      (req.headers?.['x-tenant-id'] as string | undefined) ??
      req.apiKeyBarCodigo?.toString();

    if (!barCodigo) return next.handle();

    const bc = Number(barCodigo);

    // Backward compat: api-publica usa req.runInTenant para transações explícitas.
    req.runInTenant = <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) =>
      this.tenantCtx.run(bc, fn);

    // Propaga o barCodigo via AsyncLocalStorage para todo o chain de Promises
    // desta requisição — o hook do PrismaService injeta set_config automaticamente
    // para as queries tenant-scoped com FORCE ROW LEVEL SECURITY.
    return new Observable((observer) => {
      TenantStore.run(bc, () => {
        next.handle().subscribe({
          next: (v) => observer.next(v),
          error: (e) => observer.error(e),
          complete: () => observer.complete(),
        });
      });
    });
  }
}
