import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagGuard } from './feature-flag.guard';
import { FEATURE_KEY } from '../decorators/feature.decorator';

describe('FeatureFlagGuard', () => {
  let guard: FeatureFlagGuard;
  let reflector: jest.Mocked<Reflector>;
  let mockPrisma: {
    barbearia: { findUnique: jest.Mock };
    planoLimite: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    mockPrisma = {
      barbearia: { findUnique: jest.fn() },
      planoLimite: { findUnique: jest.fn() },
    };

    guard = new FeatureFlagGuard(reflector, mockPrisma as never);
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

  it('permite quando não há @Feature decorator', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const result = await guard.canActivate(
      buildContext({ 'x-tenant-id': '1' }),
    );
    expect(result).toBe(true);
    expect(mockPrisma.barbearia.findUnique).not.toHaveBeenCalled();
  });

  it('permite quando não há x-tenant-id', async () => {
    reflector.getAllAndOverride.mockReturnValue('whiteLabel');
    const result = await guard.canActivate(buildContext({}));
    expect(result).toBe(true);
    expect(mockPrisma.barbearia.findUnique).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando barbearia não existe', async () => {
    reflector.getAllAndOverride.mockReturnValue('whiteLabel');
    mockPrisma.barbearia.findUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(buildContext({ 'x-tenant-id': '99' })),
    ).rejects.toThrow(NotFoundException);
  });

  it('permite acesso para planoStatus=ativo com feature habilitada', async () => {
    reflector.getAllAndOverride.mockReturnValue('whiteLabel');
    mockPrisma.barbearia.findUnique.mockResolvedValue({
      plano: 'pro',
      planoStatus: 'ativo',
      bloqueadaEm: null,
    });
    mockPrisma.planoLimite.findUnique.mockResolvedValue({
      plano: 'pro',
      whiteLabel: true,
    });

    const result = await guard.canActivate(
      buildContext({ 'x-tenant-id': '1' }),
    );
    expect(result).toBe(true);
  });

  it('permite acesso para planoStatus=trial com feature habilitada', async () => {
    reflector.getAllAndOverride.mockReturnValue('whiteLabel');
    mockPrisma.barbearia.findUnique.mockResolvedValue({
      plano: 'free',
      planoStatus: 'trial',
      bloqueadaEm: null,
    });
    mockPrisma.planoLimite.findUnique.mockResolvedValue({
      plano: 'free',
      whiteLabel: true,
    });

    const result = await guard.canActivate(
      buildContext({ 'x-tenant-id': '2' }),
    );
    expect(result).toBe(true);
  });

  it('bloqueia planoStatus=inadimplente antes de verificar feature', async () => {
    reflector.getAllAndOverride.mockReturnValue('whiteLabel');
    mockPrisma.barbearia.findUnique.mockResolvedValue({
      plano: 'basic',
      planoStatus: 'inadimplente',
      bloqueadaEm: null,
    });

    await expect(
      guard.canActivate(buildContext({ 'x-tenant-id': '3' })),
    ).rejects.toThrow(ForbiddenException);
    expect(mockPrisma.planoLimite.findUnique).not.toHaveBeenCalled();
  });

  it('bloqueia planoStatus=cancelado antes de verificar feature', async () => {
    reflector.getAllAndOverride.mockReturnValue('whiteLabel');
    mockPrisma.barbearia.findUnique.mockResolvedValue({
      plano: 'basic',
      planoStatus: 'cancelado',
      bloqueadaEm: null,
    });

    await expect(
      guard.canActivate(buildContext({ 'x-tenant-id': '4' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lança ForbiddenException quando plano não reconhecido', async () => {
    reflector.getAllAndOverride.mockReturnValue('whiteLabel');
    mockPrisma.barbearia.findUnique.mockResolvedValue({
      plano: 'unknown',
      planoStatus: 'ativo',
      bloqueadaEm: null,
    });
    mockPrisma.planoLimite.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(buildContext({ 'x-tenant-id': '5' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lança ForbiddenException quando plano não tem a feature', async () => {
    reflector.getAllAndOverride.mockReturnValue('whiteLabel');
    mockPrisma.barbearia.findUnique.mockResolvedValue({
      plano: 'free',
      planoStatus: 'ativo',
      bloqueadaEm: null,
    });
    mockPrisma.planoLimite.findUnique.mockResolvedValue({
      plano: 'free',
      whiteLabel: false,
    });

    await expect(
      guard.canActivate(buildContext({ 'x-tenant-id': '6' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('chama FEATURE_KEY para obter a feature via reflector', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = buildContext({ 'x-tenant-id': '1' });
    await guard.canActivate(ctx);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      FEATURE_KEY,
      expect.any(Array),
    );
  });
});
