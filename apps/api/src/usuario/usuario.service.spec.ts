import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const mockPrisma = createPrismaMock();

describe('UsuarioService', () => {
  let service: UsuarioService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsuarioService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(UsuarioService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('cria usuário com sucesso', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.usuario.create.mockResolvedValue({
        codigo: 1,
        nome: 'Ana',
        email: 'ana@test.com',
      });

      const result = await service.create({
        nome: 'Ana',
        email: 'ana@test.com',
        senha: 'abc123',
      });
      expect(result).toHaveProperty('codigo', 1);
    });

    it('lança ConflictException se email já cadastrado', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({ codigo: 1 });
      await expect(
        service.create({ nome: 'Ana', email: 'ana@test.com', senha: 'abc123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('retorna usuário pelo email', async () => {
      const user = { codigo: 1, email: 'a@a.com' };
      mockPrisma.usuario.findUnique.mockResolvedValue(user);
      const result = await service.findByEmail('a@a.com');
      expect(result).toEqual(user);
    });
  });

  describe('findById', () => {
    it('retorna usuário pelo código', async () => {
      const user = { codigo: 5, nome: 'Pedro' };
      mockPrisma.usuario.findUnique.mockResolvedValue(user);
      const result = await service.findById(5);
      expect(result).toEqual(user);
    });
  });

  describe('me', () => {
    it('retorna perfil completo com barbearias (transforma membros → barbearias)', async () => {
      const user = {
        codigo: 1,
        nome: 'Ana',
        membros: [
          {
            perfil: 'dono',
            barbearia: { codigo: 1, nome: 'Bar', slug: 'bar' },
          },
        ],
      };
      mockPrisma.usuario.findUnique.mockResolvedValue(user);
      const result = await service.me(1);
      expect(result).toHaveProperty('barbearias');
      expect(result.barbearias).toHaveLength(1);
      expect(result.barbearias[0]).toHaveProperty('perfil', 'dono');
    });

    it('lança NotFoundException se usuário não existe', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      await expect(service.me(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('atualiza perfil do usuário', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 1,
        nome: 'Ana',
        membros: [],
      });
      mockPrisma.usuario.update.mockResolvedValue({
        codigo: 1,
        nome: 'Ana Nova',
      });

      const updateDto: UpdateUsuarioDto = { nome: 'Ana Nova' };
      const result = await service.update(1, updateDto);
      expect(result.nome).toBe('Ana Nova');
    });
  });
});
