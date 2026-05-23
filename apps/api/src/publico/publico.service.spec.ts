import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PublicoService } from './publico.service';
import { PrismaService } from '../prisma/prisma.service';
import { MembroBarbeariaService } from '../barbearia/membro-barbearia.service';
import { ServicoService } from '../servico/servico.service';
import { AgendaService } from '../agenda/agenda.service';
import { AgendamentoService } from '../agendamento/agendamento.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

const mockPrisma = createPrismaMock();

const mockMembro = {
  findOrCreateCliente: jest.fn(),
};
const mockServico = {
  findAll: jest.fn(),
};
const mockAgenda = {
  getAvailableSlots: jest.fn(),
};
const mockAgendamento = {
  create: jest.fn(),
};

describe('PublicoService', () => {
  let service: PublicoService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PublicoService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MembroBarbeariaService, useValue: mockMembro },
        { provide: ServicoService, useValue: mockServico },
        { provide: AgendaService, useValue: mockAgenda },
        { provide: AgendamentoService, useValue: mockAgendamento },
      ],
    }).compile();
    service = module.get(PublicoService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getBarbeariaPorSlug', () => {
    it('retorna barbearia ativa', async () => {
      const barbearia = {
        codigo: 1,
        nome: 'Urban',
        slug: 'urban',
        ativo: true,
        timezone: 'America/Sao_Paulo',
        tema: null,
      };
      mockPrisma.barbearia.findUnique.mockResolvedValue(barbearia);

      const result = await service.getBarbeariaPorSlug('urban');
      expect(result).toEqual(barbearia);
    });

    it('lança 404 quando barbearia não existe', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);
      await expect(service.getBarbeariaPorSlug('xxx')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança 404 quando barbearia está inativa', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        codigo: 1,
        ativo: false,
      });
      await expect(service.getBarbeariaPorSlug('urban')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listarServicos', () => {
    it('expõe apenas campos públicos dos serviços', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        codigo: 1,
        ativo: true,
      });
      mockServico.findAll.mockResolvedValue([
        {
          codigo: 1,
          nome: 'Corte',
          precoBase: 60,
          duracaoBase: 30,
          ativo: true,
          barCodigo: 1,
        },
      ]);

      const result = await service.listarServicos('urban');
      expect(result).toEqual([
        { codigo: 1, nome: 'Corte', precoBase: 60, duracaoBase: 30 },
      ]);
      expect(mockServico.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('listarBarbeiros', () => {
    it('expõe apenas nome/avatar (sem email/telefone)', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        codigo: 1,
        ativo: true,
      });
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        {
          usrCodigo: 10,
          usuario: {
            codigo: 10,
            nome: 'Carlos',
            email: 'carlos@x.com',
            telefone: '999',
            avatarUrl: null,
          },
        },
      ]);

      const result = await service.listarBarbeiros('urban');
      expect(result).toEqual([{ codigo: 10, nome: 'Carlos', avatarUrl: null }]);
    });

    it('exclui barbeiros que desativaram o serviço (srvCodigo)', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        codigo: 1,
        ativo: true,
      });
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        {
          usrCodigo: 10,
          usuario: { codigo: 10, nome: 'Carlos', avatarUrl: null },
        },
        {
          usrCodigo: 11,
          usuario: { codigo: 11, nome: 'Bruno', avatarUrl: null },
        },
      ]);
      // Bruno (11) desativou o serviço 5
      mockPrisma.barbeiroServico.findMany.mockResolvedValue([
        { barbeiroId: 11 },
      ]);

      const result = await service.listarBarbeiros('urban', 5);

      expect(result).toEqual([{ codigo: 10, nome: 'Carlos', avatarUrl: null }]);
      expect(mockPrisma.barbeiroServico.findMany).toHaveBeenCalledWith({
        where: { barCodigo: 1, srvCodigo: 5, ativo: false },
        select: { barbeiroId: true },
      });
    });
  });

  describe('listarSlots', () => {
    beforeEach(() => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        codigo: 1,
        ativo: true,
      });
    });

    it('retorna slots de um barbeiro específico', async () => {
      mockAgenda.getAvailableSlots.mockResolvedValue(['09:00', '09:30']);

      const result = await service.listarSlots({
        slug: 'urban',
        barbeiroId: 10,
        data: '2026-05-20',
        duracao: 30,
      });

      expect(result).toEqual([
        { horario: '09:00', barbeiroId: 10 },
        { horario: '09:30', barbeiroId: 10 },
      ]);
      expect(mockAgenda.getAvailableSlots).toHaveBeenCalledWith(
        10,
        1,
        '2026-05-20',
        30,
      );
    });

    it('agrega slots de todos os barbeiros quando barbeiroId=0', async () => {
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        { usrCodigo: 10 },
        { usrCodigo: 11 },
      ]);
      mockAgenda.getAvailableSlots
        .mockResolvedValueOnce(['09:00', '09:30']) // barbeiro 10
        .mockResolvedValueOnce(['09:30', '10:00']); // barbeiro 11

      const result = await service.listarSlots({
        slug: 'urban',
        barbeiroId: 0,
        data: '2026-05-20',
        duracao: 30,
      });

      // 09:00 vem do 10, 09:30 mantido do 10 (primeiro a oferecer), 10:00 do 11
      expect(result).toEqual([
        { horario: '09:00', barbeiroId: 10 },
        { horario: '09:30', barbeiroId: 10 },
        { horario: '10:00', barbeiroId: 11 },
      ]);
    });
  });

  describe('criarAgendamento', () => {
    const dto = {
      barbeiroId: 10,
      inicio: '2026-05-20T09:00:00.000Z',
      servicosIds: [1, 2],
      cliente: { nome: 'João', email: 'joao@x.com' },
      observacao: '',
    };

    beforeEach(() => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        codigo: 1,
        ativo: true,
      });
      mockMembro.findOrCreateCliente.mockResolvedValue({
        usrCodigo: 99,
        usuario: { codigo: 99, nome: 'João', email: 'joao@x.com' },
      });
    });

    it('cria cliente e delega para AgendamentoService.create', async () => {
      mockAgendamento.create.mockResolvedValue({ codigo: 500 });

      await service.criarAgendamento('urban', dto);

      expect(mockMembro.findOrCreateCliente).toHaveBeenCalledWith(
        1,
        dto.cliente,
      );
      expect(mockAgendamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          barbeiroId: 10,
          clienteId: 99,
          inicio: dto.inicio,
          servicosIds: [1, 2],
          tipo: 'AGENDADO',
        }),
        1,
      );
    });

    it('resolve barbeiro automaticamente quando barbeiroId=0', async () => {
      mockPrisma.servico.findMany.mockResolvedValue([
        { duracaoBase: 30 },
        { duracaoBase: 20 },
      ]);
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        { usrCodigo: 11 },
        { usrCodigo: 12 },
      ]);
      mockAgenda.getAvailableSlots
        .mockResolvedValueOnce(['10:00']) // 11 não tem 09:00
        .mockResolvedValueOnce(['09:00', '09:30']); // 12 tem 09:00
      mockAgendamento.create.mockResolvedValue({ codigo: 501 });

      await service.criarAgendamento('urban', { ...dto, barbeiroId: 0 });

      expect(mockAgendamento.create).toHaveBeenCalledWith(
        expect.objectContaining({ barbeiroId: 12 }),
        1,
      );
    });

    it('lança 400 quando nenhum barbeiro tem o horário pedido', async () => {
      mockPrisma.servico.findMany.mockResolvedValue([{ duracaoBase: 30 }]);
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        { usrCodigo: 11 },
      ]);
      mockAgenda.getAvailableSlots.mockResolvedValue(['10:00', '10:30']); // sem 09:00

      await expect(
        service.criarAgendamento('urban', { ...dto, barbeiroId: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('propaga 404 quando slug inválido', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);

      await expect(
        service.criarAgendamento('inexistente', dto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
