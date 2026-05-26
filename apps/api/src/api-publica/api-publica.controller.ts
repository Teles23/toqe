import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiPublicaService } from './api-publica.service';
import { CriarAgendamentoPublicoDto } from './dto/criar-agendamento-publico.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';

interface ApiKeyRequest extends Request {
  apiKeyBarCodigo: number;
}

@ApiTags('API Pública v1')
@ApiSecurity('x-api-key')
@Controller('v1')
@UseGuards(ApiKeyGuard)
export class ApiPublicaController {
  constructor(private readonly apiPublicaService: ApiPublicaService) {}

  @Get('agendamentos')
  @ApiOperation({
    summary: 'Lista agendamentos da barbearia (filtro por data)',
  })
  @ApiQuery({
    name: 'data',
    required: false,
    example: '2026-05-25',
    description: 'Filtrar por data (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos.' })
  listarAgendamentos(@Req() req: ApiKeyRequest, @Query('data') data?: string) {
    return this.apiPublicaService.listarAgendamentos(req.apiKeyBarCodigo, data);
  }

  @Post('agendamentos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um agendamento via API pública' })
  @ApiResponse({ status: 201, description: 'Agendamento criado.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou serviço não encontrado.',
  })
  @ApiResponse({ status: 409, description: 'Conflito de horário.' })
  criarAgendamento(
    @Req() req: ApiKeyRequest,
    @Body() dto: CriarAgendamentoPublicoDto,
  ) {
    return this.apiPublicaService.criarAgendamento(req.apiKeyBarCodigo, dto);
  }

  @Get('servicos')
  @ApiOperation({ summary: 'Lista serviços disponíveis da barbearia' })
  @ApiResponse({ status: 200, description: 'Lista de serviços.' })
  listarServicos(@Req() req: ApiKeyRequest) {
    return this.apiPublicaService.listarServicos(req.apiKeyBarCodigo);
  }

  @Get('barbeiros')
  @ApiOperation({ summary: 'Lista barbeiros da barbearia' })
  @ApiResponse({ status: 200, description: 'Lista de barbeiros.' })
  listarBarbeiros(@Req() req: ApiKeyRequest) {
    return this.apiPublicaService.listarBarbeiros(req.apiKeyBarCodigo);
  }
}
