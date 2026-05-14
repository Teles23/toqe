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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
