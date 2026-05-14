import { Test } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { ServicoController } from './servico.controller';
import { ServicoService } from './servico.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockServicoService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ServicoController', () => {
  let controller: ServicoController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ServicoController],
      providers: [{ provide: ServicoService, useValue: mockServicoService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();
    controller = module.get(ServicoController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('delega para servicoService.create com barCodigo convertido', () => {
      const dto: CreateServicoDto = {
        nome: 'Corte',
        precoBase: 25,
        duracaoBase: 30,
      };
      mockServicoService.create.mockResolvedValue({ codigo: 1 });

      void controller.create(dto, '3');

      expect(mockServicoService.create).toHaveBeenCalledWith(dto, 3);
    });
  });

  describe('findAll', () => {
    it('delega para servicoService.findAll com barCodigo convertido', () => {
      mockServicoService.findAll.mockResolvedValue([]);

      void controller.findAll('3');

      expect(mockServicoService.findAll).toHaveBeenCalledWith(3);
    });
  });

  describe('findOne', () => {
    it('delega para servicoService.findOne com codigo e barCodigo', () => {
      mockServicoService.findOne.mockResolvedValue({ codigo: 5 });

      void controller.findOne(5, '3');

      expect(mockServicoService.findOne).toHaveBeenCalledWith(5, 3);
    });
  });

  describe('update', () => {
    it('delega para servicoService.update', () => {
      const dto: UpdateServicoDto = { nome: 'Corte Premium' };
      mockServicoService.update.mockResolvedValue({ codigo: 5 });

      void controller.update(5, dto, '3');

      expect(mockServicoService.update).toHaveBeenCalledWith(5, dto, 3);
    });
  });

  describe('remove', () => {
    it('delega para servicoService.remove', () => {
      mockServicoService.remove.mockResolvedValue({ ativo: false });

      void controller.remove(5, '3');

      expect(mockServicoService.remove).toHaveBeenCalledWith(5, 3);
    });
  });
});
