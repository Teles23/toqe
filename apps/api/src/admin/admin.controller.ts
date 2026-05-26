import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { AdminService } from './admin.service';
import { UpdatePlanoDto } from './dto/update-plano.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** Métricas globais: MRR, ARR, totais */
  @Get('metrics')
  getMetrics() {
    return this.adminService.getMetrics();
  }

  /** Lista todas as barbearias (com filtros opcionais) */
  @Get('barbearias')
  getBarbearias(
    @Query('search') search?: string,
    @Query('plano') plano?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getBarbearias({ search, plano, status });
  }

  /** Atividade global recente */
  @Get('activity')
  getActivity() {
    return this.adminService.getActivity();
  }

  /** Dados de receita: MRR histórico + breakdown */
  @Get('revenue')
  getRevenue() {
    return this.adminService.getRevenue();
  }

  /** Detalhe de uma barbearia */
  @Get('barbearias/:id')
  getBarbeariaById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getBarbeariaById(id);
  }

  /** Altera o plano de uma barbearia */
  @Patch('barbearias/:id/plano')
  updatePlano(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanoDto,
  ) {
    return this.adminService.updatePlano(id, dto.plano);
  }

  /** Altera o status de uma barbearia */
  @Patch('barbearias/:id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.adminService.updateStatus(id, dto.status);
  }
}
