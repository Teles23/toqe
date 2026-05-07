import { Controller, Post, Body, Get, UseGuards, Param, ParseIntPipe, Headers, Query } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { ConfigJornadaDto } from './dto/config-jornada.dto';
import { CreateBloqueioDto } from './dto/create-bloqueio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('agenda')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post('jornada/:barbeiroId')
  @Roles('dono', 'gerente', 'barbeiro')
  configurarJornada(
    @Param('barbeiroId', ParseIntPipe) barbeiroId: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: ConfigJornadaDto,
  ) {
    return this.agendaService.upsertJornada(barbeiroId, Number(barCodigo), dto);
  }

  @Get('jornada/:barbeiroId')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  obterJornada(@Param('barbeiroId', ParseIntPipe) barbeiroId: number) {
    return this.agendaService.getJornada(barbeiroId);
  }

  @Post('bloqueios/:barbeiroId')
  @Roles('dono', 'gerente', 'barbeiro')
  criarBloqueio(
    @Param('barbeiroId', ParseIntPipe) barbeiroId: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: CreateBloqueioDto,
  ) {
    return this.agendaService.createBloqueio(barbeiroId, Number(barCodigo), dto);
  }

  @Get('disponibilidade/:barbeiroId')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  async obterDisponibilidade(
    @Param('barbeiroId', ParseIntPipe) barbeiroId: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Query('data') data: string,
    @Query('duracao', ParseIntPipe) duracao: number,
  ) {
    return this.agendaService.getAvailableSlots(barbeiroId, Number(barCodigo), data, duracao);
  }
}
