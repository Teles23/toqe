import { AsyncLocalStorage } from 'async_hooks';

interface TenantCtx {
  barCodigo: number;
  inTx?: boolean;
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

  static get(): TenantCtx | undefined {
    return storage.getStore();
  }
}
