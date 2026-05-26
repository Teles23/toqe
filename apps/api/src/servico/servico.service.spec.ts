import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ServicoService } from './servico.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';

const mockPrisma = createPrismaMock();

describe('ServicoService', () => {
  let service: ServicoService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServicoService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ServicoService);
  });

  afterEach(() => jest.clearAllMocks());

  const barCodigo = 1;

  describe('create', () => {
    it('cria serviço com os dados corretos', async () => {
      const dto: CreateServicoDto = {
        nome: 'Corte',
        duracaoBase: 30,
        precoBase: 25,
      };
      const created = { codigo: 1, ...dto, barCodigo, ativo: true };
      mockPrisma.servico.create.mockResolvedValue(created);

      const result = await service.create(dto, barCodigo);
      expect(mockPrisma.servico.create).toHaveBeenCalledWith({
        data: { ...dto, barCodigo },
      });
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('retorna apenas serviços ativos da barbearia', async () => {
      mockPrisma.servico.findMany.mockResolvedValue([{ codigo: 1 }]);
      await service.findAll(barCodigo);
      expect(mockPrisma.servico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { barCodigo, ativo: true } }),
      );
    });
  });

  describe('findOne', () => {
    it('retorna serviço quando encontrado', async () => {
      const srv = { codigo: 5, nome: 'Barba', barCodigo };
      mockPrisma.servico.findFirst.mockResolvedValue(srv);
      const result = await service.findOne(5, barCodigo);
      expect(result).toEqual(srv);
    });

    it('lança NotFoundException quando não encontrado', async () => {
      mockPrisma.servico.findFirst.mockResolvedValue(null);
      await expect(service.findOne(999, barCodigo)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza e retorna serviço', async () => {
      const srv = { codigo: 5, nome: 'Barba', barCodigo };
      mockPrisma.servico.findFirst.mockResolvedValue(srv);
      mockPrisma.servico.update.mockResolvedValue({
        ...srv,
        nome: 'Barba Premium',
      });

      const updateDto: UpdateServicoDto = { nome: 'Barba Premium' };
      const result = await service.update(5, updateDto, barCodigo);
      expect(result.nome).toBe('Barba Premium');
    });
  });

  describe('remove', () => {
    it('faz soft delete setando ativo: false', async () => {
      const srv = { codigo: 5, barCodigo, ativo: true };
      mockPrisma.servico.findFirst.mockResolvedValue(srv);
      mockPrisma.servico.update.mockResolvedValue({ ...srv, ativo: false });

      const result = await service.remove(5, barCodigo);
      expect(mockPrisma.servico.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { ativo: false } }),
      );
      expect(result.ativo).toBe(false);
    });
  });

  describe('getMetricas', () => {
    it('retorna métricas calculadas do mês atual', async () => {
      mockPrisma.servico.count.mockResolvedValue(5);
      mockPrisma.agendamento.findMany.mockResolvedValue([
        { itens: [{ preco: '50.00' }, { preco: '30.00' }] },
        { itens: [{ preco: '100.00' }] },
      ]);

      const result = await service.getMetricas(1);

      expect(result.totalAtivos).toBe(5);
      expect(result.pedidosMes).toBe(2);
      expect(result.receitaMes).toBeCloseTo(180);
      expect(result.ticketMedio).toBeCloseTo(90);
    });

    it('retorna ticketMedio 0 quando não há pedidos', async () => {
      mockPrisma.servico.count.mockResolvedValue(3);
      mockPrisma.agendamento.findMany.mockResolvedValue([]);

      const result = await service.getMetricas(1);

      expect(result.pedidosMes).toBe(0);
      expect(result.ticketMedio).toBe(0);
    });
  });

  // ─── Serviços do barbeiro ───────────────────────────────────────────────────

  describe('findServicosBarbeiro', () => {
    it('mescla serviços da barbearia com os registros do barbeiro', async () => {
      mockPrisma.servico.findMany.mockResolvedValue([
        {
          codigo: 1,
          nome: 'Corte',
          precoBase: 40,
          duracaoBase: 30,
          exclusivoBarbeiroId: null,
        },
        {
          codigo: 2,
          nome: 'Selagem',
          precoBase: 80,
          duracaoBase: 60,
          exclusivoBarbeiroId: 7,
        },
      ]);
      mockPrisma.barbeiroServico.findMany.mockResolvedValue([
        { srvCodigo: 1, precoProprio: 55, duracaoMin: 45, ativo: true },
      ]);

      const r = await service.findServicosBarbeiro(barCodigo, 7);

      const corte = r.find((x) => x.servico.codigo === 1)!;
      const selagem = r.find((x) => x.servico.codigo === 2)!;

      // Corte: tem registro → preço/duração próprios
      expect(corte.precoEfetivo).toBe(55);
      expect(corte.duracaoEfetiva).toBe(45);
      expect(corte.barbeiro).toEqual({
        precoProprio: 55,
        duracaoMin: 45,
        ativo: true,
      });
      expect(corte.exclusivo).toBe(false);

      // Selagem: sem registro → usa base, barbeiro null, é exclusivo
      expect(selagem.precoEfetivo).toBe(80);
      expect(selagem.duracaoEfetiva).toBe(60);
      expect(selagem.barbeiro).toBeNull();
      expect(selagem.exclusivo).toBe(true);
    });

    it('ordena ativos antes de inativos', async () => {
      mockPrisma.servico.findMany.mockResolvedValue([
        {
          codigo: 1,
          nome: 'A',
          precoBase: 10,
          duracaoBase: 20,
          exclusivoBarbeiroId: null,
        },
        {
          codigo: 2,
          nome: 'B',
          precoBase: 10,
          duracaoBase: 20,
          exclusivoBarbeiroId: null,
        },
      ]);
      mockPrisma.barbeiroServico.findMany.mockResolvedValue([
        { srvCodigo: 1, precoProprio: null, duracaoMin: 20, ativo: false },
      ]);

      const r = await service.findServicosBarbeiro(barCodigo, 7);
      // B (ativo por padrão) vem antes de A (desativado)
      expect(r[0].servico.codigo).toBe(2);
      expect(r[1].servico.codigo).toBe(1);
    });
  });

  describe('toggleServicoBarbeiro', () => {
    it('faz upsert criando com duracaoMin da base quando não existe', async () => {
      mockPrisma.servico.findFirst.mockResolvedValue({
        codigo: 5,
        barCodigo,
        duracaoBase: 25,
      });
      mockPrisma.barbeiroServico.upsert.mockResolvedValue({});

      await service.toggleServicoBarbeiro(barCodigo, 7, 5, false);

      expect(mockPrisma.barbeiroServico.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { barbeiroId_srvCodigo: { barbeiroId: 7, srvCodigo: 5 } },
          update: { ativo: false },
          create: {
            barCodigo,
            barbeiroId: 7,
            srvCodigo: 5,
            ativo: false,
            duracaoMin: 25,
          },
        }),
      );
    });
  });

  describe('atualizarServicoBarbeiro', () => {
    it('barbeiro SEM permissão (flag false) → 403', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        barbeiroAlteraPreco: false,
        barbeiroCriaServico: false,
      });
      await expect(
        service.atualizarServicoBarbeiro(
          barCodigo,
          7,
          5,
          { precoProprio: 50, duracaoMin: 30 },
          'barbeiro',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('dono altera mesmo com flag false (upsert)', async () => {
      mockPrisma.servico.findFirst.mockResolvedValue({ codigo: 5, barCodigo });
      mockPrisma.barbeiroServico.upsert.mockResolvedValue({});

      await service.atualizarServicoBarbeiro(
        barCodigo,
        7,
        5,
        { precoProprio: 50, duracaoMin: 30 },
        'dono',
      );
      expect(mockPrisma.barbeiroServico.upsert).toHaveBeenCalled();
      // dono não consulta flag da barbearia
      expect(mockPrisma.barbearia.findUnique).not.toHaveBeenCalled();
    });

    it('barbeiro COM permissão (flag true) consegue alterar', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        barbeiroAlteraPreco: true,
        barbeiroCriaServico: false,
      });
      mockPrisma.servico.findFirst.mockResolvedValue({ codigo: 5, barCodigo });
      mockPrisma.barbeiroServico.upsert.mockResolvedValue({});

      await service.atualizarServicoBarbeiro(
        barCodigo,
        7,
        5,
        { precoProprio: null, duracaoMin: 40 },
        'barbeiro',
      );
      expect(mockPrisma.barbeiroServico.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { precoProprio: null, duracaoMin: 40 },
        }),
      );
    });
  });

  describe('criarServicoExclusivo', () => {
    it('lança 409 quando já existe serviço com o mesmo nome', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        barbeiroAlteraPreco: false,
        barbeiroCriaServico: true,
      });
      mockPrisma.servico.findFirst.mockResolvedValue({
        codigo: 9,
        nome: 'Corte',
      });

      await expect(
        service.criarServicoExclusivo(
          barCodigo,
          7,
          { nome: 'Corte', precoBase: 40, duracaoBase: 30 },
          'barbeiro',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('cria com exclusivoBarbeiroId quando permitido e nome livre', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        barbeiroAlteraPreco: false,
        barbeiroCriaServico: true,
      });
      mockPrisma.servico.findFirst.mockResolvedValue(null);
      mockPrisma.servico.create.mockResolvedValue({ codigo: 10 });

      await service.criarServicoExclusivo(
        barCodigo,
        7,
        { nome: 'Navalhado', precoBase: 60, duracaoBase: 45 },
        'barbeiro',
      );
      expect(mockPrisma.servico.create).toHaveBeenCalledWith({
        data: {
          nome: 'Navalhado',
          precoBase: 60,
          duracaoBase: 45,
          barCodigo,
          exclusivoBarbeiroId: 7,
        },
      });
    });

    it('barbeiro sem permissão de criar → 403', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        barbeiroAlteraPreco: false,
        barbeiroCriaServico: false,
      });
      await expect(
        service.criarServicoExclusivo(
          barCodigo,
          7,
          { nome: 'X', precoBase: 10, duracaoBase: 20 },
          'barbeiro',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
