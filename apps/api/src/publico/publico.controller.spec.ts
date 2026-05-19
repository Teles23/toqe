import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PublicoController } from './publico.controller';
import { PublicoService } from './publico.service';

const mockService = {
  getBarbeariaPorSlug: jest.fn(),
  listarServicos: jest.fn(),
  listarBarbeiros: jest.fn(),
  listarSlots: jest.fn(),
  criarAgendamento: jest.fn(),
};

describe('PublicoController', () => {
  let controller: PublicoController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PublicoController],
      providers: [{ provide: PublicoService, useValue: mockService }],
    }).compile();
    controller = module.get(PublicoController);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /:slug delega para service', async () => {
    mockService.getBarbeariaPorSlug.mockResolvedValue({ codigo: 1 });
    const result = await controller.getBarbearia('urban');
    expect(result).toEqual({ codigo: 1 });
    expect(mockService.getBarbeariaPorSlug).toHaveBeenCalledWith('urban');
  });

  it('GET /:slug/servicos delega para service', async () => {
    mockService.listarServicos.mockResolvedValue([]);
    await controller.listarServicos('urban');
    expect(mockService.listarServicos).toHaveBeenCalledWith('urban');
  });

  it('GET /:slug/barbeiros delega para service', async () => {
    mockService.listarBarbeiros.mockResolvedValue([]);
    await controller.listarBarbeiros('urban');
    expect(mockService.listarBarbeiros).toHaveBeenCalledWith('urban');
  });

  describe('GET /:slug/slots', () => {
    it('chama service com query params', async () => {
      mockService.listarSlots.mockResolvedValue([]);
      await controller.listarSlots('urban', 0, '2026-05-20', 30);
      expect(mockService.listarSlots).toHaveBeenCalledWith({
        slug: 'urban',
        barbeiroId: 0,
        data: '2026-05-20',
        duracao: 30,
      });
    });

    it('rejeita data fora do formato YYYY-MM-DD', () => {
      expect(() =>
        controller.listarSlots('urban', 0, '20/05/2026', 30),
      ).toThrow(BadRequestException);
    });

    it('rejeita data ausente', () => {
      expect(() => controller.listarSlots('urban', 0, '', 30)).toThrow(
        BadRequestException,
      );
    });

    it('rejeita duração zero ou negativa', () => {
      expect(() => controller.listarSlots('urban', 0, '2026-05-20', 0)).toThrow(
        BadRequestException,
      );
    });

    it('rejeita duração maior que 8h (480min)', () => {
      expect(() =>
        controller.listarSlots('urban', 0, '2026-05-20', 481),
      ).toThrow(BadRequestException);
    });
  });

  it('POST /:slug/agendamentos delega para service', async () => {
    const dto = {
      barbeiroId: 1,
      inicio: '2026-05-20T09:00:00.000Z',
      servicosIds: [1],
      cliente: { nome: 'João', email: 'joao@x.com' },
    };
    mockService.criarAgendamento.mockResolvedValue({ codigo: 99 });
    const result = await controller.criarAgendamento('urban', dto);
    expect(result).toEqual({ codigo: 99 });
    expect(mockService.criarAgendamento).toHaveBeenCalledWith('urban', dto);
  });
});
