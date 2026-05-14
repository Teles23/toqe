import { RelatorioService } from './relatorio.service';
import { createPrismaMock } from '../test/prisma-mock.factory';
import type { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma';

function d(value: number) {
  return new Prisma.Decimal(value);
}

describe('RelatorioService', () => {
  let service: RelatorioService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new RelatorioService(prisma as unknown as PrismaService);
  });

  describe('faturamento', () => {
    it('should group items by day and return sorted array', async () => {
      const d1 = new Date('2025-01-01T10:00:00Z');
      const d2 = new Date('2025-01-02T10:00:00Z');
      prisma.agendamentoItem.findMany.mockResolvedValueOnce([
        { preco: d(100), agendamento: { inicio: d2 } },
        { preco: d(50), agendamento: { inicio: d1 } },
        { preco: d(75), agendamento: { inicio: d1 } },
      ]);

      const result = await service.faturamento(1, '30d');

      expect(result).toHaveLength(2);
      expect(result[0].data).toBe('2025-01-01');
      expect(result[0].total).toBe(125);
      expect(result[1].total).toBe(100);
    });

    it('should return empty when no items', async () => {
      prisma.agendamentoItem.findMany.mockResolvedValueOnce([]);
      const result = await service.faturamento(1, '7d');
      expect(result).toEqual([]);
    });
  });

  describe('agendamentos', () => {
    it('should group by day and status', async () => {
      const d1 = new Date('2025-01-01T10:00:00Z');
      prisma.agendamento.findMany.mockResolvedValueOnce([
        { inicio: d1, status: 'concluido' },
        { inicio: d1, status: 'cancelado' },
        { inicio: d1, status: 'concluido' },
      ]);

      const result = await service.agendamentos(1, '30d');

      expect(result).toHaveLength(1);
      expect(result[0].concluido).toBe(2);
      expect(result[0].cancelado).toBe(1);
      expect(result[0].no_show).toBe(0);
    });

    it('should return empty array when no agendamentos', async () => {
      prisma.agendamento.findMany.mockResolvedValueOnce([]);
      const result = await service.agendamentos(1, '7d');
      expect(result).toEqual([]);
    });
  });

  describe('servicos', () => {
    it('should aggregate and sort by quantity', async () => {
      prisma.agendamentoItem.findMany.mockResolvedValueOnce([
        { preco: d(50), servico: { nome: 'Barba' } },
        { preco: d(100), servico: { nome: 'Corte' } },
        { preco: d(100), servico: { nome: 'Corte' } },
      ]);

      const result = await service.servicos(1, '30d');

      expect(result[0].nome).toBe('Corte');
      expect(result[0].quantidade).toBe(2);
      expect(result[0].total).toBe(200);
    });

    it('should return empty array when no items', async () => {
      prisma.agendamentoItem.findMany.mockResolvedValueOnce([]);
      const result = await service.servicos(1, '7d');
      expect(result).toEqual([]);
    });
  });

  describe('barbeiros', () => {
    it('should return ranked barbeiros by faturamento', async () => {
      prisma.membroBarbearia.findMany.mockResolvedValueOnce([
        {
          usrCodigo: 10,
          usuario: { codigo: 10, nome: 'Pedro', avatarUrl: null },
        },
        {
          usrCodigo: 11,
          usuario: { codigo: 11, nome: 'João', avatarUrl: null },
        },
      ]);

      prisma.agendamento.findMany
        .mockResolvedValueOnce([
          { itens: [{ preco: d(100) }, { preco: d(50) }] },
        ]) // Pedro: faturamento=150
        .mockResolvedValueOnce([
          { itens: [{ preco: d(200) }] },
          { itens: [{ preco: d(100) }] },
        ]); // João: faturamento=300

      const result = await service.barbeiros(1, '30d');

      expect(result[0].nome).toBe('João');
      expect(result[0].faturamento).toBe(300);
      expect(result[1].nome).toBe('Pedro');
    });

    it('should return empty when no barbeiros', async () => {
      prisma.membroBarbearia.findMany.mockResolvedValueOnce([]);
      const result = await service.barbeiros(1, '30d');
      expect(result).toEqual([]);
    });
  });

  describe('horariosPico', () => {
    it('should return 24 hours with counts', async () => {
      const d10 = new Date('2025-01-01T10:30:00Z');
      const d14 = new Date('2025-01-01T14:00:00Z');
      prisma.agendamento.findMany.mockResolvedValueOnce([
        { inicio: d10 },
        { inicio: d10 },
        { inicio: d14 },
      ]);

      const result = await service.horariosPico(1, '30d');

      expect(result).toHaveLength(24);
      const h10 = result.find((r) => r.hora === 10);
      expect(h10?.quantidade).toBe(2);
      const h14 = result.find((r) => r.hora === 14);
      expect(h14?.quantidade).toBe(1);
    });

    it('should return all zeros when no agendamentos', async () => {
      prisma.agendamento.findMany.mockResolvedValueOnce([]);
      const result = await service.horariosPico(1, '30d');
      expect(result).toHaveLength(24);
      result.forEach((r) => expect(r.quantidade).toBe(0));
    });
  });
});
