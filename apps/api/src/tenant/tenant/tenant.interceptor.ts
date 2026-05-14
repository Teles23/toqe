import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { PrismaClient } from '../../generated/prisma';
import type { TenantRequest } from '../../common/types/jwt-request';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantCtx: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<TenantRequest>();
    const barCodigo =
      req.params['barCodigo'] ??
      (req.body['barCodigo'] as string | undefined) ??
      (req.headers['x-tenant-id'] as string | undefined);

    if (barCodigo) {
      req.runInTenant = <T>(fn: (tx: TransactionClient) => Promise<T>) =>
        this.tenantCtx.run(Number(barCodigo), fn);
    }

    return next.handle();
  }
}
