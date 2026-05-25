import {
  Controller,
  Get,
  Param,
  UseGuards,
  Headers,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtRequest } from '../common/types/jwt-request';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller('barbearias')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':barCodigo/dashboard')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Visão geral da barbearia — KPIs e feed de hoje' })
  @ApiResponse({ status: 200, description: 'Overview retornado.' })
  getOverview(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.dashboardService.getOverview(barCodigo);
  }

  @Get('rede')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Dashboard consolidado da rede — KPIs de todas as barbearias do dono',
  })
  @ApiResponse({ status: 200, description: 'Overview consolidado retornado.' })
  getRedeOverview(@Request() req: JwtRequest) {
    return this.dashboardService.getRedeOverview(req.user.sub);
  }
}
