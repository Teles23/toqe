import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { JwtRequest } from '../common/types/jwt-request';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../usuario/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// 10 requisições por minuto por IP — proteção contra brute-force
@Throttle({ default: { ttl: 60_000, limit: 10 } })
@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuário (conta global)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'E-mail já está em uso.' })
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login com e-mail e senha' })
  @ApiResponse({
    status: 201,
    description: 'Login bem-sucedido. Retorna tokens.',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Atualiza o token de acesso (rotação)' })
  @ApiResponse({ status: 201, description: 'Novos tokens gerados.' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou revogado.',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Revoga o refresh token (logout)' })
  @ApiResponse({ status: 200, description: 'Logout realizado.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou já revogado.' })
  logout(@Request() req: JwtRequest, @Body() dto: LogoutDto) {
    return this.authService.logout(req.user.sub, dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicita link de recuperação de senha' })
  @ApiResponse({
    status: 200,
    description: 'Se o e-mail existir, será enviado um link.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message:
        'Se o e-mail estiver cadastrado, você receberá um link em breve.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redefine a senha usando o token recebido por e-mail',
  })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.novaSenha);
    return { message: 'Senha redefinida com sucesso.' };
  }
}
