import { Test } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { RelatorioController } from './relatorio.controller';
import { RelatorioService } from './relatorio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockRelatorioService = {
  faturamento: jest.fn(),
  agendamentos: jest.fn(),
  servicos: jest.fn(),
  barbeiros: jest.fn(),
  horariosPico: jest.fn(),
};

describe('RelatorioController', () => {
  let controller: RelatorioController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [RelatorioController],
      providers: [
        { provide: RelatorioService, useValue: mockRelatorioService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();
    controller = module.get(RelatorioController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('faturamento', () => {
    it('delega para relatorioService.faturamento com barCodigo e periodo', async () => {
      const data = [{ data: '2025-01-01', total: 200 }];
      mockRelatorioService.faturamento.mockResolvedValue(data);

      const result = await controller.faturamento(1, '7d', 'tenant-1');

      expect(mockRelatorioService.faturamento).toHaveBeenCalledWith(1, '7d');
      expect(result).toEqual(data);
    });

    it('usa periodo padrão 30d quando não informado', () => {
      mockRelatorioService.faturamento.mockResolvedValue([]);

      void controller.faturamento(1, undefined as never, 'tenant-1');

      expect(mockRelatorioService.faturamento).toHaveBeenCalledWith(1, '30d');
    });
  });

  describe('agendamentos', () => {
    it('delega para relatorioService.agendamentos com barCodigo e periodo', async () => {
      const data = [
        { data: '2025-01-01', concluido: 3, cancelado: 1, no_show: 0 },
      ];
      mockRelatorioService.agendamentos.mockResolvedValue(data);

      const result = await controller.agendamentos(1, '30d', 'tenant-1');

      expect(mockRelatorioService.agendamentos).toHaveBeenCalledWith(1, '30d');
      expect(result).toEqual(data);
    });
  });

  describe('servicos', () => {
    it('delega para relatorioService.servicos com barCodigo e periodo', async () => {
      const data = [{ nome: 'Corte', quantidade: 10, total: 500 }];
      mockRelatorioService.servicos.mockResolvedValue(data);

      const result = await controller.servicos(1, '30d', 'tenant-1');

      expect(mockRelatorioService.servicos).toHaveBeenCalledWith(1, '30d');
      expect(result).toEqual(data);
    });
  });

  describe('barbeiros', () => {
    it('delega para relatorioService.barbeiros com barCodigo e periodo', async () => {
      const data = [
        {
          nome: 'João',
          faturamento: 3000,
          atendimentos: 20,
          ticketMedio: 150,
          avaliacao: 0,
        },
      ];
      mockRelatorioService.barbeiros.mockResolvedValue(data);

      const result = await controller.barbeiros(1, '30d', 'tenant-1');

      expect(mockRelatorioService.barbeiros).toHaveBeenCalledWith(1, '30d');
      expect(result).toEqual(data);
    });
  });

  describe('horariosPico', () => {
    it('delega para relatorioService.horariosPico e retorna 24 horas', async () => {
      const data = Array.from({ length: 24 }, (_, h) => ({
        hora: h,
        quantidade: 0,
      }));
      mockRelatorioService.horariosPico.mockResolvedValue(data);

      const result = await controller.horariosPico(1, '30d', 'tenant-1');

      expect(mockRelatorioService.horariosPico).toHaveBeenCalledWith(1, '30d');
      expect(result).toHaveLength(24);
    });
  });
});
