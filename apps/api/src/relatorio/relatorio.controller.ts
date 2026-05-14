import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Headers,
  ParseIntPipe,
} from '@nestjs/common';
import { RelatorioService } from './relatorio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import type { Periodo } from '@toqe/contracts';

@ApiTags('Relatórios')
@ApiBearerAuth('JWT')
@Controller('barbearias')
export class RelatorioController {
  constructor(private readonly relatorioService: RelatorioService) {}

  @Get(':barCodigo/relatorios/faturamento')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiQuery({
    name: 'periodo',
    enum: ['7d', '30d', '3m', '6m', '12m'],
    required: false,
  })
  @ApiOperation({ summary: 'Faturamento diário no período' })
  @ApiResponse({ status: 200, description: 'Array de { data, total }.' })
  faturamento(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Query('periodo') periodo: Periodo = '30d',
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.relatorioService.faturamento(barCodigo, periodo);
  }

  @Get(':barCodigo/relatorios/agendamentos')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiQuery({
    name: 'periodo',
    enum: ['7d', '30d', '3m', '6m', '12m'],
    required: false,
  })
  @ApiOperation({ summary: 'Agendamentos concluídos vs cancelados por dia' })
  @ApiResponse({
    status: 200,
    description: 'Array de { data, concluido, cancelado, no_show }.',
  })
  agendamentos(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Query('periodo') periodo: Periodo = '30d',
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.relatorioService.agendamentos(barCodigo, periodo);
  }

  @Get(':barCodigo/relatorios/servicos')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiQuery({
    name: 'periodo',
    enum: ['7d', '30d', '3m', '6m', '12m'],
    required: false,
  })
  @ApiOperation({ summary: 'Distribuição de receita por serviço' })
  @ApiResponse({
    status: 200,
    description: 'Array de { nome, quantidade, total }.',
  })
  servicos(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Query('periodo') periodo: Periodo = '30d',
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.relatorioService.servicos(barCodigo, periodo);
  }

  @Get(':barCodigo/relatorios/barbeiros')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiQuery({
    name: 'periodo',
    enum: ['7d', '30d', '3m', '6m', '12m'],
    required: false,
  })
  @ApiOperation({ summary: 'Ranking de barbeiros por faturamento' })
  @ApiResponse({ status: 200, description: 'Lista ordenada por faturamento.' })
  barbeiros(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Query('periodo') periodo: Periodo = '30d',
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.relatorioService.barbeiros(barCodigo, periodo);
  }

  @Get(':barCodigo/relatorios/horarios-pico')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiQuery({
    name: 'periodo',
    enum: ['7d', '30d', '3m', '6m', '12m'],
    required: false,
  })
  @ApiOperation({ summary: 'Volume de agendamentos por hora do dia' })
  @ApiResponse({
    status: 200,
    description: 'Array de 24 itens { hora, quantidade }.',
  })
  horariosPico(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Query('periodo') periodo: Periodo = '30d',
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.relatorioService.horariosPico(barCodigo, periodo);
  }
}
