import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuarioService } from '../usuario/usuario.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';
import * as bcrypt from 'bcrypt';

const mockPrisma = createPrismaMock();

const mockUsuarioService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('access-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('delega ao UsuarioService.create', async () => {
      const dto = { nome: 'João', email: 'joao@test.com', senha: '123456' };
      mockUsuarioService.create.mockResolvedValue({ codigo: 1, ...dto });
      const result = await service.register(dto);
      expect(mockUsuarioService.create).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('codigo', 1);
    });
  });

  describe('login', () => {
    it('retorna tokens para credenciais válidas', async () => {
      const senhaHash = await bcrypt.hash('senha123', 10);
      mockUsuarioService.findByEmail.mockResolvedValue({
        codigo: 1, nome: 'João', email: 'joao@test.com', senhaHash,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'joao@test.com', senha: 'senha123' });
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('lança UnauthorizedException se usuário não existe', async () => {
      mockUsuarioService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', senha: 'abc' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException se senha incorreta', async () => {
      const senhaHash = await bcrypt.hash('correta', 10);
      mockUsuarioService.findByEmail.mockResolvedValue({
        codigo: 1, nome: 'João', email: 'joao@test.com', senhaHash,
      });
      await expect(service.login({ email: 'joao@test.com', senha: 'errada' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('lança UnauthorizedException se token não encontrado', async () => {
      mockPrisma.refreshToken.findMany.mockResolvedValue([]);
      await expect(service.refresh({ refreshToken: 'invalido' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('rotaciona token válido e retorna novos tokens', async () => {
      const plainToken = 'mytoken';
      const hash = await bcrypt.hash(plainToken, 10);
      mockPrisma.refreshToken.findMany.mockResolvedValue([
        { codigo: 99, hash, usrCodigo: 1, revogado: false, expiraEm: new Date(Date.now() + 1000) },
      ]);
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockUsuarioService.findById.mockResolvedValue({ codigo: 1, nome: 'João', email: 'j@j.com' });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh({ refreshToken: plainToken });
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { codigo: 99 } }),
      );
      expect(result).toHaveProperty('access_token');
    });
  });

  describe('logout', () => {
    it('revoga o refresh token do usuário', async () => {
      const plainToken = 'logouttoken';
      const hash = await bcrypt.hash(plainToken, 10);
      mockPrisma.refreshToken.findMany.mockResolvedValue([
        { codigo: 10, hash, usrCodigo: 1, revogado: false },
      ]);
      mockPrisma.refreshToken.update.mockResolvedValue({});

      const result = await service.logout(1, { refreshToken: plainToken });
      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
    });

    it('lança UnauthorizedException se token inválido', async () => {
      mockPrisma.refreshToken.findMany.mockResolvedValue([]);
      await expect(service.logout(1, { refreshToken: 'invalid' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
