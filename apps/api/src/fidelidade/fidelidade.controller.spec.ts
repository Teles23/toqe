import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { FidelidadeController } from './fidelidade.controller';
import { FidelidadeService } from './fidelidade.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { TenantRequest } from '../common/types/jwt-request';

const mockFidelidadeService = {
  getSaldo: jest.fn(),
  resgatar: jest.fn(),
  getRanking: jest.fn(),
};

// Guards são testados em isolamento; aqui testamos a lógica de ownership do controller
const passGuard = { canActivate: () => true };

function makeReq(sub: number, perfil: string): TenantRequest {
  return {
    user: { sub, perfil },
    params: {},
    body: {},
    headers: {},
  } as unknown as TenantRequest;
}

describe('FidelidadeController — ownership checks', () => {
  let controller: FidelidadeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FidelidadeController],
      providers: [
        { provide: FidelidadeService, useValue: mockFidelidadeService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(passGuard)
      .overrideGuard(TenantGuard)
      .useValue(passGuard)
      .overrideGuard(RolesGuard)
      .useValue(passGuard)
      .compile();

    controller = module.get<FidelidadeController>(FidelidadeController);
    jest.clearAllMocks();
  });

  // ─── getSaldo ────────────────────────────────────────────────────────────────

  describe('getSaldo', () => {
    it('cliente pode consultar o próprio saldo', async () => {
      mockFidelidadeService.getSaldo.mockResolvedValue({
        pontos: 50,
        historico: [],
      });
      await controller.getSaldo(42, '10', makeReq(42, 'cliente'));
      expect(mockFidelidadeService.getSaldo).toHaveBeenCalledWith(42, 10);
    });

    it('cliente NÃO pode consultar saldo de outro cliente', () => {
      expect(() =>
        controller.getSaldo(99, '10', makeReq(42, 'cliente')),
      ).toThrow(ForbiddenException);
      expect(mockFidelidadeService.getSaldo).not.toHaveBeenCalled();
    });

    it('dono pode consultar saldo de qualquer cliente', async () => {
      mockFidelidadeService.getSaldo.mockResolvedValue({
        pontos: 100,
        historico: [],
      });
      await controller.getSaldo(99, '10', makeReq(1, 'dono'));
      expect(mockFidelidadeService.getSaldo).toHaveBeenCalledWith(99, 10);
    });

    it('gerente pode consultar saldo de qualquer cliente', async () => {
      mockFidelidadeService.getSaldo.mockResolvedValue({
        pontos: 30,
        historico: [],
      });
      await controller.getSaldo(55, '10', makeReq(2, 'gerente'));
      expect(mockFidelidadeService.getSaldo).toHaveBeenCalledWith(55, 10);
    });
  });

  // ─── resgatar ────────────────────────────────────────────────────────────────

  describe('resgatar', () => {
    it('cliente pode resgatar os próprios pontos', async () => {
      mockFidelidadeService.resgatar.mockResolvedValue({ desconto: 5 });
      await controller.resgatar(
        { clienteCodigo: 42, pontos: 10 },
        '10',
        makeReq(42, 'cliente'),
      );
      expect(mockFidelidadeService.resgatar).toHaveBeenCalledWith(42, 10, 10);
    });

    it('cliente NÃO pode resgatar pontos de outro cliente (IDOR)', () => {
      expect(() =>
        controller.resgatar(
          { clienteCodigo: 99, pontos: 100 },
          '10',
          makeReq(42, 'cliente'),
        ),
      ).toThrow(ForbiddenException);
      expect(mockFidelidadeService.resgatar).not.toHaveBeenCalled();
    });

    it('dono pode resgatar pontos de qualquer cliente', async () => {
      mockFidelidadeService.resgatar.mockResolvedValue({ desconto: 50 });
      await controller.resgatar(
        { clienteCodigo: 99, pontos: 100 },
        '10',
        makeReq(1, 'dono'),
      );
      expect(mockFidelidadeService.resgatar).toHaveBeenCalledWith(99, 10, 100);
    });

    it('barbeiro pode resgatar pontos de qualquer cliente', async () => {
      mockFidelidadeService.resgatar.mockResolvedValue({ desconto: 5 });
      await controller.resgatar(
        { clienteCodigo: 55, pontos: 10 },
        '10',
        makeReq(3, 'barbeiro'),
      );
      expect(mockFidelidadeService.resgatar).toHaveBeenCalledWith(55, 10, 10);
    });
  });
});
