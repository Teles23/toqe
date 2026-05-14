import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AgendamentoService } from './agendamento.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoProducer } from '../notificacao/notificacao.producer';
import { AgendaGateway } from '../agenda/agenda.gateway';
import { createPrismaMock } from '../test/prisma-mock.factory';

const mockPrisma = createPrismaMock();

const mockNotificacaoProducer = { agendamentoConfirmado: jest.fn().mockResolvedValue(undefined) };
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
      const dto = { barbeiroId: 10, clienteId: 20, servicosIds: [1], inicio: '2024-06-01T09:00:00Z' };
      mockPrisma.servico.findMany.mockResolvedValue([
        { codigo: 1, nome: 'Corte', duracaoBase: 30, precoBase: 25, barbeiros: [] },
      ]);
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([{ count: BigInt(0) }]),
          agendamento: { create: jest.fn().mockResolvedValue(mockAgendamento) },
        };
        return fn(tx);
      });

      const result = await service.create(dto as any, barCodigo);
      expect(result).toHaveProperty('codigo', 1);
      expect(mockNotificacaoProducer.agendamentoConfirmado).toHaveBeenCalled();
      expect(mockAgendaGateway.emitAgendamentoCriado).toHaveBeenCalled();
    });

    it('lança BadRequestException se serviço não encontrado', async () => {
      const dto = { barbeiroId: 10, clienteId: 20, servicosIds: [999], inicio: '2024-06-01T09:00:00Z' };
      mockPrisma.servico.findMany.mockResolvedValue([]);

      await expect(service.create(dto as any, barCodigo)).rejects.toThrow(BadRequestException);
    });

    it('lança ConflictException se há conflito de horário', async () => {
      const dto = { barbeiroId: 10, clienteId: 20, servicosIds: [1], inicio: '2024-06-01T09:00:00Z' };
      mockPrisma.servico.findMany.mockResolvedValue([
        { codigo: 1, nome: 'Corte', duracaoBase: 30, precoBase: 25, barbeiros: [] },
      ]);
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([{ count: BigInt(1) }]),
          agendamento: { create: jest.fn() },
        };
        return fn(tx);
      });

      await expect(service.create(dto as any, barCodigo)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('retorna agendamentos com filtros aplicados', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([mockAgendamento]);
      const result = await service.findAll(barCodigo, { data: '2024-06-01', barbeiroId: 10 } as any);
      expect(mockPrisma.agendamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ barCodigo, barbeiroId: 10 }) }),
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
      await expect(service.findOne(999, barCodigo)).rejects.toThrow(NotFoundException);
    });
  });

  describe('patchStatus', () => {
    it('atualiza status e emite evento', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      mockPrisma.agendamento.update.mockResolvedValue({ ...mockAgendamento, status: 'concluido' });

      const result = await service.patchStatus(1, { status: 'concluido' } as any, barCodigo);
      expect(result.status).toBe('concluido');
      expect(mockAgendaGateway.emitStatusAtualizado).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancela agendamento com sucesso', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      mockPrisma.agendamento.update.mockResolvedValue({ ...mockAgendamento, status: 'cancelado' });

      const result = await service.cancel(1, barCodigo);
      expect(result.status).toBe('cancelado');
    });

    it('lança BadRequestException se já cancelado', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({ ...mockAgendamento, status: 'cancelado' });
      await expect(service.cancel(1, barCodigo)).rejects.toThrow(BadRequestException);
    });
  });
});
