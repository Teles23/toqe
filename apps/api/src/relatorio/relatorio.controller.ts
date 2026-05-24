import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Headers,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
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
  @ApiQuery({ name: 'formato', enum: ['csv'], required: false })
  @ApiOperation({ summary: 'Faturamento diário no período' })
  @ApiResponse({ status: 200, description: 'Array de { data, total }.' })
  async faturamento(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Query('periodo') periodo: Periodo = '30d',
    @Query('formato') formato: string | undefined,
    @Headers('x-tenant-id') _tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio-faturamento-${periodo}.csv"`,
      );
      return this.relatorioService.faturamentoCsv(barCodigo, periodo);
    }
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
  @ApiQuery({ name: 'formato', enum: ['csv'], required: false })
  @ApiOperation({ summary: 'Agendamentos concluídos vs cancelados por dia' })
  @ApiResponse({
    status: 200,
    description: 'Array de { data, concluido, cancelado, no_show }.',
  })
  async agendamentos(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Query('periodo') periodo: Periodo = '30d',
    @Query('formato') formato: string | undefined,
    @Headers('x-tenant-id') _tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio-agendamentos-${periodo}.csv"`,
      );
      return this.relatorioService.agendamentosCsv(barCodigo, periodo);
    }
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
  @ApiQuery({ name: 'formato', enum: ['csv'], required: false })
  @ApiOperation({ summary: 'Distribuição de receita por serviço' })
  @ApiResponse({
    status: 200,
    description: 'Array de { nome, quantidade, total }.',
  })
  async servicos(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Query('periodo') periodo: Periodo = '30d',
    @Query('formato') formato: string | undefined,
    @Headers('x-tenant-id') _tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio-servicos-${periodo}.csv"`,
      );
      return this.relatorioService.servicosCsv(barCodigo, periodo);
    }
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
  @ApiQuery({ name: 'formato', enum: ['csv'], required: false })
  @ApiOperation({ summary: 'Ranking de barbeiros por faturamento' })
  @ApiResponse({ status: 200, description: 'Lista ordenada por faturamento.' })
  async barbeiros(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Query('periodo') periodo: Periodo = '30d',
    @Query('formato') formato: string | undefined,
    @Headers('x-tenant-id') _tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio-barbeiros-${periodo}.csv"`,
      );
      return this.relatorioService.barbeirosCsv(barCodigo, periodo);
    }
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
  @ApiQuery({ name: 'formato', enum: ['csv'], required: false })
  @ApiOperation({ summary: 'Volume de agendamentos por hora do dia' })
  @ApiResponse({
    status: 200,
    description: 'Array de 24 itens { hora, quantidade }.',
  })
  async horariosPico(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Query('periodo') periodo: Periodo = '30d',
    @Query('formato') formato: string | undefined,
    @Headers('x-tenant-id') _tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio-horarios-pico-${periodo}.csv"`,
      );
      return this.relatorioService.horariosPicoCsv(barCodigo, periodo);
    }
    return this.relatorioService.horariosPico(barCodigo, periodo);
  }
}
