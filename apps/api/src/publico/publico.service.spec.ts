import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  Barbearia,
  MembroBarbearia,
  BarbeiroServico,
  AvaliacaoAgendamento,
  Servico,
} from '../generated/prisma';
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
  isBarbeiroDaBarbearia: jest.fn(),
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
      mockPrisma.barbearia.findUnique.mockResolvedValue(
        barbearia as unknown as Barbearia,
      );

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
      } as unknown as Barbearia);
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
      } as unknown as Barbearia);
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
      } as unknown as Barbearia);
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
      ] as unknown as MembroBarbearia[]);

      const result = await service.listarBarbeiros('urban');
      expect(result).toEqual([{ codigo: 10, nome: 'Carlos', avatarUrl: null }]);
    });

    it('exclui barbeiros que desativaram o serviço (srvCodigo)', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        codigo: 1,
        ativo: true,
      } as unknown as Barbearia);
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        {
          usrCodigo: 10,
          usuario: { codigo: 10, nome: 'Carlos', avatarUrl: null },
        },
        {
          usrCodigo: 11,
          usuario: { codigo: 11, nome: 'Bruno', avatarUrl: null },
        },
      ] as unknown as MembroBarbearia[]);
      // Bruno (11) desativou o serviço 5
      mockPrisma.barbeiroServico.findMany.mockResolvedValue([
        { barbeiroId: 11 },
      ] as unknown as BarbeiroServico[]);

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
      } as unknown as Barbearia);
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
      ] as unknown as MembroBarbearia[]);
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

  describe('listarAvaliacoes', () => {
    beforeEach(() => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        codigo: 1,
        ativo: true,
      } as unknown as Barbearia);
    });

    it('retorna media, total e items sem dados pessoais', async () => {
      mockPrisma.avaliacaoAgendamento.findMany.mockResolvedValue([
        {
          nota: 5,
          comentario: 'Excelente!',
          criadoEm: new Date('2026-05-01T10:00:00.000Z'),
        },
        {
          nota: 4,
          comentario: null,
          criadoEm: new Date('2026-04-20T09:00:00.000Z'),
        },
      ] as unknown as AvaliacaoAgendamento[]);

      const result = await service.listarAvaliacoes('urban');

      expect(result.total).toBe(2);
      expect(result.media).toBe(4.5);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({
        nota: 5,
        comentario: 'Excelente!',
        criadoEm: '2026-05-01T10:00:00.000Z',
      });
      expect(result.items[1]).toEqual({
        nota: 4,
        comentario: null,
        criadoEm: '2026-04-20T09:00:00.000Z',
      });
    });

    it('retorna media=0 e total=0 quando não há avaliações', async () => {
      mockPrisma.avaliacaoAgendamento.findMany.mockResolvedValue([]);

      const result = await service.listarAvaliacoes('urban');

      expect(result).toEqual({ media: 0, total: 0, items: [] });
    });

    it('filtra apenas agendamentos CONCLUIDOS da barbearia correta', async () => {
      mockPrisma.avaliacaoAgendamento.findMany.mockResolvedValue([]);

      await service.listarAvaliacoes('urban');

      expect(mockPrisma.avaliacaoAgendamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            agendamento: { barCodigo: 1, status: 'concluido' },
          },
          take: 20,
        }),
      );
    });

    it('lança 404 quando barbearia não existe', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);

      await expect(service.listarAvaliacoes('nao-existe')).rejects.toThrow(
        NotFoundException,
      );
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
      } as unknown as Barbearia);
      mockMembro.findOrCreateCliente.mockResolvedValue({
        usrCodigo: 99,
        usuario: { codigo: 99, nome: 'João', email: 'joao@x.com' },
      });
      mockMembro.isBarbeiroDaBarbearia.mockResolvedValue(true);
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
      ] as unknown as Servico[]);
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        { usrCodigo: 11 },
        { usrCodigo: 12 },
      ] as unknown as MembroBarbearia[]);
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
      mockPrisma.servico.findMany.mockResolvedValue([
        { duracaoBase: 30 },
      ] as unknown as Servico[]);
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        { usrCodigo: 11 },
      ] as unknown as MembroBarbearia[]);
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

    it('lança 400 quando barbeiroId não pertence à barbearia', async () => {
      mockMembro.isBarbeiroDaBarbearia.mockResolvedValue(false);

      await expect(service.criarAgendamento('urban', dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockAgendamento.create).not.toHaveBeenCalled();
    });
  });
});
