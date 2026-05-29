import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, PrismaMock } from '../test/prisma-mock.factory';
import { Barbearia, PlanoLimite, Prisma } from '../generated/prisma';

describe('AdminService', () => {
  let service: AdminService;
  let mockPrisma: PrismaMock;

  const BAR_SCALAR: Barbearia = {
    codigo: 1,
    nome: 'Barbearia Urban',
    slug: 'urban',
    timezone: 'America/Sao_Paulo',
    slotInterval: 30,
    plano: 'pro',
    planoStatus: 'ativo',
    trialFim: null,
    planoValidoAte: null,
    asaasCustomerId: null,
    asaasSubscriptionId: null,
    bloqueadaEm: null,
    ativo: true,
    barbeiroCriaServico: false,
    barbeiroAlteraPreco: false,
    criadoEm: new Date('2025-01-01'),
  };

  const BARBEARIA_BASE = {
    ...BAR_SCALAR,
    membros: [
      { perfil: 'dono' },
      { perfil: 'barbeiro' },
      { perfil: 'barbeiro' },
    ],
    agendamentos: [{ codigo: 1 }, { codigo: 2 }, { codigo: 3 }],
    tema: null,
  } as unknown as Barbearia;

  const PLANO_LIMITS: PlanoLimite[] = [
    {
      codigo: 1,
      plano: 'free',
      preco: new Prisma.Decimal(0),
      maxBarbeiros: null,
      maxAgdMes: null,
      whiteLabel: false,
      apiPublica: false,
      relatoriosAdv: false,
    },
    {
      codigo: 2,
      plano: 'basic',
      preco: new Prisma.Decimal(89),
      maxBarbeiros: null,
      maxAgdMes: null,
      whiteLabel: false,
      apiPublica: false,
      relatoriosAdv: false,
    },
    {
      codigo: 3,
      plano: 'pro',
      preco: new Prisma.Decimal(189),
      maxBarbeiros: null,
      maxAgdMes: null,
      whiteLabel: false,
      apiPublica: false,
      relatoriosAdv: false,
    },
  ];

  beforeEach(async () => {
    mockPrisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  // ── getMetrics ─────────────────────────────────────────────────────────────

  describe('getMetrics', () => {
    it('calcula MRR, ARR e totais corretamente', async () => {
      mockPrisma.barbearia.findMany.mockResolvedValue([
        {
          ...BAR_SCALAR,
          plano: 'pro',
          planoStatus: 'ativo',
          ativo: true,
          membros: [{ perfil: 'dono' }, { perfil: 'barbeiro' }],
          agendamentos: [{ codigo: 1 }, { codigo: 2 }],
        },
        {
          ...BAR_SCALAR,
          codigo: 2,
          plano: 'basic',
          planoStatus: 'ativo',
          ativo: true,
          membros: [{ perfil: 'dono' }],
          agendamentos: [{ codigo: 3 }],
        },
        {
          ...BAR_SCALAR,
          codigo: 3,
          plano: 'free',
          planoStatus: 'inativo',
          ativo: false,
          membros: [],
          agendamentos: [],
        },
      ] as unknown as Barbearia[]);
      mockPrisma.planoLimite.findMany.mockResolvedValue(PLANO_LIMITS);

      const result = await service.getMetrics();

      expect(result.mrr).toBe(189 + 89); // pro + basic (free está inativo)
      expect(result.arr).toBe((189 + 89) * 12);
      expect(result.totalTenants).toBe(3);
      expect(result.activeTenants).toBe(2); // pro ativo + basic ativo
      expect(result.totalBarbeiros).toBe(3); // dono+barbeiro + dono
      expect(result.totalAgdMes).toBe(3); // 2 + 1
    });
  });

  // ── getBarbearias ──────────────────────────────────────────────────────────

  describe('getBarbearias', () => {
    it('retorna lista sem filtros', async () => {
      mockPrisma.barbearia.findMany.mockResolvedValue([BARBEARIA_BASE]);
      mockPrisma.planoLimite.findMany.mockResolvedValue(PLANO_LIMITS);

      const result = await service.getBarbearias({});

      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Barbearia Urban');
      expect(result[0].mrr).toBe(189);
      expect(result[0].totalBarbeiros).toBe(3);
      expect(result[0].totalAgdMes).toBe(3);
    });

    it('filtra por nome via search', async () => {
      mockPrisma.barbearia.findMany.mockResolvedValue([
        { ...BARBEARIA_BASE, nome: 'Barbearia Urban', slug: 'urban' },
        {
          ...BARBEARIA_BASE,
          nome: 'Corte Fino',
          slug: 'corte-fino',
          codigo: 2,
        },
      ] as unknown as Barbearia[]);
      mockPrisma.planoLimite.findMany.mockResolvedValue(PLANO_LIMITS);

      const result = await service.getBarbearias({ search: 'urban' });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('urban');
    });

    it('MRR é 0 para barbearia não ativa', async () => {
      mockPrisma.barbearia.findMany.mockResolvedValue([
        { ...BARBEARIA_BASE, planoStatus: 'suspenso' },
      ] as unknown as Barbearia[]);
      mockPrisma.planoLimite.findMany.mockResolvedValue(PLANO_LIMITS);

      const result = await service.getBarbearias({});

      expect(result[0].mrr).toBe(0);
    });
  });

  // ── getBarbeariaById ───────────────────────────────────────────────────────

  describe('getBarbeariaById', () => {
    it('retorna detalhe da barbearia', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        ...BARBEARIA_BASE,
        tema: { logoUrl: null, corPrimaria: '#F4B400' },
      } as unknown as Barbearia);
      mockPrisma.planoLimite.findMany.mockResolvedValue(PLANO_LIMITS);

      const result = await service.getBarbeariaById(1);

      expect(result.codigo).toBe(1);
      expect(result.mrr).toBe(189);
      expect(result.corPrimaria).toBe('#F4B400');
    });

    it('lança NotFoundException para ID inexistente', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);
      mockPrisma.planoLimite.findMany.mockResolvedValue(PLANO_LIMITS);

      await expect(service.getBarbeariaById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── updatePlano ────────────────────────────────────────────────────────────

  describe('updatePlano', () => {
    it('atualiza plano da barbearia', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({ ...BAR_SCALAR });
      mockPrisma.barbearia.update.mockResolvedValue({
        ...BAR_SCALAR,
        plano: 'basic',
      });

      const result = await service.updatePlano(1, 'basic');

      expect(mockPrisma.barbearia.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { plano: 'basic' } }),
      );
      expect(result.plano).toBe('basic');
    });

    it('lança NotFoundException para ID inexistente', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);

      await expect(service.updatePlano(999, 'pro')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── updateStatus ───────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('suspende barbearia: seta planoStatus + ativo=false', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({ ...BAR_SCALAR });
      mockPrisma.barbearia.update.mockResolvedValue({
        ...BAR_SCALAR,
        planoStatus: 'suspenso',
        ativo: false,
      });

      const result = await service.updateStatus(1, 'suspenso');

      const callArgs = (
        mockPrisma.barbearia.update.mock.calls[0] as [
          { data: { planoStatus: string; ativo: boolean } },
        ]
      )[0];
      expect(callArgs.data.planoStatus).toBe('suspenso');
      expect(callArgs.data.ativo).toBe(false);
      expect(result.ativo).toBe(false);
    });

    it('reativa barbearia: seta planoStatus=ativo + ativo=true', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({ ...BAR_SCALAR });
      mockPrisma.barbearia.update.mockResolvedValue({
        ...BAR_SCALAR,
        planoStatus: 'ativo',
        ativo: true,
      });

      await service.updateStatus(1, 'ativo');

      const callArgs2 = (
        mockPrisma.barbearia.update.mock.calls[0] as [
          { data: { planoStatus: string; ativo: boolean } },
        ]
      )[0];
      expect(callArgs2.data.planoStatus).toBe('ativo');
      expect(callArgs2.data.ativo).toBe(true);
    });

    it('lança NotFoundException para ID inexistente (updateStatus)', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'ativo')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
