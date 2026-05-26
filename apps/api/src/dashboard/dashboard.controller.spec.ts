import { Test } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockDashboardService = {
  getOverview: jest.fn(),
};

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();
    controller = module.get(DashboardController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getOverview', () => {
    it('delega para dashboardService.getOverview com barCodigo', async () => {
      const overview = { faturamento7d: 1500, agendamentosHoje: 4 };
      mockDashboardService.getOverview.mockResolvedValue(overview);

      const result = await controller.getOverview(1, 'tenant-1');

      expect(mockDashboardService.getOverview).toHaveBeenCalledWith(1);
      expect(result).toEqual(overview);
    });
  });
});
