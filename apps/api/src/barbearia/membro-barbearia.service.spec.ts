import { Test } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MembroBarbeariaService } from './membro-barbearia.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';
import { PerfilMembro } from './dto/convidar-membro.dto';

const mockPrisma = createPrismaMock();

describe('MembroBarbeariaService', () => {
  let service: MembroBarbeariaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MembroBarbeariaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(MembroBarbeariaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOrCreateCliente', () => {
    const dto = { nome: 'João', email: 'joao@x.com' };

    it('reaproveita usuário+membro existentes (cliente recorrente)', async () => {
      const usuario = { codigo: 99, email: dto.email };
      const membroExistente = {
        usrCodigo: 99,
        barCodigo: 1,
        perfil: 'cliente',
        usuario: { codigo: 99, nome: 'João', email: dto.email },
      };
      mockPrisma.usuario.findUnique.mockResolvedValue(usuario);
      mockPrisma.membroBarbearia.findUnique
        .mockResolvedValueOnce({ usrCodigo: 99 }) // upsertClienteUsuario
        .mockResolvedValueOnce(membroExistente); // re-busca para retornar com include

      const result = await service.findOrCreateCliente(1, dto);
      expect(result).toBe(membroExistente);
      expect(mockPrisma.membroBarbearia.create).not.toHaveBeenCalled();
    });

    it('cria usuário + membro quando email novo', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.usuario.create.mockResolvedValue({
        codigo: 200,
        email: dto.email,
      });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        usrCodigo: 200,
        barCodigo: 1,
        perfil: 'cliente',
        usuario: { codigo: 200, nome: dto.nome, email: dto.email },
      });

      const result = await service.findOrCreateCliente(1, dto);
      expect(result).toHaveProperty('perfil', 'cliente');
      expect(mockPrisma.usuario.create).toHaveBeenCalled();
      expect(mockPrisma.membroBarbearia.create).toHaveBeenCalled();
    });

    it('cria membro quando usuário já existe mas nunca foi cliente', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 50,
        email: dto.email,
      });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        usrCodigo: 50,
        barCodigo: 1,
        perfil: 'cliente',
        usuario: { codigo: 50, nome: dto.nome, email: dto.email },
      });

      const result = await service.findOrCreateCliente(1, dto);
      expect(result).toHaveProperty('perfil', 'cliente');
      expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
      expect(mockPrisma.membroBarbearia.create).toHaveBeenCalled();
    });
  });

  describe('convidarMembro', () => {
    it('convida membro com sucesso', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 5,
        email: 'x@x.com',
      });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 5,
        perfil: PerfilMembro.BARBEIRO,
        usuario: { codigo: 5, nome: 'X', email: 'x@x.com' },
      });

      const result = await service.convidarMembro(1, {
        email: 'x@x.com',
        perfil: PerfilMembro.BARBEIRO,
      });
      expect(result).toHaveProperty('perfil', 'barbeiro');
    });

    it('lança NotFoundException se usuário não existe', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      await expect(
        service.convidarMembro(1, {
          email: 'nope@x.com',
          perfil: PerfilMembro.BARBEIRO,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException se já é membro', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({ codigo: 5 });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 5,
      });
      await expect(
        service.convidarMembro(1, {
          email: 'x@x.com',
          perfil: PerfilMembro.BARBEIRO,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removerMembro', () => {
    it('remove membro com sucesso', async () => {
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 5,
        perfil: PerfilMembro.BARBEIRO,
      });
      mockPrisma.membroBarbearia.delete.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 5,
      });

      await service.removerMembro(1, 5);
      expect(mockPrisma.membroBarbearia.delete).toHaveBeenCalled();
    });

    it('lança NotFoundException se membro não existe', async () => {
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      await expect(service.removerMembro(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança BadRequestException ao tentar remover dono', async () => {
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 1,
        perfil: 'dono',
      });
      await expect(service.removerMembro(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findMembros', () => {
    it('retorna membros da barbearia ordenados por perfil', async () => {
      const membros = [
        { usrCodigo: 1, perfil: 'barbeiro', usuario: { nome: 'João' } },
      ];
      mockPrisma.membroBarbearia.findMany.mockResolvedValue(membros);

      const result = await service.findMembros(1);
      expect(result).toEqual(membros);
      expect(mockPrisma.membroBarbearia.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { perfil: 'asc' } }),
      );
    });
  });
});
