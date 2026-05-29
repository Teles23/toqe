import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ContatoService } from './contato.service';
import { createPrismaMock, PrismaMock } from '../test/prisma-mock.factory';

describe('ContatoService', () => {
  let service: ContatoService;
  let mockPrisma: PrismaMock;

  beforeEach(async () => {
    mockPrisma = createPrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        ContatoService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ContatoService);
  });

  describe('findOrCreate', () => {
    it('cria novo contato quando telefone não é fornecido', async () => {
      const created = {
        codigo: 1,
        barCodigo: 7,
        nome: 'Ana',
        telefone: null,
        criadoEm: new Date(),
      };
      mockPrisma.contato.create.mockResolvedValueOnce(created);

      const result = await service.findOrCreate(7, { nome: 'Ana' });

      expect(mockPrisma.contato.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.contato.create).toHaveBeenCalledWith({
        data: { barCodigo: 7, nome: 'Ana', telefone: null },
      });
      expect(result).toEqual(created);
    });

    it('reutiliza contato existente com mesmo telefone (dedup)', async () => {
      const existing = {
        codigo: 5,
        barCodigo: 7,
        nome: 'João',
        telefone: '+5511999',
        criadoEm: new Date(),
      };
      mockPrisma.contato.findFirst.mockResolvedValueOnce(existing);

      const result = await service.findOrCreate(7, {
        nome: 'João Silva',
        telefone: '+5511999',
      });

      expect(mockPrisma.contato.findFirst).toHaveBeenCalledWith({
        where: { barCodigo: 7, telefone: '+5511999' },
      });
      expect(mockPrisma.contato.create).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('cria novo contato quando telefone fornecido não existe na barbearia', async () => {
      mockPrisma.contato.findFirst.mockResolvedValueOnce(null);
      const created = {
        codigo: 9,
        barCodigo: 7,
        nome: 'Maria',
        telefone: '+5511888',
        criadoEm: new Date(),
      };
      mockPrisma.contato.create.mockResolvedValueOnce(created);

      const result = await service.findOrCreate(7, {
        nome: 'Maria',
        telefone: '+5511888',
      });

      expect(mockPrisma.contato.findFirst).toHaveBeenCalledWith({
        where: { barCodigo: 7, telefone: '+5511888' },
      });
      expect(mockPrisma.contato.create).toHaveBeenCalledWith({
        data: { barCodigo: 7, nome: 'Maria', telefone: '+5511888' },
      });
      expect(result).toEqual(created);
    });

    it('telefone vazio ("") é tratado como null (sem dedup)', async () => {
      const created = {
        codigo: 3,
        barCodigo: 7,
        nome: 'Carlos',
        telefone: null,
        criadoEm: new Date(),
      };
      mockPrisma.contato.create.mockResolvedValueOnce(created);

      await service.findOrCreate(7, { nome: 'Carlos', telefone: '' });

      expect(mockPrisma.contato.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.contato.create).toHaveBeenCalledWith({
        data: { barCodigo: 7, nome: 'Carlos', telefone: null },
      });
    });

    it('usa o tx injetado em vez do prisma padrão quando fornecido', async () => {
      const txMock = {
        contato: {
          findFirst: jest.fn().mockResolvedValueOnce(null),
          create: jest.fn().mockResolvedValueOnce({
            codigo: 2,
            barCodigo: 7,
            nome: 'X',
            telefone: '123',
          }),
        },
      };

      await service.findOrCreate(
        7,
        { nome: 'X', telefone: '123' },
        txMock as never,
      );

      expect(txMock.contato.findFirst).toHaveBeenCalled();
      expect(txMock.contato.create).toHaveBeenCalled();
      expect(mockPrisma.contato.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('retorna contato quando encontrado', async () => {
      const contato = {
        codigo: 5,
        barCodigo: 7,
        nome: 'Ana',
        telefone: null,
        criadoEm: new Date(),
      };
      mockPrisma.contato.findFirst.mockResolvedValueOnce(contato);

      const result = await service.findById(5, 7);

      expect(mockPrisma.contato.findFirst).toHaveBeenCalledWith({
        where: { codigo: 5, barCodigo: 7 },
      });
      expect(result).toEqual(contato);
    });

    it('lança NotFoundException quando não encontrado', async () => {
      mockPrisma.contato.findFirst.mockResolvedValueOnce(null);

      await expect(service.findById(99, 7)).rejects.toThrow(NotFoundException);
    });

    it('isolamento de tenant: não devolve contato de outra barbearia', async () => {
      mockPrisma.contato.findFirst.mockResolvedValueOnce(null);

      await expect(service.findById(5, 99)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.contato.findFirst).toHaveBeenCalledWith({
        where: { codigo: 5, barCodigo: 99 },
      });
    });
  });
});
