import { Test, TestingModule } from '@nestjs/testing';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockCanActivate = { canActivate: () => true };

describe('AgendaController', () => {
  let controller: AgendaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendaController],
      providers: [{ provide: AgendaService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockCanActivate)
      .overrideGuard(TenantGuard)
      .useValue(mockCanActivate)
      .overrideGuard(RolesGuard)
      .useValue(mockCanActivate)
      .compile();

    controller = module.get<AgendaController>(AgendaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
