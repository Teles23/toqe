import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../usuario/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    controller = module.get(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('delega para authService.register', () => {
      const dto: CreateUserDto = {
        nome: 'Ana',
        email: 'ana@test.com',
        senha: 'abc123',
      };
      mockAuthService.register.mockResolvedValue({ codigo: 1 });

      void controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('delega para authService.login', () => {
      const dto: LoginDto = { email: 'ana@test.com', senha: 'abc123' };
      mockAuthService.login.mockResolvedValue({ accessToken: 'tok' });

      void controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('delega para authService.refresh', () => {
      const dto: RefreshTokenDto = { refreshToken: 'ref-tok' };
      mockAuthService.refresh.mockResolvedValue({ accessToken: 'new-tok' });

      void controller.refresh(dto);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(dto);
    });
  });

  describe('logout', () => {
    it('delega para authService.logout com sub do usuario', () => {
      const req = { user: { sub: 7 } } as JwtRequest;
      const dto: LogoutDto = { refreshToken: 'ref-tok' };
      mockAuthService.logout.mockResolvedValue(undefined);

      void controller.logout(req, dto);

      expect(mockAuthService.logout).toHaveBeenCalledWith(7, dto);
    });
  });

  describe('forgotPassword', () => {
    it('delega para authService.forgotPassword e retorna mensagem', async () => {
      const dto: ForgotPasswordDto = { email: 'ana@test.com' };
      mockAuthService.forgotPassword.mockResolvedValue(undefined);

      const result = await controller.forgotPassword(dto);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto.email);
      expect(result).toEqual({
        message:
          'Se o e-mail estiver cadastrado, você receberá um link em breve.',
      });
    });
  });

  describe('resetPassword', () => {
    it('delega para authService.resetPassword e retorna mensagem', async () => {
      const dto: ResetPasswordDto = {
        token: 'abc123token',
        novaSenha: 'novaSenha123',
      };
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const result = await controller.resetPassword(dto);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        dto.token,
        dto.novaSenha,
      );
      expect(result).toEqual({ message: 'Senha redefinida com sucesso.' });
    });
  });
});
