import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Headers, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { AgendamentoService } from './agendamento.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { ListAgendamentoDto } from './dto/list-agendamento.dto';
import { PatchStatusAgendamentoDto } from './dto/patch-status-agendamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Agendamentos')
@ApiBearerAuth('JWT')
@ApiSecurity('x-tenant-id')
@Controller('agendamentos')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AgendamentoController {
  constructor(private readonly agendamentoService: AgendamentoService) {}

  @Post()
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({ summary: 'Cria um novo agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado.' })
  @ApiResponse({ status: 409, description: 'Conflito de horário.' })
  create(@Body() dto: CreateAgendamentoDto, @Headers('x-tenant-id') barCodigo: string) {
    return this.agendamentoService.create(dto, Number(barCodigo));
  }

  @Get()
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({ summary: 'Lista agendamentos da barbearia (filtros: data, barbeiroId, status)' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos.' })
  findAll(@Query() filtros: ListAgendamentoDto, @Headers('x-tenant-id') barCodigo: string) {
    return this.agendamentoService.findAll(Number(barCodigo), filtros);
  }

  @Get(':codigo')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({ summary: 'Detalha um agendamento pelo código' })
  @ApiResponse({ status: 200, description: 'Agendamento encontrado.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  findOne(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.agendamentoService.findOne(codigo, Number(barCodigo));
  }

  @Patch(':codigo/status')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({ summary: 'Atualiza o status de um agendamento (confirmado | cancelado | concluido | no_show)' })
  @ApiResponse({ status: 200, description: 'Status atualizado.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  patchStatus(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Body() dto: PatchStatusAgendamentoDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.agendamentoService.patchStatus(codigo, dto, Number(barCodigo));
  }

  @Delete(':codigo')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela um agendamento (soft delete — muda status para cancelado)' })
  @ApiResponse({ status: 200, description: 'Agendamento cancelado.' })
  @ApiResponse({ status: 400, description: 'Agendamento já cancelado.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  cancel(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.agendamentoService.cancel(codigo, Number(barCodigo));
  }
}
