import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { TenantStore } from '../tenant/tenant-store';

// Propriedades de lifecycle / meta do PrismaClient que devem continuar
// resolvendo para 'this' (PrismaService) e não para o cliente estendido.
const PRISMA_LIFECYCLE = new Set([
  'pool',
  'constructor',
  '$connect',
  '$disconnect',
  '$on',
  '$extends',
  '$executeRaw',
  '$queryRaw',
  '$executeRawUnsafe',
  '$queryRawUnsafe',
  'onModuleInit',
  'onModuleDestroy',
]);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;

    const base = this as PrismaClient;

    // Cria cliente estendido com hook de RLS.
    // O hook envolve cada operação de model em [set_config, query(args)] quando
    // há um tenant no ALS e não estamos dentro de uma tx com set_config já ativo.
    const extended = base.$extends({
      query: {
        $allModels: {
          async $allOperations({
            args,
            query,
          }: {
            args: unknown;
            query: (a: unknown) => Promise<unknown>;
          }) {
            const ctx = TenantStore.get();
            if (!ctx) return query(args);

            // Processos cross-tenant (cron) usam runAdmin() — injeta bypass_rls.
            if (ctx.isAdmin) {
              const ops = [
                base.$executeRaw`SELECT set_config('app.bypass_rls', 'true', true)`,
                query(args),
              ] as const;
              const results = await base.$transaction(ops as never);
              return (results as [number, unknown])[1];
            }

            if (!ctx.barCodigo || ctx.inTx) return query(args);

            const bc = String(ctx.barCodigo);
            // Array $transaction: Prisma executa as duas PrismaPromises na mesma
            // transação — set_config é transaction-local (is_local=true).
            const ops = [
              base.$executeRaw`SELECT set_config('app.current_tenant', ${bc}, true)`,
              query(args),
            ] as const;
            const results = await base.$transaction(ops as never);
            return (results as [number, unknown])[1];
          },
        },
      },
    });

    // Proxy: acessos a model delegates vão para o cliente estendido (com RLS);
    // métodos de lifecycle e $transaction ficam em 'this' (PrismaService).
    // $transaction também é roteado para o cliente estendido para que o `tx`
    // passado ao callback seja o cliente estendido — o hook dispara para cada
    // tx.model.op() e injeta o set_config automaticamente via SAVEPOINT.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return new Proxy(this, {
      get(_, prop, receiver) {
        if (
          typeof prop === 'string' &&
          !PRISMA_LIFECYCLE.has(prop) &&
          prop in extended
        ) {
          return (extended as Record<string, unknown>)[prop];
        }
        return Reflect.get(self, prop, receiver);
      },
    }) as PrismaService;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
