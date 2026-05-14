import { Controller, Get, Put, Body, Request, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtRequest } from '../common/types/jwt-request';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
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
}
