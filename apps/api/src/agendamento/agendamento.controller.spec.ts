import { Test } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { AgendamentoController } from './agendamento.controller';
import { AgendamentoService } from './agendamento.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import {
  PatchStatusAgendamentoDto,
  StatusAgendamento,
} from './dto/patch-status-agendamento.dto';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockAgendamentoService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  patchStatus: jest.fn(),
  cancel: jest.fn(),
  meusAgendamentos: jest.fn(),
  proximoAgendamento: jest.fn(),
  agendamentoAtual: jest.fn(),
};

describe('AgendamentoController', () => {
  let controller: AgendamentoController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AgendamentoController],
      providers: [
        { provide: AgendamentoService, useValue: mockAgendamentoService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();
    controller = module.get(AgendamentoController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('delega para service.create com barCodigo convertido', () => {
      const dto: CreateAgendamentoDto = {
        barbeiroId: 5,
        clienteId: 10,
        servicosIds: [1],
        inicio: '2024-06-01T09:00:00Z',
      };
      mockAgendamentoService.create.mockResolvedValue({ codigo: 1 });

      void controller.create(dto, '3');

      expect(mockAgendamentoService.create).toHaveBeenCalledWith(dto, 3);
    });
  });

  describe('findAll', () => {
    it('delega para service.findAll com barCodigo e filtros', () => {
      mockAgendamentoService.findAll.mockResolvedValue([]);
      const filtros = { data: '2024-06-01' };

      void controller.findAll(filtros as never, '3');

      expect(mockAgendamentoService.findAll).toHaveBeenCalledWith(3, filtros);
    });
  });

  describe('findOne', () => {
    it('delega para service.findOne com codigo e barCodigo', () => {
      mockAgendamentoService.findOne.mockResolvedValue({ codigo: 42 });

      void controller.findOne(42, '3');

      expect(mockAgendamentoService.findOne).toHaveBeenCalledWith(42, 3);
    });
  });

  describe('patchStatus', () => {
    it('delega para service.patchStatus', () => {
      const dto: PatchStatusAgendamentoDto = {
        status: StatusAgendamento.CONCLUIDO,
      };
      mockAgendamentoService.patchStatus.mockResolvedValue({
        status: 'concluido',
      });

      void controller.patchStatus(42, dto, '3');

      expect(mockAgendamentoService.patchStatus).toHaveBeenCalledWith(
        42,
        dto,
        3,
      );
    });
  });

  describe('cancel', () => {
    it('delega para service.cancel', () => {
      mockAgendamentoService.cancel.mockResolvedValue({ status: 'cancelado' });

      void controller.cancel(42, '3');

      expect(mockAgendamentoService.cancel).toHaveBeenCalledWith(42, 3);
    });
  });

  describe('meusAgendamentos', () => {
    it('delega para service.meusAgendamentos com sub e barCodigo', () => {
      mockAgendamentoService.meusAgendamentos.mockResolvedValue([]);
      void controller.meusAgendamentos({ user: { sub: 20 } } as never, '3');
      expect(mockAgendamentoService.meusAgendamentos).toHaveBeenCalledWith(
        20,
        3,
      );
    });
  });

  describe('proximoAgendamento', () => {
    it('delega para service.proximoAgendamento', () => {
      mockAgendamentoService.proximoAgendamento.mockResolvedValue(null);
      void controller.proximoAgendamento({ user: { sub: 20 } } as never, '3');
      expect(mockAgendamentoService.proximoAgendamento).toHaveBeenCalledWith(
        20,
        3,
      );
    });
  });

  describe('agendamentoAtual', () => {
    it('delega para service.agendamentoAtual', () => {
      mockAgendamentoService.agendamentoAtual.mockResolvedValue(null);
      void controller.agendamentoAtual({ user: { sub: 10 } } as never, '3');
      expect(mockAgendamentoService.agendamentoAtual).toHaveBeenCalledWith(
        10,
        3,
      );
    });
  });
});
