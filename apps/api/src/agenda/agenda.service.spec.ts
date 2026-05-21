import { Test } from '@nestjs/testing';
import { AgendaService } from './agenda.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

const mockPrisma = createPrismaMock();

describe('AgendaService', () => {
  let service: AgendaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AgendaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AgendaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upsertJornada', () => {
    it('cria jornada quando nao existe', async () => {
      mockPrisma.jornadaTrabalho.findFirst.mockResolvedValue(null);
      mockPrisma.jornadaTrabalho.create.mockResolvedValue({
        codigo: 1,
        barbeiroId: 5,
        barCodigo: 1,
        diaSemana: 1,
        inicio: '09:00',
        fim: '18:00',
      });

      const dto = { diaSemana: 1, inicio: '09:00', fim: '18:00' };
      const result = await service.upsertJornada(5, 1, dto as never);

      expect(mockPrisma.jornadaTrabalho.findFirst).toHaveBeenCalledWith({
        where: { barbeiroId: 5, diaSemana: 1 },
      });
      expect(mockPrisma.jornadaTrabalho.create).toHaveBeenCalledWith({
        data: { ...dto, barbeiroId: 5, barCodigo: 1 },
      });
      expect(result).toHaveProperty('codigo', 1);
    });

    it('atualiza jornada quando ja existe', async () => {
      const existing = { codigo: 7, barbeiroId: 5, diaSemana: 1 };
      mockPrisma.jornadaTrabalho.findFirst.mockResolvedValue(existing);
      mockPrisma.jornadaTrabalho.update.mockResolvedValue({
        ...existing,
        inicio: '10:00',
        fim: '19:00',
      });

      const dto = { diaSemana: 1, inicio: '10:00', fim: '19:00' };
      const result = await service.upsertJornada(5, 1, dto as never);

      expect(mockPrisma.jornadaTrabalho.update).toHaveBeenCalledWith({
        where: { codigo: 7 },
        data: dto,
      });
      expect(result).toHaveProperty('inicio', '10:00');
    });
  });

  describe('getAvailableSlots', () => {
    const MEMBRO_TENANT = { usrCodigo: 5, barCodigo: 1, perfil: 'barbeiro' };

    it('retorna slots livres sem conflitos', async () => {
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(MEMBRO_TENANT);
      mockPrisma.barbearia.findUnique.mockResolvedValue({ slotInterval: 30 });
      mockPrisma.jornadaTrabalho.findFirst.mockResolvedValue({
        inicio: '09:00',
        fim: '10:00',
        almocoIni: null,
        almocoFim: null,
      });
      mockPrisma.agendamento.findMany.mockResolvedValue([]);
      mockPrisma.bloqueioAgenda.findMany.mockResolvedValue([]);

      // Use local-time ISO string (no Z) so parse() computes slots in the same timezone
      const result = await service.getAvailableSlots(
        5,
        1,
        '2025-01-06T15:00:00',
        30,
      );

      expect(result).toEqual(['09:00', '09:30']);
    });

    it('retorna lista vazia quando barbeiro nao tem jornada no dia', async () => {
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(MEMBRO_TENANT);
      mockPrisma.barbearia.findUnique.mockResolvedValue({ slotInterval: 30 });
      mockPrisma.jornadaTrabalho.findFirst.mockResolvedValue(null);

      const result = await service.getAvailableSlots(
        5,
        1,
        '2025-01-06T15:00:00',
        30,
      );

      expect(result).toEqual([]);
    });

    it('exclui slots ocupados por agendamentos existentes', async () => {
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(MEMBRO_TENANT);
      mockPrisma.barbearia.findUnique.mockResolvedValue({ slotInterval: 30 });
      mockPrisma.jornadaTrabalho.findFirst.mockResolvedValue({
        inicio: '09:00',
        fim: '10:00',
        almocoIni: null,
        almocoFim: null,
      });
      // Use Date constructor (always local time) to match parse() output
      mockPrisma.agendamento.findMany.mockResolvedValue([
        {
          inicio: new Date(2025, 0, 6, 9, 0, 0),
          fim: new Date(2025, 0, 6, 9, 30, 0),
        },
      ]);
      mockPrisma.bloqueioAgenda.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots(
        5,
        1,
        '2025-01-06T15:00:00',
        30,
      );

      expect(result).toEqual(['09:30']);
    });

    it('exclui slots durante horario de almoco', async () => {
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(MEMBRO_TENANT);
      mockPrisma.barbearia.findUnique.mockResolvedValue({ slotInterval: 60 });
      mockPrisma.jornadaTrabalho.findFirst.mockResolvedValue({
        inicio: '09:00',
        fim: '13:00',
        almocoIni: '12:00',
        almocoFim: '13:00',
      });
      mockPrisma.agendamento.findMany.mockResolvedValue([]);
      mockPrisma.bloqueioAgenda.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots(
        5,
        1,
        '2025-01-06T15:00:00',
        60,
      );

      expect(result).toContain('09:00');
      expect(result).toContain('10:00');
      expect(result).toContain('11:00');
      expect(result).not.toContain('12:00');
    });

    it('lanca NotFoundException quando barbeiro nao pertence ao tenant', async () => {
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);

      await expect(
        service.getAvailableSlots(5, 999, '2025-01-06T15:00:00', 30),
      ).rejects.toThrow('Barbeiro não encontrado nesta barbearia');
    });

    it('lanca erro quando barbearia nao existe (barbeiro valido)', async () => {
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(MEMBRO_TENANT);
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);

      await expect(
        service.getAvailableSlots(5, 1, '2025-01-06T15:00:00', 30),
      ).rejects.toThrow('Barbearia not found');
    });
  });

  describe('getProximosSlots', () => {
    const barCodigo = 1;

    const setupMocks = () => {
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        { usrCodigo: 5, usuario: { codigo: 5, nome: 'João' } },
      ]);
      mockPrisma.servico.findFirst.mockResolvedValue({
        nome: 'Corte',
        duracaoBase: 30,
        precoBase: { toNumber: () => 40 },
      });
      // Para cada chamada interna de getAvailableSlots precisamos configurar os mocks
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue({
        usrCodigo: 5,
        barCodigo,
        perfil: 'barbeiro',
      });
      mockPrisma.barbearia.findUnique.mockResolvedValue({ slotInterval: 30 });
      mockPrisma.jornadaTrabalho.findFirst.mockResolvedValue({
        inicio: '09:00',
        fim: '10:00',
        almocoIni: null,
        almocoFim: null,
      });
      mockPrisma.agendamento.findMany.mockResolvedValue([]);
      mockPrisma.bloqueioAgenda.findMany.mockResolvedValue([]);
    };

    it('retorna slots disponíveis com metadados do barbeiro e serviço', async () => {
      setupMocks();

      const result = await service.getProximosSlots(barCodigo, 7);

      expect(result.barbeiroNome).toBe('João');
      expect(result.barbeiroInicial).toBe('J');
      expect(result.servicoNome).toBe('Corte');
      expect(result.servicoDuracao).toBe(30);
      expect(result.slots.length).toBeGreaterThan(0);
      expect(result.slots[0]).toHaveProperty('hora');
      expect(result.slots[0]).toHaveProperty('dia');
    });

    it('lança NotFoundException quando não há barbeiros', async () => {
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([]);

      await expect(service.getProximosSlots(barCodigo, 7)).rejects.toThrow(
        'Nenhum barbeiro ativo nesta barbearia',
      );
    });

    it('lança NotFoundException quando não há slots disponíveis', async () => {
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        { usrCodigo: 5, usuario: { codigo: 5, nome: 'João' } },
      ]);
      mockPrisma.servico.findFirst.mockResolvedValue(null);
      // barbeiro sem jornada configurada → getAvailableSlots retorna []
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue({
        usrCodigo: 5,
        barCodigo,
        perfil: 'barbeiro',
      });
      mockPrisma.barbearia.findUnique.mockResolvedValue({ slotInterval: 30 });
      mockPrisma.jornadaTrabalho.findFirst.mockResolvedValue(null);

      await expect(service.getProximosSlots(barCodigo, 1)).rejects.toThrow(
        'Nenhum slot disponível nos próximos dias',
      );
    });
  });
});
