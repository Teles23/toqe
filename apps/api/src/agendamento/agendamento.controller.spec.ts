import { Test } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { AgendamentoController } from './agendamento.controller';
import { AgendamentoService } from './agendamento.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockAgendamentoService = {
  create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(),
  patchStatus: jest.fn(), cancel: jest.fn(),
};

describe('AgendamentoController', () => {
  let controller: AgendamentoController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AgendamentoController],
      providers: [{ provide: AgendamentoService, useValue: mockAgendamentoService }],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockGuard)
      .overrideGuard(TenantGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();
    controller = module.get(AgendamentoController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
