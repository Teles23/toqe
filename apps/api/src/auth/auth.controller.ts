import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
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
  logout(@Request() req, @Body() dto: LogoutDto) {
    return this.authService.logout(req.user.sub, dto);
  }
}
