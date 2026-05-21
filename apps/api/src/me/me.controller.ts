import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { MeService, Periodo } from './me.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtRequest } from '../common/types/jwt-request';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Me')
@ApiBearerAuth('JWT')
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('stats')
  @ApiOperation({
    summary:
      'Estatísticas do barbeiro autenticado (atendimentos, faturamento, presença)',
  })
  @ApiQuery({
    name: 'periodo',
    required: false,
    enum: ['mes', 'semana'],
    description: 'Período de cálculo (padrão: mes)',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas.' })
  getStats(@Request() req: JwtRequest, @Query('periodo') periodo?: string) {
    const periodoValido: Periodo = periodo === 'semana' ? 'semana' : 'mes';
    return this.meService.getStats(req.user.sub, periodoValido);
  }
}
