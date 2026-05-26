import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Headers,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CriarApiKeyDto } from './dto/criar-api-key.dto';
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

@ApiTags('ApiKeys')
@ApiBearerAuth('JWT')
@ApiSecurity('x-tenant-id')
@Controller('api-keys')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @Roles('dono', 'gerente')
  @ApiOperation({ summary: 'Cria uma nova ApiKey para a barbearia' })
  @ApiResponse({
    status: 201,
    description: 'ApiKey criada. Retorna a key completa UMA VEZ.',
  })
  criar(
    @Body() dto: CriarApiKeyDto,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.apiKeyService.criar(Number(barCodigo), dto.nome);
  }

  @Get()
  @Roles('dono', 'gerente')
  @ApiOperation({ summary: 'Lista ApiKeys da barbearia (sem keyHash)' })
  @ApiResponse({ status: 200, description: 'Lista de ApiKeys.' })
  listar(@Headers('x-tenant-id') barCodigo: string) {
    return this.apiKeyService.listar(Number(barCodigo));
  }

  @Delete(':codigo')
  @Roles('dono', 'gerente')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga uma ApiKey' })
  @ApiResponse({ status: 204, description: 'ApiKey revogada.' })
  @ApiResponse({ status: 404, description: 'ApiKey não encontrada.' })
  revogar(
    @Param('codigo', ParseIntPipe) codigo: number,
    @Headers('x-tenant-id') barCodigo: string,
  ) {
    return this.apiKeyService.revogar(codigo, Number(barCodigo));
  }
}
