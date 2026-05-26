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

  describe('upsertJornadaSemanal (transacional)', () => {
    function mockTx() {
      mockPrisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => unknown) => fn(mockPrisma),
      );
    }

    const dia = (diaSemana: number, ativo: boolean) => ({
      diaSemana,
      ativo,
      inicio: '09:00',
      fim: '18:00',
      almocoIni: '12:00',
      almocoFim: '13:00',
    });

    it('roda tudo numa transação: cria/atualiza ativos e remove (folga) inativos', async () => {
      mockTx();
      // dia 1: novo (create); dia 2: já existe (update); dia 0: folga (delete)
      mockPrisma.jornadaTrabalho.findFirst
        .mockResolvedValueOnce(null) // dia 1
        .mockResolvedValueOnce({ codigo: 99 }); // dia 2
      mockPrisma.jornadaTrabalho.create.mockResolvedValue({});
      mockPrisma.jornadaTrabalho.update.mockResolvedValue({});
      mockPrisma.jornadaTrabalho.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.jornadaTrabalho.findMany.mockResolvedValue([{ diaSemana: 1 }]);

      const result = await service.upsertJornadaSemanal(5, 1, {
        dias: [dia(1, true), dia(2, true), dia(0, false)],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.jornadaTrabalho.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.jornadaTrabalho.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.jornadaTrabalho.deleteMany).toHaveBeenCalledWith({
        where: { barbeiroId: 5, barCodigo: 1, diaSemana: 0 },
      });
      // não vaza `ativo` nos dados gravados
      const createCalls = mockPrisma.jornadaTrabalho.create.mock
        .calls as unknown as Array<[{ data: Record<string, unknown> }]>;
      expect(createCalls[0][0].data).not.toHaveProperty('ativo');
      expect(result).toEqual([{ diaSemana: 1 }]);
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

    it('com data date-only (YYYY-MM-DD) ancora no dia certo do fuso da barbearia (regressão off-by-one)', async () => {
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

      const result = await service.getAvailableSlots(5, 1, '2026-05-26', 30);

      // 26/05/2026 é terça → diaSemana 2 (getDay): jornada buscada para o dia correto
      expect(mockPrisma.jornadaTrabalho.findFirst).toHaveBeenCalledWith({
        where: { barbeiroId: 5, diaSemana: 2 },
      });
      // busca de agendamentos no range do dia 26 em America/Sao_Paulo (UTC-3)
      const [callAg] = mockPrisma.agendamento.findMany.mock.calls[0] as [
        { where: { inicio: { gte: Date }; fim: { lte: Date } } },
      ];
      expect(callAg.where.inicio.gte.toISOString()).toBe(
        '2026-05-26T03:00:00.000Z',
      );
      expect(callAg.where.fim.lte.toISOString()).toBe(
        '2026-05-27T02:59:59.999Z',
      );
      // horários exibidos no relógio local da barbearia
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

    it('retorna [] quando o barbeiro DESATIVOU o serviço informado (srvCodigo)', async () => {
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(MEMBRO_TENANT);
      mockPrisma.barbeiroServico.findUnique.mockResolvedValue({ ativo: false });

      const result = await service.getAvailableSlots(
        5,
        1,
        '2025-01-06T15:00:00',
        30,
        9, // srvCodigo desativado
      );

      expect(result).toEqual([]);
      // nem chega a calcular jornada
      expect(mockPrisma.jornadaTrabalho.findFirst).not.toHaveBeenCalled();
    });

    it('sem registro do serviço, calcula normalmente (fallback base)', async () => {
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(MEMBRO_TENANT);
      mockPrisma.barbeiroServico.findUnique.mockResolvedValue(null);
      mockPrisma.barbearia.findUnique.mockResolvedValue({ slotInterval: 30 });
      mockPrisma.jornadaTrabalho.findFirst.mockResolvedValue({
        inicio: '09:00',
        fim: '10:00',
        almocoIni: null,
        almocoFim: null,
      });
      mockPrisma.agendamento.findMany.mockResolvedValue([]);
      mockPrisma.bloqueioAgenda.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots(
        5,
        1,
        '2025-01-06T15:00:00',
        30,
        9,
      );

      expect(result).toEqual(['09:00', '09:30']);
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
