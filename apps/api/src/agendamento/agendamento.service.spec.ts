import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AgendamentoService } from './agendamento.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoProducer } from '../notificacao/notificacao.producer';
import { AgendaGateway } from '../agenda/agenda.gateway';
import { createPrismaMock } from '../test/prisma-mock.factory';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { ListAgendamentoDto } from './dto/list-agendamento.dto';
import {
  PatchStatusAgendamentoDto,
  StatusAgendamento,
} from './dto/patch-status-agendamento.dto';

const mockPrisma = createPrismaMock();

const mockNotificacaoProducer = {
  agendamentoConfirmado: jest.fn().mockResolvedValue(undefined),
};
const mockAgendaGateway = {
  emitAgendamentoCriado: jest.fn(),
  emitStatusAtualizado: jest.fn(),
};

describe('AgendamentoService', () => {
  let service: AgendamentoService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AgendamentoService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacaoProducer, useValue: mockNotificacaoProducer },
        { provide: AgendaGateway, useValue: mockAgendaGateway },
      ],
    }).compile();
    service = module.get(AgendamentoService);
  });

  afterEach(() => jest.clearAllMocks());

  const barCodigo = 1;

  const mockAgendamento = {
    codigo: 1,
    barbeiroId: 10,
    clienteId: 20,
    barCodigo,
    inicio: new Date('2024-06-01T09:00:00Z'),
    fim: new Date('2024-06-01T09:30:00Z'),
    status: 'confirmado',
    itens: [],
    cliente: { codigo: 20, nome: 'Cliente', email: 'c@c.com' },
    barbeiro: { codigo: 10, nome: 'Barbeiro' },
    barbearia: { codigo: 1, nome: 'BarberShop' },
  };

  describe('create', () => {
    it('cria agendamento com sucesso', async () => {
      const dto: CreateAgendamentoDto = {
        barbeiroId: 10,
        clienteId: 20,
        servicosIds: [1],
        inicio: '2024-06-01T09:00:00Z',
      };
      mockPrisma.servico.findMany.mockResolvedValue([
        {
          codigo: 1,
          nome: 'Corte',
          duracaoBase: 30,
          precoBase: 25,
          barbeiros: [],
        },
      ]);
      mockPrisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => unknown) => {
          const tx = {
            $queryRaw: jest.fn().mockResolvedValue([{ count: BigInt(0) }]),
            agendamento: {
              create: jest.fn().mockResolvedValue(mockAgendamento),
            },
          };
          return fn(tx);
        },
      );

      const result = await service.create(dto, barCodigo);
      expect(result).toHaveProperty('codigo', 1);
      expect(mockNotificacaoProducer.agendamentoConfirmado).toHaveBeenCalled();
      expect(mockAgendaGateway.emitAgendamentoCriado).toHaveBeenCalled();
    });

    it('lança BadRequestException se serviço não encontrado', async () => {
      const dto: CreateAgendamentoDto = {
        barbeiroId: 10,
        clienteId: 20,
        servicosIds: [999],
        inicio: '2024-06-01T09:00:00Z',
      };
      mockPrisma.servico.findMany.mockResolvedValue([]);

      await expect(service.create(dto, barCodigo)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança ConflictException se há conflito de horário', async () => {
      const dto: CreateAgendamentoDto = {
        barbeiroId: 10,
        clienteId: 20,
        servicosIds: [1],
        inicio: '2024-06-01T09:00:00Z',
      };
      mockPrisma.servico.findMany.mockResolvedValue([
        {
          codigo: 1,
          nome: 'Corte',
          duracaoBase: 30,
          precoBase: 25,
          barbeiros: [],
        },
      ]);
      mockPrisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => unknown) => {
          const tx = {
            $queryRaw: jest.fn().mockResolvedValue([{ count: BigInt(1) }]),
            agendamento: { create: jest.fn() },
          };
          return fn(tx);
        },
      );

      await expect(service.create(dto, barCodigo)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('retorna agendamentos com filtros aplicados', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([mockAgendamento]);
      const filtros: ListAgendamentoDto = {
        data: '2024-06-01',
        barbeiroId: 10,
      };
      const result = await service.findAll(barCodigo, filtros);
      expect(mockPrisma.agendamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ barCodigo, barbeiroId: 10 }) as {
            barCodigo: number;
            barbeiroId: number;
          },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('retorna agendamento encontrado', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      const result = await service.findOne(1, barCodigo);
      expect(result).toHaveProperty('codigo', 1);
    });

    it('lança NotFoundException se não encontrado', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(null);
      await expect(service.findOne(999, barCodigo)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('patchStatus', () => {
    it('atualiza status e emite evento', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...mockAgendamento,
        status: 'concluido',
      });

      const patchDto: PatchStatusAgendamentoDto = {
        status: StatusAgendamento.CONCLUIDO,
      };
      const result = await service.patchStatus(1, patchDto, barCodigo);
      expect(result.status).toBe('concluido');
      expect(mockAgendaGateway.emitStatusAtualizado).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancela agendamento com sucesso', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...mockAgendamento,
        status: 'cancelado',
      });

      const result = await service.cancel(1, barCodigo);
      expect(result.status).toBe('cancelado');
    });

    it('lança BadRequestException se já cancelado', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({
        ...mockAgendamento,
        status: 'cancelado',
      });
      await expect(service.cancel(1, barCodigo)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('meusAgendamentos', () => {
    it('retorna agendamentos do cliente excluindo cancelados', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([mockAgendamento]);
      const result = await service.meusAgendamentos(20, barCodigo);
      expect(result).toEqual([mockAgendamento]);
      const [callArg] = mockPrisma.agendamento.findMany.mock.calls[0] as [
        { where: { clienteId: number; barCodigo: number } },
      ];
      expect(callArg.where.clienteId).toBe(20);
      expect(callArg.where.barCodigo).toBe(barCodigo);
    });
  });

  describe('proximoAgendamento', () => {
    it('retorna o próximo agendamento futuro', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      const result = await service.proximoAgendamento(20, barCodigo);
      expect(result).toEqual(mockAgendamento);
    });

    it('retorna null quando não há próximo agendamento', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(null);
      const result = await service.proximoAgendamento(20, barCodigo);
      expect(result).toBeNull();
    });
  });

  describe('agendamentoAtual', () => {
    it('retorna agendamento em andamento', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      const result = await service.agendamentoAtual(10, barCodigo);
      expect(result).toEqual(mockAgendamento);
    });

    it('retorna null quando não há agendamento atual', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(null);
      const result = await service.agendamentoAtual(10, barCodigo);
      expect(result).toBeNull();
    });
  });
});
