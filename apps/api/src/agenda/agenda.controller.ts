import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  ParseIntPipe,
  Headers,
  Query,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { ConfigJornadaDto } from './dto/config-jornada.dto';
import { CreateBloqueioDto } from './dto/create-bloqueio.dto';
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
} from '@nestjs/swagger';

@ApiTags('Agenda')
@ApiBearerAuth('JWT')
@ApiSecurity('x-tenant-id')
@Controller('agenda')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post('jornada/:barbeiroId')
  @Roles('dono', 'gerente', 'barbeiro')
  @ApiOperation({
    summary: 'Configura a jornada de trabalho semanal de um barbeiro',
  })
  @ApiResponse({ status: 201, description: 'Jornada configurada.' })
  configurarJornada(
    @Param('barbeiroId', ParseIntPipe) barbeiroId: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: ConfigJornadaDto,
  ) {
    return this.agendaService.upsertJornada(barbeiroId, Number(barCodigo), dto);
  }

  @Get('jornada/:barbeiroId')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({ summary: 'Obtém a jornada de trabalho de um barbeiro' })
  @ApiResponse({ status: 200, description: 'Jornada retornada.' })
  obterJornada(@Param('barbeiroId', ParseIntPipe) barbeiroId: number) {
    return this.agendaService.getJornada(barbeiroId);
  }

  @Post('bloqueios/:barbeiroId')
  @Roles('dono', 'gerente', 'barbeiro')
  @ApiOperation({
    summary: 'Cria um bloqueio manual na agenda (ex: folga, médico)',
  })
  @ApiResponse({ status: 201, description: 'Bloqueio criado.' })
  criarBloqueio(
    @Param('barbeiroId', ParseIntPipe) barbeiroId: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: CreateBloqueioDto,
  ) {
    return this.agendaService.createBloqueio(
      barbeiroId,
      Number(barCodigo),
      dto,
    );
  }

  @Get('disponibilidade/:barbeiroId')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({
    summary: 'Calcula e retorna os horários livres (slots) de um barbeiro',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de horários (ex: ["09:00", "09:30"]).',
  })
  async obterDisponibilidade(
    @Param('barbeiroId', ParseIntPipe) barbeiroId: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Query('data') data: string,
    @Query('duracao', ParseIntPipe) duracao: number,
  ) {
    return this.agendaService.getAvailableSlots(
      barbeiroId,
      Number(barCodigo),
      data,
      duracao,
    );
  }
}
