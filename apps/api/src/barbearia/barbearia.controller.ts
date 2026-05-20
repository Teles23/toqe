import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BarbeariaService } from './barbearia.service';
import { MembroBarbeariaService } from './membro-barbearia.service';
import { TemaTenantService } from './tema-tenant.service';
import { CreateBarbeariaDto } from './dto/create-barbearia.dto';
import { UpdateBarbeariaDto } from './dto/update-barbearia.dto';
import { ConvidarMembroDto } from './dto/convidar-membro.dto';
import { CriarClienteRapidoDto } from './dto/criar-cliente-rapido.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';
import { UpsertHorariosDto } from './dto/upsert-horarios.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtRequest } from '../common/types/jwt-request';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FeatureFlagGuard } from '../auth/guards/feature-flag.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Feature } from '../auth/decorators/feature.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';

@ApiTags('Barbearias')
@ApiBearerAuth('JWT')
@Controller('barbearias')
export class BarbeariaController {
  constructor(
    private readonly barbeariaService: BarbeariaService,
    private readonly membroService: MembroBarbeariaService,
    private readonly temaService: TemaTenantService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Cria uma nova barbearia e define o usuário como DONO',
  })
  @ApiResponse({ status: 201, description: 'Barbearia criada.' })
  @ApiResponse({ status: 409, description: 'Slug já em uso.' })
  create(@Body() dto: CreateBarbeariaDto, @Request() req: JwtRequest) {
    return this.barbeariaService.create(dto, req.user.sub);
  }

  @Get('publico')
  @ApiOperation({ summary: 'Lista pública de barbearias (sem autenticação)' })
  @ApiResponse({ status: 200, description: 'Lista de barbearias.' })
  findPublico(@Query('q') q?: string) {
    return this.barbeariaService.findPublico(q);
  }

  @Get(':barCodigo')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Retorna os dados da barbearia' })
  @ApiResponse({ status: 200, description: 'Dados da barbearia.' })
  findOne(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.barbeariaService.findOne(barCodigo);
  }

  @Put(':barCodigo')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Atualiza dados básicos da barbearia' })
  @ApiResponse({ status: 200, description: 'Barbearia atualizada.' })
  @ApiResponse({ status: 409, description: 'Slug já em uso.' })
  update(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Body() dto: UpdateBarbeariaDto,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.barbeariaService.update(barCodigo, dto);
  }

  @Get(':barCodigo/barbeiros')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente', 'recepcionista')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Lista barbeiros da barbearia com stats do mês' })
  @ApiResponse({ status: 200, description: 'Lista de barbeiros com métricas.' })
  findBarbeiros(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.membroService.findBarbeiros(barCodigo);
  }

  @Get(':barCodigo/clientes')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente', 'recepcionista', 'barbeiro')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Lista clientes da barbearia com histórico' })
  @ApiResponse({ status: 200, description: 'Lista de clientes com histórico.' })
  findClientes(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.membroService.findClientes(barCodigo);
  }

  @Post(':barCodigo/clientes')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente', 'recepcionista')
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Cria ou vincula cliente rápido à barbearia' })
  @ApiResponse({ status: 201, description: 'Cliente criado/vinculado.' })
  @ApiResponse({ status: 409, description: 'Usuário já é cliente.' })
  criarCliente(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Body() dto: CriarClienteRapidoDto,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.membroService.criarCliente(barCodigo, dto);
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
    return this.membroService.findMembros(barCodigo);
  }

  @Post(':barCodigo/membros')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({
    summary: 'Convida um usuário existente para a barbearia pelo e-mail',
  })
  @ApiResponse({ status: 201, description: 'Membro adicionado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 409, description: 'Usuário já é membro.' })
  convidarMembro(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Body() dto: ConvidarMembroDto,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.membroService.convidarMembro(barCodigo, dto);
  }

  @Get(':barCodigo/tema')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Retorna o tema (white-label) da barbearia' })
  @ApiResponse({ status: 200, description: 'Tema retornado.' })
  getTema(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.temaService.getTema(barCodigo);
  }

  @Put(':barCodigo/tema')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, FeatureFlagGuard)
  @Roles('dono', 'gerente')
  @Feature('whiteLabel')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({
    summary: 'Atualiza o tema (white-label) — requer plano com whiteLabel=true',
  })
  @ApiResponse({ status: 200, description: 'Tema atualizado.' })
  @ApiResponse({ status: 403, description: 'Plano não inclui white-label.' })
  upsertTema(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Body() dto: UpdateTemaDto,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.temaService.upsertTema(barCodigo, dto);
  }

  @Get(':barCodigo/horarios')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente', 'barbeiro', 'recepcionista')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({
    summary: 'Retorna os horários de funcionamento da barbearia',
  })
  @ApiResponse({ status: 200, description: 'Horários retornados.' })
  getHorarios(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.barbeariaService.getHorarios(barCodigo);
  }

  @Put(':barCodigo/horarios')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({
    summary: 'Atualiza (upsert) os horários de funcionamento da barbearia',
  })
  @ApiResponse({ status: 200, description: 'Horários atualizados.' })
  upsertHorarios(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Body() dto: UpsertHorariosDto,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.barbeariaService.upsertHorarios(barCodigo, dto);
  }

  @Delete(':barCodigo/membros/:usrCodigo')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiSecurity('x-tenant-id')
  @ApiOperation({
    summary: 'Remove um membro da barbearia (não remove o dono)',
  })
  @ApiResponse({ status: 204, description: 'Membro removido.' })
  @ApiResponse({ status: 400, description: 'Não é possível remover o dono.' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado.' })
  removerMembro(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @Param('usrCodigo', ParseIntPipe) usrCodigo: number,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    return this.membroService.removerMembro(barCodigo, usrCodigo);
  }

  @Post(':barCodigo/logo')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('dono', 'gerente')
  @ApiSecurity('x-tenant-id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'logos');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          cb(
            new BadRequestException(
              'Apenas imagens JPEG, PNG ou WebP são aceitas',
            ),
            false,
          );
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload da logo da barbearia' })
  @ApiResponse({ status: 201, description: 'Logo atualizada.' })
  async uploadLogo(
    @Param('barCodigo', ParseIntPipe) barCodigo: number,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-tenant-id') _tenantId: string,
  ) {
    if (!file) throw new BadRequestException('Arquivo de imagem é obrigatório');
    const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';
    const logoUrl = `${apiBaseUrl}/uploads/logos/${file.filename}`;
    await this.temaService.upsertTema(barCodigo, { logoUrl });
    return { logoUrl };
  }
}
