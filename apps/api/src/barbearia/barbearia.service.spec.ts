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
        expect.objectContaining({ where: { ativo: true } }),
      );
    });

    it('filtra por nome quando query fornecida', async () => {
      mockPrisma.barbearia.findMany.mockResolvedValue([]);
      await service.findPublico('barber');
      expect(mockPrisma.barbearia.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ativo: true,
            nome: { contains: 'barber', mode: 'insensitive' },
          },
        }),
      );
    });
  });

  describe('getHorarios', () => {
    it('retorna horários da barbearia ordenados por diaSemana', async () => {
      const barbearia = { codigo: 1, nome: 'BS', slug: 'bs', tema: null };
      const horarios = [
        {
          codigo: 1,
          barCodigo: 1,
          diaSemana: 1,
          aberto: true,
          abertura: '09:00',
          fechamento: '19:00',
        },
        {
          codigo: 2,
          barCodigo: 1,
          diaSemana: 2,
          aberto: true,
          abertura: '09:00',
          fechamento: '19:00',
        },
      ];
      mockPrisma.barbearia.findUnique.mockResolvedValue(barbearia);
      mockPrisma.horarioFuncionamento.findMany.mockResolvedValue(horarios);

      const result = await service.getHorarios(1);
      expect(result).toEqual(horarios);
      expect(mockPrisma.horarioFuncionamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { barCodigo: 1 } }),
      );
    });

    it('lança NotFoundException se barbearia não existe', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);
      await expect(service.getHorarios(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('upsertHorarios', () => {
    it('faz upsert de todos os dias enviados e retorna lista atualizada', async () => {
      const barbearia = { codigo: 1, nome: 'BS', slug: 'bs', tema: null };
      const horarioSalvo = {
        codigo: 1,
        barCodigo: 1,
        diaSemana: 1,
        aberto: true,
        abertura: '09:00',
        fechamento: '19:00',
      };

      mockPrisma.barbearia.findUnique.mockResolvedValue(barbearia);
      mockPrisma.$transaction.mockResolvedValue([horarioSalvo]);
      mockPrisma.horarioFuncionamento.findMany.mockResolvedValue([
        horarioSalvo,
      ]);

      const dto = [
        { diaSemana: 1, aberto: true, abertura: '09:00', fechamento: '19:00' },
      ];
      const result = await service.upsertHorarios(1, dto as never);
      expect(result).toEqual([horarioSalvo]);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('lança NotFoundException se barbearia não existe', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);
      await expect(service.upsertHorarios(99, [] as never)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
