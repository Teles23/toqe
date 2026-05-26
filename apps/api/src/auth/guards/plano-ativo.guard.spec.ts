import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanoAtivoGuard } from './plano-ativo.guard';
import { SKIP_PLANO_CHECK_KEY } from '../decorators/skip-plano-check.decorator';

describe('PlanoAtivoGuard', () => {
  let guard: PlanoAtivoGuard;
  let reflector: jest.Mocked<Reflector>;
  let mockPrisma: {
    barbearia: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;

    mockPrisma = {
      barbearia: {
        findUnique: jest.fn(),
      },
    };

    guard = new PlanoAtivoGuard(reflector, mockPrisma as never);
  });

  function buildContext(
    headers: Record<string, string | undefined> = {},
  ): ExecutionContext {
    return {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ headers }),
      }),
    } as unknown as ExecutionContext;
  }

  it('permite quando sem x-tenant-id', async () => {
    mockPrisma.barbearia.findUnique.mockResolvedValue(null);

    const result = await guard.canActivate(buildContext({}));

    expect(result).toBe(true);
    expect(mockPrisma.barbearia.findUnique).not.toHaveBeenCalled();
  });

  it('permite quando planoStatus=ativo', async () => {
    mockPrisma.barbearia.findUnique.mockResolvedValue({ planoStatus: 'ativo' });

    const result = await guard.canActivate(
      buildContext({ 'x-tenant-id': '1' }),
    );

    expect(result).toBe(true);
  });

  it('permite quando planoStatus=trial', async () => {
    mockPrisma.barbearia.findUnique.mockResolvedValue({ planoStatus: 'trial' });

    const result = await guard.canActivate(
      buildContext({ 'x-tenant-id': '5' }),
    );

    expect(result).toBe(true);
  });

  it('bloqueia quando planoStatus=inadimplente', async () => {
    mockPrisma.barbearia.findUnique.mockResolvedValue({
      planoStatus: 'inadimplente',
    });

    await expect(
      guard.canActivate(buildContext({ 'x-tenant-id': '2' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('bloqueia quando planoStatus=cancelado', async () => {
    mockPrisma.barbearia.findUnique.mockResolvedValue({
      planoStatus: 'cancelado',
    });

    await expect(
      guard.canActivate(buildContext({ 'x-tenant-id': '3' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('ignora quando @SkipPlanoCheck', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    mockPrisma.barbearia.findUnique.mockResolvedValue({
      planoStatus: 'inadimplente',
    });

    const ctx = buildContext({ 'x-tenant-id': '4' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      SKIP_PLANO_CHECK_KEY,
      expect.any(Array),
    );
    expect(mockPrisma.barbearia.findUnique).not.toHaveBeenCalled();
  });
});
