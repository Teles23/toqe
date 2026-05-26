import { Test } from '@nestjs/testing';
import { CanActivate, ForbiddenException } from '@nestjs/common';
import { ServicoController } from './servico.controller';
import { ServicoService } from './servico.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import type { TenantRequest } from '../common/types/jwt-request';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockServicoService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findServicosBarbeiro: jest.fn(),
  toggleServicoBarbeiro: jest.fn(),
  atualizarServicoBarbeiro: jest.fn(),
  criarServicoExclusivo: jest.fn(),
};

const reqAs = (perfil: string, sub: number) =>
  ({ user: { sub, perfil } }) as unknown as TenantRequest;

describe('ServicoController', () => {
  let controller: ServicoController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ServicoController],
      providers: [{ provide: ServicoService, useValue: mockServicoService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();
    controller = module.get(ServicoController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('delega para servicoService.create com barCodigo convertido', () => {
      const dto: CreateServicoDto = {
        nome: 'Corte',
        precoBase: 25,
        duracaoBase: 30,
      };
      mockServicoService.create.mockResolvedValue({ codigo: 1 });

      void controller.create(dto, '3');

      expect(mockServicoService.create).toHaveBeenCalledWith(dto, 3);
    });
  });

  describe('findAll', () => {
    it('delega para servicoService.findAll com barCodigo convertido', () => {
      mockServicoService.findAll.mockResolvedValue([]);

      void controller.findAll('3');

      expect(mockServicoService.findAll).toHaveBeenCalledWith(3);
    });
  });

  describe('findOne', () => {
    it('delega para servicoService.findOne com codigo e barCodigo', () => {
      mockServicoService.findOne.mockResolvedValue({ codigo: 5 });

      void controller.findOne(5, '3');

      expect(mockServicoService.findOne).toHaveBeenCalledWith(5, 3);
    });
  });

  describe('update', () => {
    it('delega para servicoService.update', () => {
      const dto: UpdateServicoDto = { nome: 'Corte Premium' };
      mockServicoService.update.mockResolvedValue({ codigo: 5 });

      void controller.update(5, dto, '3');

      expect(mockServicoService.update).toHaveBeenCalledWith(5, dto, 3);
    });
  });

  describe('remove', () => {
    it('delega para servicoService.remove', () => {
      mockServicoService.remove.mockResolvedValue({ ativo: false });

      void controller.remove(5, '3');

      expect(mockServicoService.remove).toHaveBeenCalledWith(5, 3);
    });
  });

  // ─── Serviços do barbeiro ───────────────────────────────────────────────────

  describe('findServicosBarbeiro', () => {
    it('delega com barbeiroId e barCodigo convertido', () => {
      mockServicoService.findServicosBarbeiro.mockResolvedValue([]);
      void controller.findServicosBarbeiro(7, '3');
      expect(mockServicoService.findServicosBarbeiro).toHaveBeenCalledWith(
        3,
        7,
      );
    });
  });

  describe('toggleServicoBarbeiro', () => {
    it('dono pode togglar de qualquer barbeiro', () => {
      mockServicoService.toggleServicoBarbeiro.mockResolvedValue({});
      void controller.toggleServicoBarbeiro(
        7,
        5,
        { ativo: false },
        '3',
        reqAs('dono', 99),
      );
      expect(mockServicoService.toggleServicoBarbeiro).toHaveBeenCalledWith(
        3,
        7,
        5,
        false,
      );
    });

    it('barbeiro mexendo em OUTRO barbeiro → 403', () => {
      expect(() =>
        controller.toggleServicoBarbeiro(
          7,
          5,
          { ativo: true },
          '3',
          reqAs('barbeiro', 8),
        ),
      ).toThrow(ForbiddenException);
      expect(mockServicoService.toggleServicoBarbeiro).not.toHaveBeenCalled();
    });

    it('barbeiro nos PRÓPRIOS serviços → delega', () => {
      mockServicoService.toggleServicoBarbeiro.mockResolvedValue({});
      void controller.toggleServicoBarbeiro(
        7,
        5,
        { ativo: true },
        '3',
        reqAs('barbeiro', 7),
      );
      expect(mockServicoService.toggleServicoBarbeiro).toHaveBeenCalled();
    });
  });

  describe('atualizarServicoBarbeiro', () => {
    it('delega passando o perfil do caller', () => {
      mockServicoService.atualizarServicoBarbeiro.mockResolvedValue({});
      const dto = { precoProprio: 50, duracaoMin: 30 };
      void controller.atualizarServicoBarbeiro(
        7,
        5,
        dto,
        '3',
        reqAs('barbeiro', 7),
      );
      expect(mockServicoService.atualizarServicoBarbeiro).toHaveBeenCalledWith(
        3,
        7,
        5,
        dto,
        'barbeiro',
      );
    });
  });

  describe('criarServicoExclusivo', () => {
    it('delega com perfil; barbeiro em outro → 403', () => {
      mockServicoService.criarServicoExclusivo.mockResolvedValue({});
      const dto: CreateServicoDto = {
        nome: 'Navalhado',
        precoBase: 60,
        duracaoBase: 45,
      };
      void controller.criarServicoExclusivo(7, dto, '3', reqAs('gerente', 1));
      expect(mockServicoService.criarServicoExclusivo).toHaveBeenCalledWith(
        3,
        7,
        dto,
        'gerente',
      );

      expect(() =>
        controller.criarServicoExclusivo(7, dto, '3', reqAs('barbeiro', 8)),
      ).toThrow(ForbiddenException);
    });
  });
});
