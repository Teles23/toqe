import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '../../generated/prisma';

@Injectable()
export class TenantContextService {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(
    barCodigo: number,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant', ${barCodigo.toString()}, true)`;
        return fn(tx);
      },
      { timeout: 10_000, maxWait: 5_000 },
    );
  }
}
