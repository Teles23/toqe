import { Test } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { BarbeariaController } from './barbearia.controller';
import { BarbeariaService } from './barbearia.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FeatureFlagGuard } from '../auth/guards/feature-flag.guard';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockBarbeariaService = {
  create: jest.fn(), findMembros: jest.fn(), convidarMembro: jest.fn(),
  getTema: jest.fn(), upsertTema: jest.fn(), removerMembro: jest.fn(),
};

describe('BarbeariaController', () => {
  let controller: BarbeariaController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [BarbeariaController],
      providers: [{ provide: BarbeariaService, useValue: mockBarbeariaService }],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockGuard)
      .overrideGuard(TenantGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .overrideGuard(FeatureFlagGuard).useValue(mockGuard)
      .compile();
    controller = module.get(BarbeariaController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
