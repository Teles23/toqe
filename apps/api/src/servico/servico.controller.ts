import { Controller, Post, Body, Get, UseGuards, Headers } from '@nestjs/common';
import { ServicoService } from './servico.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('servicos')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ServicoController {
  constructor(private readonly servicoService: ServicoService) {}

  @Post()
  @Roles('dono', 'gerente')
  create(
    @Body() dto: CreateServicoDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.servicoService.create(dto, Number(barCodigo));
  }

  @Get()
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  findAll(@Headers('x-tenant-id') barCodigo: string) {
    return this.servicoService.findAll(Number(barCodigo));
  }
}
