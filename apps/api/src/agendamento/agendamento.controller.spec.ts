import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentoController } from './agendamento.controller';
import { AgendamentoService } from './agendamento.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockCanActivate = { canActivate: () => true };

describe('AgendamentoController', () => {
  let controller: AgendamentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendamentoController],
      providers: [{ provide: AgendamentoService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockCanActivate)
      .overrideGuard(TenantGuard)
      .useValue(mockCanActivate)
      .overrideGuard(RolesGuard)
      .useValue(mockCanActivate)
      .compile();

    controller = module.get<AgendamentoController>(AgendamentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
