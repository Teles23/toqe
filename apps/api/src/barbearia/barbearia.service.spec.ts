import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BarbeariaService } from './barbearia.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

const mockPrisma = createPrismaMock();

describe('BarbeariaService', () => {
  let service: BarbeariaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BarbeariaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(BarbeariaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria barbearia e vincula dono', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);
      const barbearia = { codigo: 1, nome: 'BarberShop', slug: 'bs' };
      mockPrisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => unknown) => {
          const tx = {
            barbearia: { create: jest.fn().mockResolvedValue(barbearia) },
            membroBarbearia: { create: jest.fn().mockResolvedValue({}) },
          };
          return fn(tx);
        },
      );

      const result = await service.create(
        { nome: 'BarberShop', slug: 'bs' },
        10,
      );
      expect(result).toEqual(barbearia);
    });

    it('lança ConflictException se slug duplicado', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({ codigo: 1 });
      await expect(
        service.create({ nome: 'X', slug: 'bs' }, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('retorna barbearia quando encontrada', async () => {
      const barbearia = { codigo: 1, nome: 'BS', slug: 'bs', tema: null };
      mockPrisma.barbearia.findUnique.mockResolvedValue(barbearia);

      const result = await service.findOne(1);
      expect(result).toEqual(barbearia);
    });

    it('lança NotFoundException quando não encontrada', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPublico', () => {
    it('retorna barbearias ativas com dados públicos', async () => {
      const mockList = [
        { codigo: 1, nome: 'Barbearia A', slug: 'a', tema: null },
      ];
      mockPrisma.barbearia.findMany.mockResolvedValue(mockList);
      const result = await service.findPublico();
      expect(result).toEqual(mockList);
      expect(mockPrisma.barbearia.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ativo: true }),
        }),
      );
    });

    it('filtra por nome quando query fornecida', async () => {
      mockPrisma.barbearia.findMany.mockResolvedValue([]);
      await service.findPublico('barber');
      expect(mockPrisma.barbearia.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nome: { contains: 'barber', mode: 'insensitive' },
          }),
        }),
      );
    });
  });
});
