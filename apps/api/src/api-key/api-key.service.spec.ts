import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ApiKeyService } from './api-key.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ApiKey } from '../generated/prisma';
import { createPrismaMock, PrismaMock } from '../test/prisma-mock.factory';

const mockApiKey: ApiKey = {
  codigo: 1,
  barCodigo: 10,
  nome: 'Minha Integração',
  keyHash: 'abc123hashvalue',
  keyPrefix: 'toqe_aabb_ccd',
  ativo: true,
  criadoEm: new Date('2026-05-25T00:00:00Z'),
  ultimoUsoEm: null,
};

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let mockPrisma: PrismaMock;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    mockPrisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ApiKeyService>(ApiKeyService);
  });

  describe('criar', () => {
    it('retorna key com formato toqe_<prefix>_<secret>', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey);

      const result = await service.criar(10, 'Minha Integração');

      expect(result.key).toMatch(/^toqe_[0-9a-f]{8}_[0-9a-f]{32}$/);
    });

    it('persiste keyHash HMAC-SHA-256 da key no banco', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey);

      const result = await service.criar(10, 'Minha Integração');

      const callArg = mockPrisma.apiKey.create.mock.calls[0][0] as {
        data: { keyHash: string };
      };
      const hmacSecret =
        process.env.API_KEY_HMAC_SECRET ?? process.env.JWT_SECRET;
      const expectedHash = createHmac('sha256', hmacSecret!)
        .update(result.key)
        .digest('hex');

      expect(callArg.data.keyHash).toBe(expectedHash);
    });

    it('persiste keyPrefix como os primeiros 15 chars da key', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey);

      const result = await service.criar(10, 'Integração');

      const callArg = mockPrisma.apiKey.create.mock.calls[0][0] as {
        data: { keyPrefix: string };
      };
      expect(callArg.data.keyPrefix).toBe(result.key.slice(0, 15));
    });

    it('não retorna keyHash no objeto apiKey do resultado', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey);

      const result = await service.criar(10, 'Minha Integração');

      expect(result.apiKey).not.toHaveProperty('keyHash');
    });

    it('persiste barCodigo e nome corretos', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey);

      await service.criar(10, 'Nome Teste');

      const callArg = mockPrisma.apiKey.create.mock.calls[0][0] as {
        data: { barCodigo: number; nome: string; ativo: boolean };
      };
      expect(callArg.data.barCodigo).toBe(10);
      expect(callArg.data.nome).toBe('Nome Teste');
      expect(callArg.data.ativo).toBe(true);
    });
  });

  describe('listar', () => {
    it('retorna lista sem keyHash', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([mockApiKey]);

      const result = await service.listar(10);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('keyHash');
    });

    it('filtra por barCodigo correto (tenant isolation)', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([]);

      await service.listar(10);

      const callArg = mockPrisma.apiKey.findMany.mock.calls[0][0] as {
        where: { barCodigo: number };
      };
      expect(callArg.where.barCodigo).toBe(10);
    });

    it('retorna lista vazia se não há keys', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([]);

      const result = await service.listar(10);

      expect(result).toEqual([]);
    });
  });

  describe('revogar', () => {
    it('revoga a key corretamente', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(mockApiKey);
      mockPrisma.apiKey.update.mockResolvedValue({
        ...mockApiKey,
        ativo: false,
      });

      await service.revogar(1, 10);

      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { codigo: 1 },
        data: { ativo: false },
      });
    });

    it('lança NotFoundException se key não pertence à barbearia (tenant isolation)', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.revogar(1, 99)).rejects.toThrow(NotFoundException);
    });

    it('busca com barCodigo para garantir tenant isolation', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.revogar(1, 99)).rejects.toThrow();

      const callArg = mockPrisma.apiKey.findFirst.mock.calls[0][0] as {
        where: { barCodigo: number; codigo: number };
      };
      expect(callArg.where.barCodigo).toBe(99);
      expect(callArg.where.codigo).toBe(1);
    });
  });
});
