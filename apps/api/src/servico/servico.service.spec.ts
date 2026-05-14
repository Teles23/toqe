import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServicoService } from './servico.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

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
      const dto = { nome: 'Corte', duracaoBase: 30, precoBase: 25 };
      const created = { codigo: 1, ...dto, barCodigo, ativo: true };
      mockPrisma.servico.create.mockResolvedValue(created);

      const result = await service.create(dto as any, barCodigo);
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

      const result = await service.update(
        5,
        { nome: 'Barba Premium' } as any,
        barCodigo,
      );
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
});
