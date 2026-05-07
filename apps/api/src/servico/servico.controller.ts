import { Controller, Post, Body, Get, UseGuards, Headers } from '@nestjs/common';
import { ServicoService } from './servico.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('servicos')
@UseGuards(JwtAuthGuard)
export class ServicoController {
  constructor(private readonly servicoService: ServicoService) {}

  @Post()
  create(
    @Body() dto: CreateServicoDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.servicoService.create(dto, Number(barCodigo));
  }

  @Get()
  findAll(@Headers('x-tenant-id') barCodigo: string) {
    return this.servicoService.findAll(Number(barCodigo));
  }
}
