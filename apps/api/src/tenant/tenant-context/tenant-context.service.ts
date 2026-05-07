import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantContextService {
  constructor(private readonly prisma: PrismaService) { }

  async run<T>(
    barCodigo: number,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_tenant', $1, true)`,
        barCodigo.toString(),
      );
      return fn(tx);
    });
  }
}
