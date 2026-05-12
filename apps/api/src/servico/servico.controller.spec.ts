import { Test, TestingModule } from '@nestjs/testing';
import { ServicoController } from './servico.controller';
import { ServicoService } from './servico.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockCanActivate = { canActivate: () => true };

describe('ServicoController', () => {
  let controller: ServicoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicoController],
      providers: [{ provide: ServicoService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockCanActivate)
      .overrideGuard(TenantGuard)
      .useValue(mockCanActivate)
      .overrideGuard(RolesGuard)
      .useValue(mockCanActivate)
      .compile();

    controller = module.get<ServicoController>(ServicoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
