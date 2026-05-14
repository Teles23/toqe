import { Test } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockAgendaService = {
  upsertJornada: jest.fn(), deleteBloqueio: jest.fn(),
  createBloqueio: jest.fn(), getSlotsDisponiveis: jest.fn(),
};

describe('AgendaController', () => {
  let controller: AgendaController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AgendaController],
      providers: [{ provide: AgendaService, useValue: mockAgendaService }],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockGuard)
      .overrideGuard(TenantGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();
    controller = module.get(AgendaController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
