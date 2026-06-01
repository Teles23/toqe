import { AsyncLocalStorage } from 'async_hooks';

interface TenantCtx {
  barCodigo?: number;
  inTx?: boolean;
  isAdmin?: boolean;
}

const storage = new AsyncLocalStorage<TenantCtx>();

export class TenantStore {
  /** Executa fn dentro do contexto do tenant barCodigo. */
  static run<T>(barCodigo: number, fn: () => T): T {
    return storage.run({ barCodigo }, fn);
  }

  /** Como run(), mas sinaliza que já estamos dentro de uma transação com
   *  set_config ativo — o hook do Prisma pula o auto-wrap por SAVEPOINT. */
  static runInTx<T>(barCodigo: number, fn: () => T): T {
    return storage.run({ barCodigo, inTx: true }, fn);
  }

  /** Bypass de RLS para processos cross-tenant (cron, jobs). Injeta
   *  app.bypass_rls=true em vez de app.current_tenant. */
  static runAdmin<T>(fn: () => T): T {
    return storage.run({ isAdmin: true }, fn);
  }

  static get(): TenantCtx | undefined {
    return storage.getStore();
  }
}
