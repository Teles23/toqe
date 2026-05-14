import { Test } from '@nestjs/testing';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';

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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
