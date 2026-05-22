import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConviteService } from './convite.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockedCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;

const mockPrisma = createPrismaMock();

const mockAuthService = {
  issueTokens: jest.fn().mockResolvedValue({
    access_token: 'acc',
    refresh_token: 'ref',
    user: { codigo: 0, nome: '', email: '' },
  }),
};

const makeConvite = (overrides: Record<string, unknown> = {}) => ({
  token: 'tok123',
  barCodigo: 1,
  email: 'joao@x.com',
  perfil: 'barbeiro',
  expiresAt: new Date(Date.now() + 86_400_000), // +1 dia
  usadoEm: null,
  barbearia: { nome: 'Urban Flow', slug: 'urban-flow' },
  ...overrides,
});

describe('ConviteService', () => {
  let service: ConviteService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConviteService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();
    service = module.get(ConviteService);

    // $transaction executa o callback com o próprio mock (tx === mockPrisma).
    mockPrisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(mockPrisma),
    );
    mockAuthService.issueTokens.mockResolvedValue({
      access_token: 'acc',
      refresh_token: 'ref',
      user: { codigo: 0, nome: '', email: '' },
    });
    mockedCompare.mockResolvedValue(true as never);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── obterConvite ──────────────────────────────────────────────────────────

  describe('obterConvite', () => {
    it('retorna dados do convite com isNew=true quando usuário não existe', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      const result = await service.obterConvite('tok123');

      expect(result.token).toBe('tok123');
      expect(result.barbeariaNome).toBe('Urban Flow');
      expect(result.isNew).toBe(true);
    });

    it('retorna isNew=false quando usuário já existe', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({ codigo: 99 });

      const result = await service.obterConvite('tok123');

      expect(result.isNew).toBe(false);
    });

    it('lança NotFoundException para token inexistente', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(null);

      await expect(service.obterConvite('invalido')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança NotFoundException para convite expirado', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(
        makeConvite({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.obterConvite('tok123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── aceitarConvite ────────────────────────────────────────────────────────

  describe('aceitarConvite', () => {
    it('cria novo usuário, vincula membro e faz auto-login (isNew=true)', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.usuario.create.mockResolvedValue({
        codigo: 50,
        nome: 'João',
        email: 'joao@x.com',
      });
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({});
      mockPrisma.conviteBarbearia.update.mockResolvedValue({});

      const result = await service.aceitarConvite('tok123', {
        nome: 'João',
        senha: 'senha1234',
      });

      expect(result.isNew).toBe(true);
      expect(result.barbeariaNome).toBe('Urban Flow');
      expect(result.access_token).toBe('acc');
      expect(result.refresh_token).toBe('ref');
      expect(mockPrisma.usuario.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.membroBarbearia.create).toHaveBeenCalledTimes(1);
      expect(mockAuthService.issueTokens).toHaveBeenCalledWith(
        50,
        'João',
        'joao@x.com',
      );
    });

    it('vincula usuário existente (senha correta) sem criar novo + auto-login', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 99,
        nome: 'Maria',
        email: 'joao@x.com',
        senhaHash: 'hash',
      });
      mockedCompare.mockResolvedValue(true as never);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({});
      mockPrisma.conviteBarbearia.update.mockResolvedValue({});

      const result = await service.aceitarConvite('tok123', {
        senha: 'senha1234',
      });

      expect(result.isNew).toBe(false);
      expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
      expect(mockAuthService.issueTokens).toHaveBeenCalledWith(
        99,
        'Maria',
        'joao@x.com',
      );
    });

    it('lança UnauthorizedException se a senha do usuário existente está errada', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 99,
        nome: 'Maria',
        email: 'joao@x.com',
        senhaHash: 'hash',
      });
      mockedCompare.mockResolvedValue(false as never);

      await expect(
        service.aceitarConvite('tok123', { senha: 'errada12' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.issueTokens).not.toHaveBeenCalled();
    });

    it('lança BadRequestException se usuário existente não envia senha', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 99,
        nome: 'Maria',
        email: 'joao@x.com',
        senhaHash: 'hash',
      });

      await expect(service.aceitarConvite('tok123', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('não duplica membro se já for membro', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 99,
        nome: 'Maria',
        email: 'joao@x.com',
        senhaHash: 'hash',
      });
      mockedCompare.mockResolvedValue(true as never);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue({ codigo: 1 });
      mockPrisma.conviteBarbearia.update.mockResolvedValue({});

      await service.aceitarConvite('tok123', { senha: 'senha1234' });

      expect(mockPrisma.membroBarbearia.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException se nome/senha ausentes para isNew', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.aceitarConvite('tok123', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança NotFoundException para token inválido', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(null);

      await expect(service.aceitarConvite('invalido', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança BadRequestException se convite já foi utilizado', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(
        makeConvite({ usadoEm: new Date() }),
      );

      await expect(service.aceitarConvite('tok123', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── rejeitarConvite ──────────────────────────────────────────────────────

  describe('rejeitarConvite', () => {
    it('remove o convite e retorna sucesso', async () => {
      mockPrisma.conviteBarbearia.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.rejeitarConvite('tok123');

      expect(result).toEqual({ sucesso: true });
      expect(mockPrisma.conviteBarbearia.deleteMany).toHaveBeenCalledWith({
        where: { token: 'tok123' },
      });
    });

    it('é idempotente quando o token não existe', async () => {
      mockPrisma.conviteBarbearia.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.rejeitarConvite('inexistente');

      expect(result).toEqual({ sucesso: true });
    });
  });
});
