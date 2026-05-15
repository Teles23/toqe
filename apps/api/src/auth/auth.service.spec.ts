import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsuarioService } from '../usuario/usuario.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';

const mockUsuario = {
  codigo: 1,
  nome: 'João Silva',
  email: 'joao@example.com',
  senhaHash: 'hashed_password',
  telefone: null,
  avatarUrl: null,
  ativo: true,
  criadoEm: new Date('2024-01-01'),
};

const mockRefreshToken = {
  codigo: 10,
  usrCodigo: 1,
  hash: 'hashed_rt',
  revogado: false,
  expiraEm: new Date(Date.now() + 86400000),
};

describe('AuthService', () => {
  let service: AuthService;
  let usuarioService: jest.Mocked<UsuarioService>;
  let _jwtService: jest.Mocked<JwtService>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      refreshToken: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsuarioService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('access_token_mock') },
        },
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: NotificacaoService,
          useValue: { enviarRecuperacaoSenha: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usuarioService = module.get(UsuarioService);
    _jwtService = module.get(JwtService);
    prisma = module.get(PrismaService);
  });

  describe('register', () => {
    it('delega para usuarioService.create', async () => {
      const dto = { nome: 'João', email: 'joao@example.com', senha: '123456' };
      const expected = {
        codigo: 1,
        nome: 'João',
        email: 'joao@example.com',
        telefone: null,
        avatarUrl: null,
        ativo: true,
        criadoEm: new Date('2024-01-01'),
      };
      usuarioService.create.mockResolvedValue(expected);

      const result = await service.register(dto);

      expect(usuarioService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('retorna tokens quando credenciais são válidas', async () => {
      const senha = 'senha123';
      const hash = await bcrypt.hash(senha, await bcrypt.genSalt());
      const usuario = { ...mockUsuario, senhaHash: hash };

      usuarioService.findByEmail.mockResolvedValue(usuario);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await service.login({ email: usuario.email, senha });

      expect(result).toHaveProperty('access_token', 'access_token_mock');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user).toEqual({
        codigo: 1,
        nome: 'João Silva',
        email: 'joao@example.com',
      });
    });

    it('lança UnauthorizedException quando usuário não existe', async () => {
      usuarioService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@x.com', senha: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando senha está errada', async () => {
      usuarioService.findByEmail.mockResolvedValue(mockUsuario);

      await expect(
        service.login({ email: mockUsuario.email, senha: 'senha_errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('retorna novos tokens quando refresh token é válido', async () => {
      const rawToken = 'raw_token';
      const hash = await bcrypt.hash(rawToken, await bcrypt.genSalt());
      const token = { ...mockRefreshToken, hash };

      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([token]);
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});
      usuarioService.findById.mockResolvedValue(mockUsuario);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await service.refresh({ refreshToken: rawToken });

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { revogado: true } }),
      );
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('lança UnauthorizedException quando token não corresponde a nenhum hash', async () => {
      const hash = await bcrypt.hash('outro_token', await bcrypt.genSalt());
      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([
        { ...mockRefreshToken, hash },
      ]);

      await expect(
        service.refresh({ refreshToken: 'token_invalido' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando lista de tokens está vazia', async () => {
      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.refresh({ refreshToken: 'qualquer' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando usuário vinculado ao token não existe', async () => {
      const rawToken = 'raw_token';
      const hash = await bcrypt.hash(rawToken, await bcrypt.genSalt());

      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([
        { ...mockRefreshToken, hash },
      ]);
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});
      usuarioService.findById.mockResolvedValue(null);

      await expect(service.refresh({ refreshToken: rawToken })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('revoga o token e retorna mensagem de sucesso', async () => {
      const rawToken = 'raw_token';
      const hash = await bcrypt.hash(rawToken, await bcrypt.genSalt());
      const token = { ...mockRefreshToken, hash };

      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([token]);
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});

      const result = await service.logout(1, { refreshToken: rawToken });

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { revogado: true } }),
      );
      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
    });

    it('lança UnauthorizedException quando token não pertence ao usuário', async () => {
      const hash = await bcrypt.hash('outro_token', await bcrypt.genSalt());
      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([
        { ...mockRefreshToken, hash },
      ]);

      await expect(
        service.logout(1, { refreshToken: 'token_invalido' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
