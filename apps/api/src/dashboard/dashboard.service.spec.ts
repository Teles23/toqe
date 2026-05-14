import { DashboardService } from './dashboard.service';
import { createPrismaMock } from '../test/prisma-mock.factory';
import { Prisma } from '../generated/prisma';

function d(value: number) {
  return new Prisma.Decimal(value);
}

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new DashboardService(
      prisma as unknown as import('../prisma/prisma.service').PrismaService,
    );
  });

  function setupEmptyMocks() {
    prisma.agendamentoItem.findMany.mockResolvedValue([]);
    prisma.agendamento.findMany.mockResolvedValue([]);
    prisma.agendamento.findFirst.mockResolvedValue(null);
    prisma.agendamento.count.mockResolvedValue(0);
    prisma.membroBarbearia.findMany.mockResolvedValue([]);
  }

  describe('getOverview with data', () => {
    it('should return kpis with faturamento and agendamentos count', async () => {
      // KPIs: itensConcluidos, agendamentosHoje status list, itensMes
      prisma.agendamentoItem.findMany
        .mockResolvedValueOnce([{ preco: d(100) }]) // faturamento hoje (concluídos)
        .mockResolvedValueOnce([{ preco: d(100) }]) // faturamento mês
        // faturamento semana (7 dias) — kicked off concurrently via Promise.all
        .mockResolvedValueOnce([{ preco: d(50) }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ preco: d(100) }])
        // top servicos — called after getFaturamentoDias awaits (getServicosPopulares starts synchronously before getFaturamentoSemanas)
        .mockResolvedValueOnce([
          { preco: d(100), servico: { nome: 'Corte' } },
          { preco: d(50), servico: { nome: 'Barba' } },
          { preco: d(50), servico: { nome: 'Corte' } },
        ])
        // faturamento semanas do mês (4 semanas) — sequential, after semana resolves
        .mockResolvedValueOnce([{ preco: d(300) }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      prisma.agendamento.findMany
        .mockResolvedValueOnce([
          { status: 'confirmado', inicio: new Date(), fim: new Date() },
          { status: 'concluido', inicio: new Date(), fim: new Date() },
        ]) // agendamentos hoje
        .mockResolvedValueOnce([
          { inicio: new Date(), fim: new Date(Date.now() + 3_600_000) },
        ]) // duracoes concluidos
        .mockResolvedValueOnce([
          {
            inicio: new Date(),
            fim: new Date(),
            cliente: null,
            status: 'confirmado',
          },
        ]); // atividade

      prisma.agendamento.findFirst.mockResolvedValue(null); // proximo horario
      prisma.agendamento.count
        .mockResolvedValueOnce(1) // barbeiros ativos agora
        .mockResolvedValueOnce(0); // aguardando

      prisma.membroBarbearia.findMany.mockResolvedValueOnce([
        {
          usrCodigo: 1,
          usuario: { codigo: 1, nome: 'Pedro', avatarUrl: null },
        },
      ]);
      // agendamento atual do barbeiro Pedro
      prisma.agendamento.findFirst.mockResolvedValueOnce(null);

      const result = await service.getOverview(1);

      expect(result.kpis).toHaveLength(4);
      expect(result.kpis[0].label).toBe('Faturamento hoje');
      expect(result.kpis[0].value).toBe(100);
      expect(result.kpis[1].label).toBe('Agendamentos');
      expect(result.kpis[1].value).toBe(2);

      expect(result.liveMetrics).toHaveLength(4);
      expect(result.barbeiros).toHaveLength(1);
      expect(result.barbeiros[0].nome).toBe('Pedro');
      expect(result.barbeiros[0].estado).toBe('idle');

      expect(result.faturamento.semana).toHaveLength(7);
      expect(result.faturamento.mes).toHaveLength(4);

      expect(result.servicos[0].nome).toBe('Corte');
      expect(result.servicos[0].quantidade).toBe(2);
      expect(result.servicos[0].pct).toBe(100);

      expect(result.atividade).toHaveLength(1);
    });
  });

  describe('getOverview with no data', () => {
    it('should return zeros and empty arrays', async () => {
      setupEmptyMocks();

      const result = await service.getOverview(1);

      expect(result.kpis).toHaveLength(4);
      expect(result.kpis[0].value).toBe(0); // faturamento hoje
      expect(result.kpis[1].value).toBe(0); // agendamentos

      expect(result.liveMetrics).toHaveLength(4);
      expect(result.liveMetrics[0].value).toBe('0'); // barbeiros ativos

      expect(result.barbeiros).toHaveLength(0);
      expect(result.faturamento.semana).toHaveLength(7);
      result.faturamento.semana.forEach((p) => expect(p.valor).toBe(0));
      expect(result.faturamento.mes).toHaveLength(4);
      expect(result.servicos).toHaveLength(0);
      expect(result.atividade).toHaveLength(0);
    });
  });
});
