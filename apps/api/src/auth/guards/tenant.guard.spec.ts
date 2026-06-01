import { TenantGuard } from './tenant.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { createPrismaMock } from '../../test/prisma-mock.factory';
import { TenantStore } from '../../tenant/tenant-store';

const mockPrisma = createPrismaMock();

function makeContext(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  it('retorna true quando membro encontrado', async () => {
    const membro = {
      usrCodigo: 1,
      barCodigo: 42,
      perfil: 'barbeiro',
      codigo: 7,
      criadoEm: new Date(),
    };
    mockPrisma.membroBarbearia.findFirst.mockResolvedValue(membro as never);

    const ctx = makeContext({
      user: { sub: 1 },
      params: { barCodigo: '42' },
      headers: {},
    });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('lança ForbiddenException quando membro não encontrado', async () => {
    mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);

    const ctx = makeContext({
      user: { sub: 1 },
      params: { barCodigo: '42' },
      headers: {},
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('retorna true sem barCodigo (rota global)', async () => {
    const ctx = makeContext({
      user: { sub: 1 },
      params: {},
      headers: {},
    });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockPrisma.membroBarbearia.findFirst).not.toHaveBeenCalled();
  });

  it('retorna true quando user é null (rota pública)', async () => {
    const ctx = makeContext({
      user: undefined,
      params: { barCodigo: '42' },
      headers: {},
    });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockPrisma.membroBarbearia.findFirst).not.toHaveBeenCalled();
  });

  it('lança ForbiddenException para barCodigo inválido', async () => {
    const ctx = makeContext({
      user: { sub: 1 },
      params: { barCodigo: 'abc' },
      headers: {},
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('usa TenantStore.run(barCodigoNum) para a query de membros', async () => {
    const membro = {
      usrCodigo: 1,
      barCodigo: 42,
      perfil: 'dono',
      codigo: 7,
      criadoEm: new Date(),
    };
    mockPrisma.membroBarbearia.findFirst.mockResolvedValue(membro as never);

    const runSpy = jest.spyOn(TenantStore, 'run');

    const ctx = makeContext({
      user: { sub: 1 },
      params: { barCodigo: '42' },
      headers: {},
    });

    await guard.canActivate(ctx);

    expect(runSpy).toHaveBeenCalledWith(42, expect.any(Function));

    runSpy.mockRestore();
  });
});
