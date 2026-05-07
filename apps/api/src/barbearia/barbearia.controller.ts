import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request, Headers, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { BarbeariaService } from './barbearia.service';
import { CreateBarbeariaDto } from './dto/create-barbearia.dto';
import { ConvidarMembroDto } from './dto/convidar-membro.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Barbearias')
@ApiBearerAuth('JWT')
@Controller('barbearias')
export class BarbeariaController {
  constructor(private readonly barbeariaService: BarbeariaService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cria uma nova barbearia e define o usuário como DONO' })
  @ApiResponse({ status: 201, description: 'Barbearia criada.' })
  @ApiResponse({ status: 409, description: 'Slug já em uso.' })
  create(@Body() dto: CreateBarbeariaDto, @Request() req) {
    return this.barbeariaService.create(dto, req.user.sub);
  }

  @Get(':barCodigo/membros')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Lista todos os membros da barbearia' })
  @ApiResponse({ status: 200, description: 'Lista de membros.' })
  findMembros(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.barbeariaService.findMembros(barCodigo);
  }

  @Post(':barCodigo/membros')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Convida um usuário existente para a barbearia pelo e-mail' })
  @ApiResponse({ status: 201, description: 'Membro adicionado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 409, description: 'Usuário já é membro.' })
  convidarMembro(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Body() dto: ConvidarMembroDto,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.barbeariaService.convidarMembro(barCodigo, dto);
  }

  @Delete(':barCodigo/membros/:usrCodigo')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Remove um membro da barbearia (não remove o dono)' })
  @ApiResponse({ status: 204, description: 'Membro removido.' })
  @ApiResponse({ status: 400, description: 'Não é possível remover o dono.' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado.' })
  removerMembro(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Param('usrCodigo', ParseIntPipe) usrCodigo: number,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.barbeariaService.removerMembro(barCodigo, usrCodigo);
  }
}
