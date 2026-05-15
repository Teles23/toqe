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

  describe('getOverview — com dados', () => {
    it('retorna kpis, faturamento, servicos e barbeiros no shape correto', async () => {
      // ordem real das chamadas agendamentoItem.findMany:
      // 1-2: getKpis (itensConcluidos, itensMes) — Promise.all simultâneo
      // 3-9: getFaturamentoDias (7 dias) — Promise.all simultâneo
      // 10: getServicosPopulares — kick-off síncrono após getFaturamentoDias await
      // 11-14: getFaturamentoSemanas (4 semanas) — sequential após semana resolve
      prisma.agendamentoItem.findMany
        .mockResolvedValueOnce([{ preco: d(100) }]) // #1 itensConcluidos hoje
        .mockResolvedValueOnce([{ preco: d(100) }]) // #2 itensMes
        .mockResolvedValueOnce([{ preco: d(100) }]) // #3 semana dia 1
        .mockResolvedValueOnce([{ preco: d(50) }, { preco: d(50) }]) // #4 semana dia 2
        .mockResolvedValueOnce([]) // #5
        .mockResolvedValueOnce([]) // #6
        .mockResolvedValueOnce([]) // #7
        .mockResolvedValueOnce([]) // #8
        .mockResolvedValueOnce([]) // #9 semana dia 7
        .mockResolvedValueOnce([
          // #10 serviços populares
          { preco: d(100), servico: { nome: 'Corte' } },
          { preco: d(50), servico: { nome: 'Barba' } },
          { preco: d(50), servico: { nome: 'Corte' } },
        ])
        .mockResolvedValueOnce([{ preco: d(200) }]) // #11 mês sem 1
        .mockResolvedValueOnce([]) // #12 mês sem 2
        .mockResolvedValueOnce([]) // #13 mês sem 3
        .mockResolvedValueOnce([]); // #14 mês sem 4

      prisma.agendamento.findMany
        .mockResolvedValueOnce([
          // agendamentosHoje (kpis)
          { status: 'concluido' },
          { status: 'confirmado' },
        ])
        .mockResolvedValueOnce([]) // duracoes (liveMetrics)
        // atividade
        .mockResolvedValueOnce([
          {
            status: 'confirmado',
            inicio: new Date(),
            cliente: { nome: 'João' },
          },
        ]);

      prisma.agendamento.count
        .mockResolvedValueOnce(1) // barbeiros ativos (liveMetrics)
        .mockResolvedValueOnce(0); // aguardando

      prisma.agendamento.findFirst.mockResolvedValue(null); // próximo horário

      prisma.membroBarbearia.findMany.mockResolvedValueOnce([
        {
          usrCodigo: 10,
          usuario: { codigo: 10, nome: 'Pedro', avatarUrl: null },
        },
      ]);

      // agendamento atual do barbeiro Pedro
      prisma.agendamento.findFirst.mockResolvedValueOnce(null);

      const result = await service.getOverview(1);

      expect(result.kpis).toHaveLength(4);
      expect(result.kpis[0]).toHaveProperty('label', 'Faturamento hoje');
      expect(result.kpis[0]).toHaveProperty('value', 100);
      expect(result.kpis[1]).toHaveProperty('label', 'Agendamentos');

      expect(result.faturamento.semana).toHaveLength(7);
      expect(result.faturamento.mes).toHaveLength(4);

      expect(result.servicos[0].nome).toBe('Corte');
      expect(result.servicos[0].quantidade).toBe(2);
      expect(result.servicos[0].pct).toBe(100);
      expect(result.servicos[1].pct).toBe(50);

      expect(result.liveMetrics).toHaveLength(4);
      expect(result.barbeiros).toHaveLength(1);
      expect(result.barbeiros[0].nome).toBe('Pedro');
      expect(result.barbeiros[0].estado).toBe('idle');
    });
  });

  describe('getOverview — sem dados', () => {
    it('retorna zeros e arrays vazios', async () => {
      setupEmptyMocks();

      const result = await service.getOverview(1);

      expect(result.kpis).toHaveLength(4);
      expect(result.kpis[0].value).toBe(0);
      expect(result.faturamento.semana).toHaveLength(7);
      result.faturamento.semana.forEach((p) => expect(p.valor).toBe(0));
      expect(result.faturamento.mes).toHaveLength(4);
      expect(result.servicos).toHaveLength(0);
      expect(result.atividade).toHaveLength(0);
      expect(result.barbeiros).toHaveLength(0);
    });
  });

  describe('barbeiros ao vivo', () => {
    it('retorna estado active quando barbeiro tem agendamento atual', async () => {
      setupEmptyMocks();

      prisma.membroBarbearia.findMany.mockResolvedValueOnce([
        {
          usrCodigo: 10,
          usuario: { codigo: 10, nome: 'Carlos', avatarUrl: null },
        },
      ]);

      const inicio = new Date(Date.now() - 15 * 60_000);
      const fim = new Date(Date.now() + 15 * 60_000);

      // findFirst call order: (1) getLiveMetrics.proximo → null, (2) getBarbeirosStatus.Carlos → agendamento
      prisma.agendamento.findFirst
        .mockResolvedValueOnce(null) // próximo horário (getLiveMetrics)
        .mockResolvedValueOnce({
          // agendamento atual de Carlos (getBarbeirosStatus)
          inicio,
          fim,
          cliente: { nome: 'João' },
          itens: [{ servico: { nome: 'Corte' } }],
        });

      const result = await service.getOverview(1);

      const carlos = result.barbeiros.find((b) => b.nome === 'Carlos');
      expect(carlos?.estado).toBe('active');
      expect(carlos?.cliente).toBe('João');
      expect(carlos?.servico).toBe('Corte');
      expect(carlos?.pct).toBeGreaterThan(0);
      expect(carlos?.pct).toBeLessThanOrEqual(100);
    });
  });
});
