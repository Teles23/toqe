import { Test } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockAgendaService = {
  upsertJornada: jest.fn(),
  getJornada: jest.fn(),
  createBloqueio: jest.fn(),
  getAvailableSlots: jest.fn(),
};

describe('AgendaController', () => {
  let controller: AgendaController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AgendaController],
      providers: [{ provide: AgendaService, useValue: mockAgendaService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();
    controller = module.get(AgendaController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('configurarJornada', () => {
    it('delega para agendaService.upsertJornada com barbeiroId e barCodigo convertidos', () => {
      const dto = { diaSemana: 1, inicio: '09:00', fim: '18:00' };
      mockAgendaService.upsertJornada.mockResolvedValue({});

      void controller.configurarJornada(5, '3', dto as never);

      expect(mockAgendaService.upsertJornada).toHaveBeenCalledWith(5, 3, dto);
    });
  });

  describe('obterJornada', () => {
    it('delega para agendaService.getJornada com barbeiroId', () => {
      mockAgendaService.getJornada.mockResolvedValue([]);

      void controller.obterJornada(5);

      expect(mockAgendaService.getJornada).toHaveBeenCalledWith(5);
    });
  });

  describe('criarBloqueio', () => {
    it('delega para agendaService.createBloqueio com barbeiroId e barCodigo convertidos', () => {
      const dto = {
        inicio: '2024-06-01T12:00:00Z',
        fim: '2024-06-01T13:00:00Z',
      };
      mockAgendaService.createBloqueio.mockResolvedValue({ codigo: 1 });

      void controller.criarBloqueio(5, '3', dto as never);

      expect(mockAgendaService.createBloqueio).toHaveBeenCalledWith(5, 3, dto);
    });
  });

  describe('obterDisponibilidade', () => {
    it('delega para agendaService.getAvailableSlots', async () => {
      mockAgendaService.getAvailableSlots.mockResolvedValue(['09:00', '09:30']);

      const result = await controller.obterDisponibilidade(
        5,
        '3',
        '2024-06-01',
        30,
      );

      expect(mockAgendaService.getAvailableSlots).toHaveBeenCalledWith(
        5,
        3,
        '2024-06-01',
        30,
      );
      expect(result).toEqual(['09:00', '09:30']);
    });
  });
});
