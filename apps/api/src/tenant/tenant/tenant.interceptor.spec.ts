import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of, firstValueFrom } from 'rxjs';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { TenantStore } from '../tenant-store';

const mockTenantCtx = {
  run: jest.fn(),
} as unknown as TenantContextService;

function makeContext(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

const mockNext: CallHandler = { handle: jest.fn(() => of('ok')) };

describe('TenantInterceptor', () => {
  let interceptor: TenantInterceptor;

  beforeEach(() => {
    interceptor = new TenantInterceptor(mockTenantCtx);
    jest.clearAllMocks();
  });

  it('injeta runInTenant quando barCodigo esta em params', () => {
    const req = { params: { barCodigo: '3' }, body: {}, headers: {} };
    interceptor.intercept(makeContext(req), mockNext);

    expect(req).toHaveProperty('runInTenant');
    expect(typeof (req as Record<string, unknown>)['runInTenant']).toBe(
      'function',
    );
  });

  it('nao injeta runInTenant via body (evita parameter tampering)', () => {
    const req = { params: {}, body: { barCodigo: '5' }, headers: {} };
    interceptor.intercept(makeContext(req), mockNext);

    expect(req).not.toHaveProperty('runInTenant');
  });

  it('injeta runInTenant quando barCodigo esta nos headers', () => {
    const req = { params: {}, body: {}, headers: { 'x-tenant-id': '7' } };
    interceptor.intercept(makeContext(req), mockNext);

    expect(req).toHaveProperty('runInTenant');
  });

  it('nao injeta runInTenant quando nao ha barCodigo', () => {
    const req = { params: {}, body: {}, headers: {} };
    interceptor.intercept(makeContext(req), mockNext);

    expect(req).not.toHaveProperty('runInTenant');
  });

  it('runInTenant chama tenantCtx.run com o codigo correto', () => {
    const req = { params: { barCodigo: '9' }, body: {}, headers: {} };
    interceptor.intercept(makeContext(req), mockNext);

    const runInTenant = (req as Record<string, unknown>)['runInTenant'] as (
      fn: unknown,
    ) => unknown;
    const fn = jest.fn();
    runInTenant(fn);

    expect(mockTenantCtx.run).toHaveBeenCalledWith(9, fn);
  });

  it('chama next.handle e retorna o observable', (done) => {
    const req = { params: {}, body: {}, headers: {} };
    const obs = interceptor.intercept(makeContext(req), mockNext);

    obs.subscribe({
      next: (val) => {
        expect(val).toBe('ok');
        done();
      },
    });
    expect(mockNext.handle).toHaveBeenCalled();
  });

  it('propaga barCodigo no TenantStore durante a execucao do observable', async () => {
    const req = { params: { barCodigo: '42' }, body: {}, headers: {} };
    let capturedBc: number | undefined;

    const capturingNext: CallHandler = {
      handle: () =>
        new Observable((sub) => {
          capturedBc = TenantStore.get()?.barCodigo;
          sub.next(null);
          sub.complete();
        }),
    };

    const obs = interceptor.intercept(makeContext(req), capturingNext);
    await firstValueFrom(obs);

    expect(capturedBc).toBe(42);
  });

  it('nao seta TenantStore quando nao ha barCodigo', async () => {
    const req = { params: {}, body: {}, headers: {} };
    let capturedBc: number | undefined;

    const capturingNext: CallHandler = {
      handle: () =>
        new Observable((sub) => {
          capturedBc = TenantStore.get()?.barCodigo;
          sub.next(null);
          sub.complete();
        }),
    };

    const obs = interceptor.intercept(makeContext(req), capturingNext);
    await firstValueFrom(obs);

    expect(capturedBc).toBeUndefined();
  });

  it('injeta runInTenant quando barCodigo vem de apiKeyBarCodigo', () => {
    const req = { params: {}, body: {}, headers: {}, apiKeyBarCodigo: 11 };
    interceptor.intercept(makeContext(req), mockNext);

    expect(req).toHaveProperty('runInTenant');
  });

  it('propaga barCodigo via apiKeyBarCodigo no TenantStore', async () => {
    const req = { params: {}, body: {}, headers: {}, apiKeyBarCodigo: 11 };
    let capturedBc: number | undefined;

    const capturingNext: CallHandler = {
      handle: () =>
        new Observable((sub) => {
          capturedBc = TenantStore.get()?.barCodigo;
          sub.next(null);
          sub.complete();
        }),
    };

    const obs = interceptor.intercept(makeContext(req), capturingNext);
    await firstValueFrom(obs);

    expect(capturedBc).toBe(11);
  });
});
