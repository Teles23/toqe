import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ApiKeyService } from './api-key.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ApiKey } from '../generated/prisma';

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

const createMock = jest.fn<Promise<ApiKey>, [object]>();
const findManyMock = jest.fn<Promise<ApiKey[]>, [object]>();
const findFirstMock = jest.fn<Promise<ApiKey | null>, [object]>();
const updateMock = jest.fn<Promise<ApiKey>, [object]>();

const mockPrisma = {
  apiKey: {
    create: createMock,
    findMany: findManyMock,
    findFirst: findFirstMock,
    update: updateMock,
  },
};

describe('ApiKeyService', () => {
  let service: ApiKeyService;

  beforeEach(async () => {
    jest.clearAllMocks();

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
      createMock.mockResolvedValue(mockApiKey);

      const result = await service.criar(10, 'Minha Integração');

      expect(result.key).toMatch(/^toqe_[0-9a-f]{8}_[0-9a-f]{32}$/);
    });

    it('persiste keyHash SHA-256 da key no banco', async () => {
      createMock.mockResolvedValue(mockApiKey);

      const result = await service.criar(10, 'Minha Integração');

      const callArg = createMock.mock.calls[0][0] as {
        data: { keyHash: string };
      };
      const expectedHash = createHash('sha256')
        .update(result.key)
        .digest('hex');

      expect(callArg.data.keyHash).toBe(expectedHash);
    });

    it('persiste keyPrefix como os primeiros 15 chars da key', async () => {
      createMock.mockResolvedValue(mockApiKey);

      const result = await service.criar(10, 'Integração');

      const callArg = createMock.mock.calls[0][0] as {
        data: { keyPrefix: string };
      };
      expect(callArg.data.keyPrefix).toBe(result.key.slice(0, 15));
    });

    it('não retorna keyHash no objeto apiKey do resultado', async () => {
      createMock.mockResolvedValue(mockApiKey);

      const result = await service.criar(10, 'Minha Integração');

      expect(result.apiKey).not.toHaveProperty('keyHash');
    });

    it('persiste barCodigo e nome corretos', async () => {
      createMock.mockResolvedValue(mockApiKey);

      await service.criar(10, 'Nome Teste');

      const callArg = createMock.mock.calls[0][0] as {
        data: { barCodigo: number; nome: string; ativo: boolean };
      };
      expect(callArg.data.barCodigo).toBe(10);
      expect(callArg.data.nome).toBe('Nome Teste');
      expect(callArg.data.ativo).toBe(true);
    });
  });

  describe('listar', () => {
    it('retorna lista sem keyHash', async () => {
      findManyMock.mockResolvedValue([mockApiKey]);

      const result = await service.listar(10);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('keyHash');
    });

    it('filtra por barCodigo correto (tenant isolation)', async () => {
      findManyMock.mockResolvedValue([]);

      await service.listar(10);

      const callArg = findManyMock.mock.calls[0][0] as {
        where: { barCodigo: number };
      };
      expect(callArg.where.barCodigo).toBe(10);
    });

    it('retorna lista vazia se não há keys', async () => {
      findManyMock.mockResolvedValue([]);

      const result = await service.listar(10);

      expect(result).toEqual([]);
    });
  });

  describe('revogar', () => {
    it('revoga a key corretamente', async () => {
      findFirstMock.mockResolvedValue(mockApiKey);
      updateMock.mockResolvedValue({
        ...mockApiKey,
        ativo: false,
      });

      await service.revogar(1, 10);

      expect(updateMock).toHaveBeenCalledWith({
        where: { codigo: 1 },
        data: { ativo: false },
      });
    });

    it('lança NotFoundException se key não pertence à barbearia (tenant isolation)', async () => {
      findFirstMock.mockResolvedValue(null);

      await expect(service.revogar(1, 99)).rejects.toThrow(NotFoundException);
    });

    it('busca com barCodigo para garantir tenant isolation', async () => {
      findFirstMock.mockResolvedValue(null);

      await expect(service.revogar(1, 99)).rejects.toThrow();

      const callArg = findFirstMock.mock.calls[0][0] as {
        where: { barCodigo: number; codigo: number };
      };
      expect(callArg.where.barCodigo).toBe(99);
      expect(callArg.where.codigo).toBe(1);
    });
  });
});
