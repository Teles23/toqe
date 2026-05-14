import { DashboardService } from './dashboard.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new DashboardService(prisma as any);
  });

  describe('getOverview with data', () => {
    it('should return faturamento7d, agendamentosHoje, topServicos sorted by count', async () => {
      // Mock agendamentoItem.findMany for 7 days
      prisma.agendamentoItem.findMany
        .mockResolvedValueOnce([{ preco: 100 }])
        .mockResolvedValueOnce([{ preco: 50 }, { preco: 50 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        // top services call
        .mockResolvedValueOnce([
          { preco: 100, servico: { nome: 'Corte' } },
          { preco: 50, servico: { nome: 'Barba' } },
          { preco: 50, servico: { nome: 'Corte' } },
        ]);

      prisma.agendamento.findMany.mockResolvedValueOnce([
        {
          cliente: { nome: 'João', avatarUrl: null },
          barbeiro: { nome: 'Pedro' },
          itens: [],
          inicio: new Date(),
        },
      ]);

      prisma.membroBarbearia.findMany.mockResolvedValueOnce([
        { usuario: { codigo: 1, nome: 'Pedro', avatarUrl: null } },
      ]);

      const result = await service.getOverview(1);

      expect(result.faturamento7d).toHaveLength(7);
      expect(result.faturamento7d[0]).toHaveProperty('data');
      expect(result.faturamento7d[0]).toHaveProperty('total');
      expect(result.agendamentosHoje).toHaveLength(1);
      expect(result.topServicos[0].nome).toBe('Corte');
      expect(result.topServicos[0].quantidade).toBe(2);
      expect(result.barbeirosAtivos).toHaveLength(1);
    });
  });

  describe('getOverview with no data', () => {
    it('should return zeros and empty arrays', async () => {
      prisma.agendamentoItem.findMany.mockResolvedValue([]);
      prisma.agendamento.findMany.mockResolvedValue([]);
      prisma.membroBarbearia.findMany.mockResolvedValue([]);

      const result = await service.getOverview(1);

      expect(result.faturamento7d).toHaveLength(7);
      result.faturamento7d.forEach((d) => expect(d.total).toBe(0));
      expect(result.agendamentosHoje).toHaveLength(0);
      expect(result.topServicos).toHaveLength(0);
      expect(result.barbeirosAtivos).toHaveLength(0);
    });
  });
});
