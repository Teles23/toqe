import { Test } from '@nestjs/testing';
import { TenantContextService } from './tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createPrismaMock } from '../../test/prisma-mock.factory';

const mockPrisma = createPrismaMock();

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TenantContextService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(TenantContextService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('run', () => {
    it('executa fn dentro de $transaction com set_config correto', async () => {
      const mockTx = { $executeRawUnsafe: jest.fn().mockResolvedValue(1) };
      const mockFn = jest.fn().mockResolvedValue('resultado');

      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<string>) => cb(mockTx),
      );

      const result = await service.run(42, mockFn as never);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockTx.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('set_config'),
        '42',
      );
      expect(mockFn).toHaveBeenCalledWith(mockTx);
      expect(result).toBe('resultado');
    });

    it('propaga erro lancado pela fn', async () => {
      const mockTx = { $executeRawUnsafe: jest.fn().mockResolvedValue(1) };
      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<never>) => cb(mockTx),
      );

      await expect(
        service.run(1, () => Promise.reject(new Error('falha'))),
      ).rejects.toThrow('falha');
    });
  });
});
