import { Test, TestingModule } from '@nestjs/testing';
import { BarbeariaController } from './barbearia.controller';
import { BarbeariaService } from './barbearia.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FeatureFlagGuard } from '../auth/guards/feature-flag.guard';

const mockCanActivate = { canActivate: () => true };

describe('BarbeariaController', () => {
  let controller: BarbeariaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BarbeariaController],
      providers: [{ provide: BarbeariaService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockCanActivate)
      .overrideGuard(TenantGuard)
      .useValue(mockCanActivate)
      .overrideGuard(RolesGuard)
      .useValue(mockCanActivate)
      .overrideGuard(FeatureFlagGuard)
      .useValue(mockCanActivate)
      .compile();

    controller = module.get<BarbeariaController>(BarbeariaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
