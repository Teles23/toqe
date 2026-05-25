import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Headers,
  Query,
} from '@nestjs/common';
import { FidelidadeService } from './fidelidade.service';
import { ResgatarPontosDto } from './dto/resgatar-pontos.dto';
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

@ApiTags('Fidelidade')
@ApiBearerAuth('JWT')
@ApiSecurity('x-tenant-id')
@Controller('fidelidade')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class FidelidadeController {
  constructor(private readonly fidelidadeService: FidelidadeService) {}

  @Get('ranking')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiOperation({ summary: 'Retorna top N clientes por pontos acumulados' })
  @ApiResponse({ status: 200, description: 'Ranking de clientes.' })
  getRanking(
    @Headers('x-tenant-id') barCodigo: string,
    @Query('limit') limit?: string,
  ) {
    return this.fidelidadeService.getRanking(
      Number(barCodigo),
      Number(limit ?? 10),
    );
  }

  @Get('saldo/:clienteCodigo')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({
    summary: 'Retorna saldo atual de pontos e histórico do cliente',
  })
  @ApiResponse({ status: 200, description: 'Saldo e histórico retornados.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  getSaldo(
    @Param('clienteCodigo', ParseIntPipe) clienteCodigo: number,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.fidelidadeService.getSaldo(clienteCodigo, Number(barCodigo));
  }

  @Post('resgatar')
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista', 'cliente')
  @ApiOperation({ summary: 'Resgata pontos por desconto' })
  @ApiResponse({
    status: 201,
    description: 'Pontos resgatados. Retorna valor do desconto.',
  })
  @ApiResponse({
    status: 400,
    description: 'Saldo insuficiente ou pontos abaixo do mínimo.',
  })
  resgatar(
    @Body() dto: ResgatarPontosDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.fidelidadeService.resgatar(
      dto.clienteCodigo,
      Number(barCodigo),
      dto.pontos,
    );
  }
}
