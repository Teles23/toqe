import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { AgendamentoService } from './agendamento.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('agendamentos')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AgendamentoController {
  constructor(private readonly agendamentoService: AgendamentoService) {}

  @Post()
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  create(
    @Body() dto: CreateAgendamentoDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.agendamentoService.create(dto, Number(barCodigo));
  }
}
