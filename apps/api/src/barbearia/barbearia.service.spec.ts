import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
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
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          barbearia: { create: jest.fn().mockResolvedValue(barbearia) },
          membroBarbearia: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const result = await service.create({ nome: 'BarberShop', slug: 'bs' }, 10);
      expect(result).toEqual(barbearia);
    });

    it('lança ConflictException se slug duplicado', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({ codigo: 1 });
      await expect(service.create({ nome: 'X', slug: 'bs' }, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('convidarMembro', () => {
    it('convida membro com sucesso', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({ codigo: 5, email: 'x@x.com' });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        barCodigo: 1, usrCodigo: 5, perfil: 'barbeiro',
        usuario: { codigo: 5, nome: 'X', email: 'x@x.com' },
      });

      const result = await service.convidarMembro(1, { email: 'x@x.com', perfil: 'barbeiro' });
      expect(result).toHaveProperty('perfil', 'barbeiro');
    });

    it('lança NotFoundException se usuário não existe', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      await expect(service.convidarMembro(1, { email: 'nope@x.com', perfil: 'barbeiro' }))
        .rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException se já é membro', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({ codigo: 5 });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue({ barCodigo: 1, usrCodigo: 5 });
      await expect(service.convidarMembro(1, { email: 'x@x.com', perfil: 'barbeiro' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('removerMembro', () => {
    it('remove membro com sucesso', async () => {
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue({ barCodigo: 1, usrCodigo: 5, perfil: 'barbeiro' });
      mockPrisma.membroBarbearia.delete.mockResolvedValue({ barCodigo: 1, usrCodigo: 5 });

      const result = await service.removerMembro(1, 5);
      expect(mockPrisma.membroBarbearia.delete).toHaveBeenCalled();
    });

    it('lança NotFoundException se membro não existe', async () => {
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      await expect(service.removerMembro(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException ao tentar remover dono', async () => {
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue({ barCodigo: 1, usrCodigo: 1, perfil: 'dono' });
      await expect(service.removerMembro(1, 1)).rejects.toThrow(BadRequestException);
    });
  });
});
