import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantCtx: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    // O tenant ID é extraído de parâmetros, body ou header
    const barCodigo =
      req.params.barCodigo ?? req.body.barCodigo ?? req.headers['x-tenant-id'];

    if (barCodigo) {
      // Injeta a função runInTenant no request
      req.runInTenant = <T>(
        fn: (tx: Prisma.TransactionClient) => Promise<T>,
      ) => this.tenantCtx.run(Number(barCodigo), fn);
    }

    return next.handle();
  }
}
