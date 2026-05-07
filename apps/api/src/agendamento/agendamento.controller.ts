import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { AgendamentoService } from './agendamento.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agendamentos')
@UseGuards(JwtAuthGuard)
export class AgendamentoController {
  constructor(private readonly agendamentoService: AgendamentoService) {}

  @Post()
  create(
    @Body() dto: CreateAgendamentoDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.agendamentoService.create(dto, Number(barCodigo));
  }
}
