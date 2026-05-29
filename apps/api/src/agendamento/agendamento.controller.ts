import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AgendamentoService } from './agendamento.service';
import {
  serializeAgendamento,
  serializeAgendamentos,
} from './serialize-agendamento';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { CreateWalkInDto } from './dto/create-walk-in.dto';
import { ListAgendamentoDto } from './dto/list-agendamento.dto';
import { PatchStatusAgendamentoDto } from './dto/patch-status-agendamento.dto';
import { TransferirAgendamentoDto } from './dto/transferir-agendamento.dto';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { ReagendarAgendamentoDto } from './dto/reagendar-agendamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { TenantRequest } from '../common/types/jwt-request';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';

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
  async create(
    @Body() dto: CreateAgendamentoDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return serializeAgendamento(
      await this.agendamentoService.create(dto, Number(barCodigo)),
    );
  }

  @Post('walk-in')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({
    summary:
      'Cria um walk-in (encaixe) — cria/reaproveita o cliente e o agendamento atomicamente',
  })
  @ApiResponse({ status: 201, description: 'Walk-in criado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async criarWalkIn(
    @Body() dto: CreateWalkInDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return serializeAgendamento(
      await this.agendamentoService.createWalkIn(dto, Number(barCodigo)),
    );
  }

  @Get()
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({
    summary:
      'Lista agendamentos da barbearia (filtros: data, barbeiroId, status)',
  })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos.' })
  async findAll(
    @Query() filtros: ListAgendamentoDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return serializeAgendamentos(
      await this.agendamentoService.findAll(Number(barCodigo), filtros),
    );
  }

  @Get('meus')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({
    summary: 'Lista agendamentos do cliente logado nesta barbearia',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de agendamentos do cliente.',
  })
  async meusAgendamentos(
    @Request() req: TenantRequest,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return serializeAgendamentos(
      await this.agendamentoService.meusAgendamentos(
        req.user.sub,
        Number(barCodigo),
      ),
    );
  }

  @Get('proximo')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({ summary: 'Próximo agendamento futuro do cliente logado' })
  @ApiResponse({ status: 200, description: 'Agendamento ou null.' })
  async proximoAgendamento(
    @Request() req: TenantRequest,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return serializeAgendamento(
      await this.agendamentoService.proximoAgendamento(
        req.user.sub,
        Number(barCodigo),
      ),
    );
  }

  @Get('atual')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({
    summary: 'Agendamento em atendimento agora pelo barbeiro logado',
  })
  @ApiResponse({ status: 200, description: 'Agendamento atual ou null.' })
  async agendamentoAtual(
    @Request() req: TenantRequest,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return serializeAgendamento(
      await this.agendamentoService.agendamentoAtual(
        req.user.sub,
        Number(barCodigo),
      ),
    );
  }

  @Get('meus-atendimentos')
  @Roles('barbeiro', 'dono', 'gerente')
  @ApiOperation({ summary: 'Últimos atendimentos do barbeiro logado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de agendamentos concluídos.',
  })
  async meusAtendimentos(
    @Request() req: TenantRequest,
    @Headers('x-tenant-id') barCodigo: string,
    @Query('limit') limit?: string,
  ) {
    return serializeAgendamentos(
      await this.agendamentoService.meusAtendimentos(
        req.user.sub,
        Number(barCodigo),
        limit ? Math.min(Number(limit), 100) : 20,
      ),
    );
  }

  @Get(':codigo')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({ summary: 'Detalha um agendamento pelo código' })
  @ApiResponse({ status: 200, description: 'Agendamento encontrado.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async findOne(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Request() req: TenantRequest,
  ) {
    // Cliente só pode ver seus próprios agendamentos
    if (req.user.perfil === 'cliente') {
      return serializeAgendamento(
        await this.agendamentoService.findOneForCliente(
          codigo,
          Number(barCodigo),
          req.user.sub,
        ),
      );
    }
    return serializeAgendamento(
      await this.agendamentoService.findOne(codigo, Number(barCodigo)),
    );
  }

  @Patch(':codigo/status')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({
    summary:
      'Atualiza o status de um agendamento (confirmado | cancelado | concluido | no_show)',
  })
  @ApiResponse({ status: 200, description: 'Status atualizado.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async patchStatus(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Body() dto: PatchStatusAgendamentoDto,
    @Headers('x-tenant-id') barCodigo: string,
    @Request() req: TenantRequest,
  ) {
    return serializeAgendamento(
      await this.agendamentoService.patchStatus(
        codigo,
        dto,
        Number(barCodigo),
        req.user.sub,
      ),
    );
  }

  @Delete(':codigo')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Cancela um agendamento (soft delete — muda status para cancelado)',
  })
  @ApiResponse({ status: 200, description: 'Agendamento cancelado.' })
  @ApiResponse({ status: 400, description: 'Agendamento já cancelado.' })
  @ApiResponse({
    status: 403,
    description: 'Cliente tentando cancelar agendamento de outro.',
  })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async cancel(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Request() req: TenantRequest,
  ) {
    // Para 'cliente': service valida ownership (só pode cancelar o próprio)
    // Para staff: callerUserId=undefined (sem restrição de ownership)
    const callerUserId =
      req.user.perfil === 'cliente' ? req.user.sub : undefined;
    return serializeAgendamento(
      await this.agendamentoService.cancel(
        codigo,
        Number(barCodigo),
        callerUserId,
      ),
    );
  }

  @Patch(':codigo/reagendar')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({ summary: 'Reagenda um agendamento (novo início/fim)' })
  @ApiResponse({ status: 200, description: 'Agendamento reagendado.' })
  @ApiResponse({
    status: 400,
    description: 'Horário inválido ou status incompatível.',
  })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflito de horário.' })
  async reagendar(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: ReagendarAgendamentoDto,
    @Request() req: TenantRequest,
  ) {
    return serializeAgendamento(
      await this.agendamentoService.reagendar(
        codigo,
        dto,
        req.user.sub,
        Number(barCodigo),
      ),
    );
  }

  @Patch(':codigo/transferir')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({
    summary: 'Transfere o agendamento para outro barbeiro da mesma barbearia',
  })
  @ApiResponse({ status: 200, description: 'Agendamento transferido.' })
  @ApiResponse({
    status: 400,
    description: 'Status inválido ou conflito de horário.',
  })
  @ApiResponse({
    status: 404,
    description: 'Agendamento ou barbeiro não encontrado.',
  })
  transferir(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: TransferirAgendamentoDto,
  ) {
    return this.agendamentoService.transferir(codigo, dto, Number(barCodigo));
  }

  @Post(':codigo/avaliacao')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avalia um agendamento concluído (nota 1-5)' })
  @ApiResponse({ status: 200, description: 'Avaliação registrada.' })
  @ApiResponse({ status: 400, description: 'Agendamento não está concluído.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  @ApiResponse({ status: 409, description: 'Agendamento já foi avaliado.' })
  avaliar(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: CreateAvaliacaoDto,
    @Request() req: TenantRequest,
  ) {
    return this.agendamentoService.avaliarAgendamento(
      codigo,
      Number(barCodigo),
      req.user.sub,
      dto,
    );
  }
}
