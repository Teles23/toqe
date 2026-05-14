import { Test } from '@nestjs/testing';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import type { JwtRequest } from '../common/types/jwt-request';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const mockUsuarioService = { me: jest.fn(), update: jest.fn() };

describe('UsuarioController', () => {
  let controller: UsuarioController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsuarioController],
      providers: [{ provide: UsuarioService, useValue: mockUsuarioService }],
    }).compile();
    controller = module.get(UsuarioController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('me', () => {
    it('delega para usuarioService.me com o sub do usuario', () => {
      const req = { user: { sub: 7 } } as JwtRequest;
      mockUsuarioService.me.mockResolvedValue({ codigo: 7 });

      controller.me(req);

      expect(mockUsuarioService.me).toHaveBeenCalledWith(7);
    });
  });

  describe('update', () => {
    it('delega para usuarioService.update com sub e dto', () => {
      const req = { user: { sub: 7 } } as JwtRequest;
      const dto: UpdateUsuarioDto = { nome: 'Ana Nova' };
      mockUsuarioService.update.mockResolvedValue({
        codigo: 7,
        nome: 'Ana Nova',
      });

      controller.update(req, dto);

      expect(mockUsuarioService.update).toHaveBeenCalledWith(7, dto);
    });
  });
});
