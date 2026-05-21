import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConviteService } from './convite.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

const mockPrisma = createPrismaMock();

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
      ],
    }).compile();
    service = module.get(ConviteService);
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
    it('cria novo usuário e adiciona como membro (isNew=true)', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.usuario.create.mockResolvedValue({ codigo: 50 });
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({});
      mockPrisma.conviteBarbearia.update.mockResolvedValue({});

      const result = await service.aceitarConvite('tok123', {
        nome: 'João',
        senha: 'senha123',
      });

      expect(result.sucesso).toBe(true);
      expect(result.userId).toBe(50);
      expect(mockPrisma.usuario.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.membroBarbearia.create).toHaveBeenCalledTimes(1);
    });

    it('vincula usuário existente sem criar novo (isNew=false)', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({ codigo: 99 });
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({});
      mockPrisma.conviteBarbearia.update.mockResolvedValue({});

      const result = await service.aceitarConvite('tok123', {});

      expect(result.sucesso).toBe(true);
      expect(result.userId).toBe(99);
      expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
    });

    it('não duplica membro se já for membro', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({ codigo: 99 });
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue({ codigo: 1 });
      mockPrisma.conviteBarbearia.update.mockResolvedValue({});

      await service.aceitarConvite('tok123', {});

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
});
