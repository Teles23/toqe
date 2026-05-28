import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TwoFaSetupDto } from './dto/two-fa-setup.dto';
import { TwoFaVerifyDto } from './dto/two-fa-verify.dto';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { JwtRequest } from '../common/types/jwt-request';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
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

  @Get('check-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Verifica se um e-mail já está cadastrado' })
  @ApiResponse({ status: 200, description: 'Retorna se o e-mail existe.' })
  async checkEmail(@Query('email') email: string) {
    const exists = await this.authService.checkEmailExists(email);
    return { exists };
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

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentica via Google ID token (cria usuário se primeiro acesso)',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticação Google bem-sucedida.',
  })
  @ApiResponse({
    status: 401,
    description: 'ID token Google inválido ou expirado.',
  })
  googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
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

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Altera a senha do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Senha alterada.' })
  @ApiResponse({ status: 400, description: 'Senha atual incorreta.' })
  async changePassword(
    @Request() req: JwtRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      req.user.sub,
      dto.senhaAtual,
      dto.novaSenha,
      dto.refreshToken,
    );
    return { message: 'Senha alterada com sucesso.' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Lista sessões ativas do usuário' })
  listSessions(@Request() req: JwtRequest) {
    return this.authService.listSessions(req.user.sub);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Revoga todas as sessões ativas' })
  async revokeAllSessions(@Request() req: JwtRequest) {
    await this.authService.revokeAllSessions(req.user.sub);
    return { message: 'Todas as sessões foram encerradas' };
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Revoga uma sessão específica' })
  async revokeSession(
    @Request() req: JwtRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.authService.revokeSession(req.user.sub, id);
    return { message: 'Sessão encerrada' };
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Gera QR code para configurar 2FA' })
  setup2Fa(@Request() req: JwtRequest) {
    return this.authService.setup2Fa(req.user.sub);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Habilita 2FA após verificar código TOTP' })
  async enable2Fa(@Request() req: JwtRequest, @Body() dto: TwoFaSetupDto) {
    await this.authService.enable2Fa(req.user.sub, dto.code);
    return { message: '2FA ativado com sucesso.' };
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Desabilita 2FA após verificar código TOTP' })
  async disable2Fa(@Request() req: JwtRequest, @Body() dto: TwoFaSetupDto) {
    await this.authService.disable2Fa(req.user.sub, dto.code);
    return { message: '2FA desativado.' };
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica código 2FA e completa o login' })
  verify2Fa(@Body() dto: TwoFaVerifyDto) {
    return this.authService.verifyTwoFa(dto.tempToken, dto.code);
  }
}
