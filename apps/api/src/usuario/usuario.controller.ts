import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UsuarioService } from './usuario.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtRequest } from '../common/types/jwt-request';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('Usuários')
@ApiBearerAuth('JWT')
@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Retorna o perfil do usuário autenticado com suas barbearias',
  })
  @ApiResponse({ status: 200, description: 'Perfil retornado.' })
  me(@Request() req: JwtRequest) {
    return this.usuarioService.me(req.user.sub);
  }

  @Put('me')
  @ApiOperation({
    summary: 'Atualiza nome, telefone ou avatar do usuário autenticado',
  })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  update(@Request() req: JwtRequest, @Body() dto: UpdateUsuarioDto) {
    return this.usuarioService.update(req.user.sub, dto);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload da foto de perfil do usuário autenticado' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Avatar atualizado.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'avatars');
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
  async uploadAvatar(
    @Request() req: JwtRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo de imagem é obrigatório');
    const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';
    const avatarUrl = `${apiBaseUrl}/uploads/avatars/${file.filename}`;
    await this.usuarioService.updateAvatar(req.user.sub, avatarUrl);
    return { avatarUrl };
  }
}
