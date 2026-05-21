import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { UsuarioService } from '../usuario/usuario.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import {
  GOOGLE_TOKEN_VERIFIER,
  type GoogleTokenVerifier,
} from './google-token-verifier';

const mockUsuario = {
  codigo: 1,
  nome: 'João Silva',
  email: 'joao@example.com',
  senhaHash: 'hashed_password',
  telefone: null,
  avatarUrl: null,
  ativo: true,
  twoFaSecret: null,
  twoFaEnabled: false,
  superAdmin: false,
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
  let notificacaoService: jest.Mocked<NotificacaoService>;

  beforeEach(async () => {
    const mockPrisma = {
      refreshToken: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      passwordResetToken: {
        updateMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      usuario: {
        update: jest.fn(),
      },
      $transaction: jest.fn(),
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
          useValue: {
            enviarRecuperacaoSenha: jest.fn(),
          },
        },
        {
          provide: GOOGLE_TOKEN_VERIFIER,
          useValue: {
            verify: jest.fn(),
          } satisfies GoogleTokenVerifier,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usuarioService = module.get(UsuarioService);
    _jwtService = module.get(JwtService);
    prisma = module.get(PrismaService);
    notificacaoService = module.get(NotificacaoService);
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
        twoFaEnabled: false,
        superAdmin: false,
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
      if ('user' in result) {
        expect(result.user).toEqual({
          codigo: 1,
          nome: 'João Silva',
          email: 'joao@example.com',
        });
      }
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

  describe('forgotPassword', () => {
    it('não faz nada quando usuário não existe (anti-enumeration)', async () => {
      usuarioService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword('naoexiste@test.com'),
      ).resolves.toBeUndefined();

      expect(
        (prisma.passwordResetToken.updateMany as jest.Mock).mock.calls.length,
      ).toBe(0);
      expect(notificacaoService.enviarRecuperacaoSenha).not.toHaveBeenCalled();
    });

    it('invalida tokens anteriores e cria novo token quando usuário existe', async () => {
      usuarioService.findByEmail.mockResolvedValue(mockUsuario);
      (prisma.passwordResetToken.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({});
      (
        notificacaoService.enviarRecuperacaoSenha as jest.Mock
      ).mockResolvedValue(undefined);

      await service.forgotPassword(mockUsuario.email);

      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { usrCodigo: mockUsuario.codigo, usadoEm: null },
        }),
      );
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            usrCodigo: mockUsuario.codigo,
          }) as object,
        }),
      );
      expect(notificacaoService.enviarRecuperacaoSenha).toHaveBeenCalledWith(
        mockUsuario.email,
        mockUsuario.nome,
        expect.stringContaining('reset-password?token=') as string,
      );
    });

    it('armazena hash SHA-256 no banco (não o token raw)', async () => {
      usuarioService.findByEmail.mockResolvedValue(mockUsuario);
      (prisma.passwordResetToken.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({});
      (
        notificacaoService.enviarRecuperacaoSenha as jest.Mock
      ).mockResolvedValue(undefined);

      await service.forgotPassword(mockUsuario.email);

      const createCall = (prisma.passwordResetToken.create as jest.Mock).mock
        .calls[0] as [{ data: { token: string } }];
      const storedToken = createCall[0].data.token;

      // O token armazenado deve ter 64 chars (SHA-256 hex)
      expect(storedToken).toHaveLength(64);
      expect(typeof storedToken).toBe('string');
    });
  });

  describe('resetPassword', () => {
    it('lança UnauthorizedException quando token não existe', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.resetPassword('token_invalido', 'novaSenha123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando token já foi usado', async () => {
      const rawToken = 'raw_token_12345';
      const hash = createHash('sha256').update(rawToken).digest('hex');

      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
        codigo: 1,
        token: hash,
        usrCodigo: 1,
        usadoEm: new Date(), // já usado
        expiraEm: new Date(Date.now() + 3600000),
        usuario: mockUsuario,
      });

      await expect(
        service.resetPassword(rawToken, 'novaSenha123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando token expirou', async () => {
      const rawToken = 'raw_token_12345';
      const hash = createHash('sha256').update(rawToken).digest('hex');

      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
        codigo: 1,
        token: hash,
        usrCodigo: 1,
        usadoEm: null,
        expiraEm: new Date(Date.now() - 1000), // expirado
        usuario: mockUsuario,
      });

      await expect(
        service.resetPassword(rawToken, 'novaSenha123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('atualiza senha e revoga refresh tokens quando token é válido', async () => {
      const rawToken = 'raw_token_valid_12345';
      const hash = createHash('sha256').update(rawToken).digest('hex');

      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
        codigo: 5,
        token: hash,
        usrCodigo: 1,
        usadoEm: null,
        expiraEm: new Date(Date.now() + 3600000),
        usuario: mockUsuario,
      });
      (prisma.$transaction as jest.Mock).mockResolvedValue([]);

      await service.resetPassword(rawToken, 'novaSenha123');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('busca token pelo hash SHA-256 do rawToken', async () => {
      const rawToken = 'meu_raw_token_abc';
      const expectedHash = createHash('sha256').update(rawToken).digest('hex');

      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.resetPassword(rawToken, 'novaSenha123'),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: expectedHash },
        }),
      );
    });
  });

  describe('changePassword', () => {
    it('altera senha quando credenciais são válidas', async () => {
      const senhaAtual = 'senha123';
      const hash = await bcrypt.hash(senhaAtual, await bcrypt.genSalt());
      usuarioService.findById.mockResolvedValue({
        ...mockUsuario,
        senhaHash: hash,
      });
      (prisma.$transaction as jest.Mock).mockResolvedValue([]);

      await service.changePassword(1, senhaAtual, 'novaSenha456');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('lança UnauthorizedException quando usuário não existe', async () => {
      usuarioService.findById.mockResolvedValue(null);

      await expect(service.changePassword(1, 'senha', 'nova')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança UnauthorizedException quando senha atual está errada', async () => {
      const hash = await bcrypt.hash('correta', await bcrypt.genSalt());
      usuarioService.findById.mockResolvedValue({
        ...mockUsuario,
        senhaHash: hash,
      });

      await expect(
        service.changePassword(1, 'errada', 'nova123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('listSessions', () => {
    it('lista sessões ativas do usuário', async () => {
      const now = new Date();
      const sessions = [
        { codigo: 1, criadoEm: now, expiraEm: new Date(Date.now() + 86400000) },
      ];
      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue(sessions);

      const result = await service.listSessions(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('codigo', 1);
    });
  });

  describe('revokeSession', () => {
    it('revoga sessão específica', async () => {
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
        codigo: 5,
        usrCodigo: 1,
        revogado: false,
      });
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});

      await service.revokeSession(1, 5);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { revogado: true } }),
      );
    });

    it('lança UnauthorizedException ao revogar sessão inexistente', async () => {
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.revokeSession(1, 99)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeAllSessions', () => {
    it('revoga todas as sessões do usuário', async () => {
      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({
        count: 3,
      });

      await service.revokeAllSessions(1);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ usrCodigo: 1 }) as object,
          data: { revogado: true },
        }),
      );
    });
  });

  describe('verifyTwoFa', () => {
    it('lança UnauthorizedException quando tempToken é inválido', async () => {
      await expect(
        service.verifyTwoFa('token_invalido', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
