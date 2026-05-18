import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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
});
