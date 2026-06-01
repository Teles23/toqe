import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import type { Prisma } from '../../generated/prisma';
import type { TenantRequest } from '../../common/types/jwt-request';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantCtx: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<TenantRequest>();
    // Tenant only from URL params or header — never from body (prevents parameter tampering)
    const barCodigo =
      req.params?.['barCodigo'] ??
      (req.headers?.['x-tenant-id'] as string | undefined);

    if (barCodigo) {
      req.runInTenant = <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) =>
        this.tenantCtx.run(Number(barCodigo), fn);
    }

    return next.handle();
  }
}
