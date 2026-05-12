import { Test, TestingModule } from '@nestjs/testing';
import { BarbeariaService } from './barbearia.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BarbeariaService', () => {
  let service: BarbeariaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarbeariaService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<BarbeariaService>(BarbeariaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
