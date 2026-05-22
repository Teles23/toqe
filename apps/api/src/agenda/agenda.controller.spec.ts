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
  upsertJornadaSemanal: jest.fn(),
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
      const req = { user: { sub: 5, perfil: 'barbeiro' } } as never;

      void controller.configurarJornada(5, '3', dto as never, req);

      expect(mockAgendaService.upsertJornada).toHaveBeenCalledWith(5, 3, dto);
    });

    it('lança ForbiddenException se barbeiro tenta alterar jornada de outro', () => {
      const dto = { diaSemana: 1, inicio: '09:00', fim: '18:00' };
      const req = { user: { sub: 99, perfil: 'barbeiro' } } as never;

      expect(() =>
        controller.configurarJornada(5, '3', dto as never, req),
      ).toThrow('Barbeiro só pode configurar sua própria jornada de trabalho');
    });
  });

  describe('salvarJornadaSemanal', () => {
    const dto = {
      dias: [
        {
          diaSemana: 1,
          ativo: true,
          inicio: '09:00',
          fim: '18:00',
          almocoIni: '12:00',
          almocoFim: '13:00',
        },
      ],
    };

    it('delega para agendaService.upsertJornadaSemanal', () => {
      mockAgendaService.upsertJornadaSemanal.mockResolvedValue([]);
      const req = { user: { sub: 5, perfil: 'barbeiro' } } as never;

      void controller.salvarJornadaSemanal(5, '3', dto as never, req);

      expect(mockAgendaService.upsertJornadaSemanal).toHaveBeenCalledWith(
        5,
        3,
        dto,
      );
    });

    it('lança ForbiddenException se barbeiro tenta alterar jornada de outro', () => {
      const req = { user: { sub: 99, perfil: 'barbeiro' } } as never;

      expect(() =>
        controller.salvarJornadaSemanal(5, '3', dto as never, req),
      ).toThrow('Barbeiro só pode configurar sua própria jornada de trabalho');
    });
  });

  describe('obterJornada', () => {
    it('delega para agendaService.getJornada com barbeiroId e barCodigo', () => {
      mockAgendaService.getJornada.mockResolvedValue([]);

      void controller.obterJornada(5, '3');

      expect(mockAgendaService.getJornada).toHaveBeenCalledWith(5, 3);
    });
  });

  describe('criarBloqueio', () => {
    it('delega para agendaService.createBloqueio com barbeiroId e barCodigo convertidos', () => {
      const dto = {
        inicio: '2024-06-01T12:00:00Z',
        fim: '2024-06-01T13:00:00Z',
      };
      mockAgendaService.createBloqueio.mockResolvedValue({ codigo: 1 });
      const req = { user: { sub: 5, perfil: 'dono' } } as never;

      void controller.criarBloqueio(5, '3', dto as never, req);

      expect(mockAgendaService.createBloqueio).toHaveBeenCalledWith(5, 3, dto);
    });

    it('lança ForbiddenException se barbeiro tenta bloquear agenda de outro', () => {
      const dto = {
        inicio: '2024-06-01T12:00:00Z',
        fim: '2024-06-01T13:00:00Z',
      };
      const req = { user: { sub: 99, perfil: 'barbeiro' } } as never;

      expect(() => controller.criarBloqueio(5, '3', dto as never, req)).toThrow(
        'Barbeiro só pode bloquear sua própria agenda',
      );
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
