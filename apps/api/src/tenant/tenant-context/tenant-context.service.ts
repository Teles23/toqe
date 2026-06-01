import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantStore } from '../tenant-store';
import type { Prisma } from '../../generated/prisma';

@Injectable()
export class TenantContextService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa fn dentro de uma transação com set_config('app.current_tenant') ativo.
   * Usado por api-publica.service para agendamentos públicos (sem JWT de barCodigo).
   *
   * O TenantStore.runInTx() sinaliza ao hook do PrismaService que já estamos
   * dentro de uma transação com set_config — evita SAVEPOINTs desnecessários.
   */
  run<T>(
    barCodigo: number,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant', ${barCodigo.toString()}, true)`;
        return TenantStore.runInTx(barCodigo, () => fn(tx));
      },
      { timeout: 10_000, maxWait: 5_000 },
    );
  }
}
