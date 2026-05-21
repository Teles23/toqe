import { Test } from '@nestjs/testing';
import { MeService } from './me.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';
import { Prisma } from '../generated/prisma';

const mockPrisma = createPrismaMock();

const toDecimal = (value: number): Prisma.Decimal => new Prisma.Decimal(value);

describe('MeService', () => {
  let service: MeService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MeService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(MeService);
  });

  afterEach(() => jest.clearAllMocks());

  const userId = 10;

  describe('getStats', () => {
    it('retorna stats corretos para barbeiro com agendamentos concluídos', async () => {
      const concluido = {
        status: 'concluido',
        itens: [{ preco: toDecimal(40) }, { preco: toDecimal(8) }],
      };
      mockPrisma.agendamento.findMany.mockResolvedValue([concluido, concluido]);

      const result = await service.getStats(userId, 'mes');

      expect(result.atendimentos).toBe(2);
      // 2 agendamentos × 48 reais = 9600 centavos
      expect(result.faturamento).toBe(9600);
      // presença: 2 concluídos / (2+0) = 1.0
      expect(result.presenca).toBe(1.0);
      // ticketMedio: 9600 / 2 = 4800
      expect(result.ticketMedio).toBe(4800);
    });

    it('calcula presença corretamente com no_shows', async () => {
      const concluido = {
        status: 'concluido',
        itens: [{ preco: toDecimal(50) }],
      };
      const noShow = { status: 'no_show', itens: [] };
      mockPrisma.agendamento.findMany.mockResolvedValue([
        concluido,
        concluido,
        noShow,
      ]);

      const result = await service.getStats(userId, 'semana');

      expect(result.atendimentos).toBe(2);
      // presença: 2 / (2+1) ≈ 0.67
      expect(result.presenca).toBe(0.67);
    });

    it('retorna zeros e presença 1.0 quando não há agendamentos', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([]);

      const result = await service.getStats(userId, 'mes');

      expect(result.atendimentos).toBe(0);
      expect(result.faturamento).toBe(0);
      expect(result.presenca).toBe(1.0);
      expect(result.ticketMedio).toBe(0);
    });

    it('aceita periodo=semana sem erro', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([]);
      await expect(service.getStats(userId, 'semana')).resolves.toBeDefined();
    });
  });
});
