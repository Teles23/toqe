import { Controller, Get, Put, Body, Request, Headers, UseGuards } from '@nestjs/common';
import { PreferenciasService } from './preferencias.service';
import { UpdatePreferenciasDto } from './dto/update-preferencias.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Notificações')
@ApiBearerAuth('JWT')
@ApiSecurity('x-tenant-id')
@Controller('notificacoes/preferencias')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PreferenciasController {
  constructor(private readonly preferenciasService: PreferenciasService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna as preferências de notificação do usuário nesta barbearia' })
  @ApiResponse({ status: 200, description: 'Preferências retornadas.' })
  find(@Request() req, @Headers('x-tenant-id') barCodigo: string) {
    return this.preferenciasService.find(req.user.sub, Number(barCodigo));
  }

  @Put()
  @ApiOperation({ summary: 'Atualiza os canais de notificação (email, push, whatsapp, sms)' })
  @ApiResponse({ status: 200, description: 'Preferências atualizadas.' })
  update(
    @Request() req,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: UpdatePreferenciasDto,
  ) {
    return this.preferenciasService.update(req.user.sub, Number(barCodigo), dto);
  }
}
