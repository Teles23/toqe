import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService } from './tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<TenantContextService>(TenantContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
