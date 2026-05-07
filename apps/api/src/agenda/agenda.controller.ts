import { Controller, Post, Body, Get, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { ConfigJornadaDto } from './dto/config-jornada.dto';
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
}
