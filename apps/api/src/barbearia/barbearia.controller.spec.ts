import { Test, TestingModule } from '@nestjs/testing';
import { BarbeariaController } from './barbearia.controller';

describe('BarbeariaController', () => {
  let controller: BarbeariaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BarbeariaController],
    }).compile();

    controller = module.get<BarbeariaController>(BarbeariaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
