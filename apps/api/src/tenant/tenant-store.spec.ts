import { TenantStore } from './tenant-store';

describe('TenantStore', () => {
  it('run() expoe barCodigo dentro do callback', () => {
    let captured: ReturnType<typeof TenantStore.get> | undefined;
    TenantStore.run(5, () => {
      captured = TenantStore.get();
    });
    expect(captured).toEqual({ barCodigo: 5 });
  });

  it('get() retorna undefined fora de um contexto run()', () => {
    // Sem run() ativo, get() deve ser undefined
    expect(TenantStore.get()).toBeUndefined();
  });

  it('runInTx() expoe barCodigo com inTx=true', () => {
    let captured: ReturnType<typeof TenantStore.get> | undefined;
    TenantStore.runInTx(9, () => {
      captured = TenantStore.get();
    });
    expect(captured).toEqual({ barCodigo: 9, inTx: true });
  });

  it('runAdmin() expoe isAdmin=true sem barCodigo', () => {
    let captured: ReturnType<typeof TenantStore.get> | undefined;
    TenantStore.runAdmin(() => {
      captured = TenantStore.get();
    });
    expect(captured).toEqual({ isAdmin: true });
  });

  it('contextos aninhados sao isolados (inner nao vaza para outer)', () => {
    let outerMid: ReturnType<typeof TenantStore.get> | undefined;
    let innerCtx: ReturnType<typeof TenantStore.get> | undefined;
    TenantStore.run(1, () => {
      TenantStore.run(2, () => {
        innerCtx = TenantStore.get();
      });
      outerMid = TenantStore.get();
    });

    expect(innerCtx?.barCodigo).toBe(2);
    expect(outerMid?.barCodigo).toBe(1);
    expect(TenantStore.get()).toBeUndefined();
  });

  it('propaga contexto atraves de Promises', async () => {
    let captured: ReturnType<typeof TenantStore.get> | undefined;

    await TenantStore.run(42, async () => {
      await Promise.resolve(); // microtask
      captured = TenantStore.get();
    });

    expect(captured?.barCodigo).toBe(42);
  });
});
