import { Controller, Post, Body, Get, UseGuards, Headers } from '@nestjs/common';
import { ServicoService } from './servico.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Serviços')
@ApiBearerAuth('JWT')
@ApiSecurity('x-tenant-id')
@Controller('servicos')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ServicoController {
  constructor(private readonly servicoService: ServicoService) {}

  @Post()
  @Roles('dono', 'gerente')
  @ApiOperation({ summary: 'Cria um novo serviço para a barbearia' })
  @ApiResponse({ status: 201, description: 'Serviço criado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado (requer dono/gerente).' })
  create(
    @Body() dto: CreateServicoDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.servicoService.create(dto, Number(barCodigo));
  }

  @Get()
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({ summary: 'Lista os serviços ativos da barbearia' })
  @ApiResponse({ status: 200, description: 'Lista de serviços retornada.' })
  findAll(@Headers('x-tenant-id') barCodigo: string) {
    return this.servicoService.findAll(Number(barCodigo));
  }
}
