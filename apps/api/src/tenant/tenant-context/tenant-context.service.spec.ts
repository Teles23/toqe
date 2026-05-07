import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();

    service = module.get<TenantContextService>(TenantContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
