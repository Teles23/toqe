import { Test, TestingModule } from '@nestjs/testing';
import { BarbeariaController } from './barbearia.controller';
import { BarbeariaService } from './barbearia.service';

describe('BarbeariaController', () => {
  let controller: BarbeariaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BarbeariaController],
      providers: [{ provide: BarbeariaService, useValue: {} }],
    }).compile();

    controller = module.get<BarbeariaController>(BarbeariaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
