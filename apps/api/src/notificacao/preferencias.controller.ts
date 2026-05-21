import {
  Controller,
  Get,
  Put,
  Body,
  Request,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { PreferenciasService } from './preferencias.service';
import { UpdatePreferenciasDto } from './dto/update-preferencias.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtRequest } from '../common/types/jwt-request';
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

@ApiTags('Notificações')
@ApiBearerAuth('JWT')
@ApiSecurity('x-tenant-id')
@Controller('notificacoes/preferencias')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
export class PreferenciasController {
  constructor(private readonly preferenciasService: PreferenciasService) {}

  @Get()
  @ApiOperation({
    summary:
      'Retorna as preferências de notificação do usuário nesta barbearia',
  })
  @ApiResponse({ status: 200, description: 'Preferências retornadas.' })
  find(@Request() req: JwtRequest, @Headers('x-tenant-id') barCodigo: string) {
    return this.preferenciasService.find(req.user.sub, Number(barCodigo));
  }

  @Put()
  @ApiOperation({
    summary: 'Atualiza os canais de notificação (email, push, whatsapp, sms)',
  })
  @ApiResponse({ status: 200, description: 'Preferências atualizadas.' })
  update(
    @Request() req: JwtRequest,
    @Headers('x-tenant-id') barCodigo: string,
    @Body() dto: UpdatePreferenciasDto,
  ) {
    return this.preferenciasService.update(
      req.user.sub,
      Number(barCodigo),
      dto,
    );
  }
}
