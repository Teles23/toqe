import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicoService } from './publico.service';
import { CreatePublicAgendamentoDto } from './dto/create-public-agendamento.dto';

/**
 * Endpoints públicos (sem JWT) usados pelo fluxo de booking em
 * `/b/:slug` no web. Todas as rotas resolvem barbearia por slug e
 * delegam para os services existentes — nada de regras de domínio aqui.
 *
 * `POST /publico/:slug/agendamentos` tem rate-limit dedicado (5 req/min por
 * IP) porque é a única superfície de escrita anônima do projeto.
 */
@ApiTags('Público')
@Controller('publico')
export class PublicoController {
  constructor(private readonly publicoService: PublicoService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Dados públicos da barbearia por slug' })
  @ApiResponse({ status: 200, description: 'Barbearia encontrada.' })
  @ApiResponse({ status: 404, description: 'Barbearia não encontrada.' })
  getBarbearia(@Param('slug') slug: string) {
    return this.publicoService.getBarbeariaPorSlug(slug);
  }

  @Get(':slug/servicos')
  @ApiOperation({ summary: 'Serviços ativos da barbearia (público)' })
  @ApiResponse({ status: 200, description: 'Lista de serviços.' })
  listarServicos(@Param('slug') slug: string) {
    return this.publicoService.listarServicos(slug);
  }

  @Get(':slug/barbeiros')
  @ApiOperation({ summary: 'Barbeiros da barbearia (público, sem stats)' })
  @ApiResponse({ status: 200, description: 'Lista de barbeiros.' })
  listarBarbeiros(@Param('slug') slug: string) {
    return this.publicoService.listarBarbeiros(slug);
  }

  @Get(':slug/slots')
  @ApiOperation({
    summary:
      'Slots disponíveis no dia para um barbeiro (ou "qualquer", barbeiroId=0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de slots [{ horario, barbeiroId }].',
  })
  listarSlots(
    @Param('slug') slug: string,
    @Query('barbeiroId', new DefaultValuePipe(0), ParseIntPipe)
    barbeiroId: number,
    @Query('data') data: string,
    @Query('duracao', new DefaultValuePipe(30), ParseIntPipe) duracao: number,
  ) {
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw new BadRequestException('Parâmetro "data" deve ser YYYY-MM-DD');
    }
    if (duracao <= 0 || duracao > 480) {
      throw new BadRequestException('Duração inválida (1 a 480 minutos)');
    }
    return this.publicoService.listarSlots({
      slug,
      barbeiroId,
      data,
      duracao,
    });
  }

  @Post(':slug/agendamentos')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({
    summary: 'Cria agendamento público (cria/recupera cliente automaticamente)',
  })
  @ApiResponse({ status: 201, description: 'Agendamento criado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 404, description: 'Barbearia não encontrada.' })
  @ApiResponse({ status: 409, description: 'Horário indisponível.' })
  criarAgendamento(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicAgendamentoDto,
  ) {
    return this.publicoService.criarAgendamento(slug, dto);
  }
}
