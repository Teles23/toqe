import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentoController } from './agendamento.controller';
import { AgendamentoService } from './agendamento.service';

describe('AgendamentoController', () => {
  let controller: AgendamentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendamentoController],
      providers: [{ provide: AgendamentoService, useValue: {} }],
    }).compile();

    controller = module.get<AgendamentoController>(AgendamentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
