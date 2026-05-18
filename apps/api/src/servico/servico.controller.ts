import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  UseGuards,
  Headers,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ServicoService } from './servico.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
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
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  create(
    @Body() dto: CreateServicoDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.servicoService.create(dto, Number(barCodigo));
  }

  @Get()
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({ summary: 'Lista os serviços ativos da barbearia' })
  @ApiResponse({ status: 200, description: 'Lista de serviços.' })
  findAll(@Headers('x-tenant-id') barCodigo: string) {
    return this.servicoService.findAll(Number(barCodigo));
  }

  @Get('metricas')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({
    summary:
      'Métricas dos serviços: total ativo, pedidos/mês, receita/mês, ticket médio',
  })
  @ApiResponse({ status: 200, description: 'Métricas calculadas.' })
  getMetricas(@Headers('x-tenant-id') barCodigo: string) {
    return this.servicoService.getMetricas(Number(barCodigo));
  }

  @Get(':codigo')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({ summary: 'Detalha um serviço pelo código' })
  @ApiResponse({ status: 200, description: 'Serviço encontrado.' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado.' })
  findOne(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.servicoService.findOne(codigo, Number(barCodigo));
  }

  @Put(':codigo')
  @Roles('dono', 'gerente')
  @ApiOperation({ summary: 'Atualiza um serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado.' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado.' })
  update(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Body() dto: UpdateServicoDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.servicoService.update(codigo, dto, Number(barCodigo));
  }

  @Delete(':codigo')
  @Roles('dono', 'gerente')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativa um serviço (soft delete)' })
  @ApiResponse({ status: 204, description: 'Serviço desativado.' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado.' })
  remove(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.servicoService.remove(codigo, Number(barCodigo));
  }
}
