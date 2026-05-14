import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { JwtRequest } from '../common/types/jwt-request';
import { CreateUserDto } from '../usuario/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
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

      controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('delega para authService.login', () => {
      const dto: LoginDto = { email: 'ana@test.com', senha: 'abc123' };
      mockAuthService.login.mockResolvedValue({ accessToken: 'tok' });

      controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('delega para authService.refresh', () => {
      const dto: RefreshTokenDto = { refreshToken: 'ref-tok' };
      mockAuthService.refresh.mockResolvedValue({ accessToken: 'new-tok' });

      controller.refresh(dto);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(dto);
    });
  });

  describe('logout', () => {
    it('delega para authService.logout com sub do usuario', () => {
      const req = { user: { sub: 7 } } as JwtRequest;
      const dto: LogoutDto = { refreshToken: 'ref-tok' };
      mockAuthService.logout.mockResolvedValue(undefined);

      controller.logout(req, dto);

      expect(mockAuthService.logout).toHaveBeenCalledWith(7, dto);
    });
  });
});
