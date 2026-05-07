import { Test, TestingModule } from '@nestjs/testing';
import { BarbeariaService } from './barbearia.service';

describe('BarbeariaService', () => {
  let service: BarbeariaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarbeariaService],
    }).compile();

    service = module.get<BarbeariaService>(BarbeariaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
