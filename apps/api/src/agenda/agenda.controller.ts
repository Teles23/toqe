import { Controller, Post, Body, Get, UseGuards, Param, ParseIntPipe, Headers, Query } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { ConfigJornadaDto } from './dto/config-jornada.dto';
import { CreateBloqueioDto } from './dto/create-bloqueio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agenda')
@UseGuards(JwtAuthGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post('jornada/:barbeiroId')
  configurarJornada(
    @Param('barbeiroId', ParseIntPipe) barbeiroId: number,
    @Body() dto: ConfigJornadaDto,
  ) {
    return this.agendaService.upsertJornada(barbeiroId, dto);
  }

  @Get('jornada/:barbeiroId')
  obterJornada(@Param('barbeiroId', ParseIntPipe) barbeiroId: number) {
    return this.agendaService.getJornada(barbeiroId);
  }

  @Post('bloqueios/:barbeiroId')
  criarBloqueio(
    @Param('barbeiroId', ParseIntPipe) barbeiroId: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: CreateBloqueioDto,
  ) {
    return this.agendaService.createBloqueio(barbeiroId, Number(barCodigo), dto);
  }

  @Get('disponibilidade/:barbeiroId')
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
