import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Headers,
  Request,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { ClienteNotaService } from './cliente-nota.service';
import { SalvarNotaClienteDto } from './dto/salvar-nota-cliente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { TenantRequest } from '../common/types/jwt-request';

/**
 * Notas privadas por barbeiro sobre um cliente. O barbeiro é sempre o usuário
 * logado (`req.user.sub`) — nunca um parâmetro — para que ninguém leia/edite
 * notas de outro barbeiro. Escopo de barbearia via `x-tenant-id`.
 */
@ApiTags('Clientes')
@ApiBearerAuth('JWT')
@ApiSecurity('x-tenant-id')
@Controller('clientes')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ClienteNotaController {
  constructor(private readonly service: ClienteNotaService) {}

  @Get(':clienteId/nota')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({ summary: 'Nota privada do barbeiro logado sobre o cliente' })
  @ApiResponse({ status: 200, description: 'Nota (ou conteúdo vazio).' })
  obterNota(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Request() req: TenantRequest,
  ) {
    return this.service.obterNota(Number(barCodigo), req.user.sub, clienteId);
  }

  @Put(':clienteId/nota')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({ summary: 'Cria/atualiza (ou remove, se vazio) a nota' })
  @ApiResponse({ status: 200, description: 'Nota salva.' })
  salvarNota(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: SalvarNotaClienteDto,
    @Request() req: TenantRequest,
  ) {
    return this.service.salvarNota(
      Number(barCodigo),
      req.user.sub,
      clienteId,
      dto.conteudo,
    );
  }
}
