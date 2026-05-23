import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AgendamentoService } from './agendamento.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoProducer } from '../notificacao/notificacao.producer';
import { AgendaGateway } from '../agenda/agenda.gateway';
import { MembroBarbeariaService } from '../barbearia/membro-barbearia.service';
import { createPrismaMock } from '../test/prisma-mock.factory';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { CreateWalkInDto } from './dto/create-walk-in.dto';
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

const mockMembroService = {
  findOrCreateCliente: jest.fn(),
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
        { provide: MembroBarbeariaService, useValue: mockMembroService },
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

    it('snapshot usa precoProprio/duracaoMin do barbeiro quando definidos (regressão Bloco 3)', async () => {
      const dto: CreateAgendamentoDto = {
        barbeiroId: 10,
        clienteId: 20,
        servicosIds: [1],
        inicio: '2024-06-01T09:00:00Z',
      };
      // serviço base 25/30, mas o barbeiro tem precoProprio 99 e duracaoMin 50
      mockPrisma.servico.findMany.mockResolvedValue([
        {
          codigo: 1,
          nome: 'Corte',
          duracaoBase: 30,
          precoBase: 25,
          barbeiros: [{ precoProprio: 99, duracaoMin: 50 }],
        },
      ]);

      let capturados: { preco: number; duracaoMin: number }[] | undefined;
      mockPrisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => unknown) => {
          const tx = {
            $queryRaw: jest.fn().mockResolvedValue([{ count: BigInt(0) }]),
            agendamento: {
              create: jest.fn().mockImplementation(
                (args: {
                  data: {
                    itens: {
                      create: { preco: number; duracaoMin: number }[];
                    };
                  };
                }) => {
                  capturados = args.data.itens.create;
                  return Promise.resolve(mockAgendamento);
                },
              ),
            },
          };
          return fn(tx);
        },
      );

      await service.create(dto, barCodigo);

      expect(capturados?.[0]).toMatchObject({ preco: 99, duracaoMin: 50 });
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

  describe('createWalkIn', () => {
    const servicoMock = {
      codigo: 1,
      nome: 'Corte',
      duracaoBase: 30,
      precoBase: 25,
      barbeiros: [],
    };

    function mockWalkInTx() {
      mockPrisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => unknown) => {
          const tx = {
            agendamento: {
              create: jest.fn().mockResolvedValue({
                ...mockAgendamento,
                status: 'PENDENTE',
                tipo: 'WALK_IN',
              }),
            },
          };
          return fn(tx);
        },
      );
    }

    it('cria cliente + walk-in atomicamente e usa Usuario.codigo como clienteId', async () => {
      const dto: CreateWalkInDto = {
        barbeiroId: 10,
        servicosIds: [1],
        cliente: { nome: 'João', email: 'j@x.com' },
      };
      mockPrisma.servico.findMany.mockResolvedValue([servicoMock]);
      // findOrCreateCliente devolve o MEMBRO (PK próprio) com o usuário aninhado.
      mockMembroService.findOrCreateCliente.mockResolvedValue({
        codigo: 555, // PK do membro — NÃO deve virar clienteId
        usuario: { codigo: 20, nome: 'João', email: 'j@x.com' },
      });

      let capturedClienteId: number | undefined;
      mockPrisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => unknown) => {
          const tx = {
            agendamento: {
              create: jest.fn().mockImplementation((args: unknown) => {
                capturedClienteId = (args as { data: { clienteId: number } })
                  .data.clienteId;
                return Promise.resolve({
                  ...mockAgendamento,
                  status: 'PENDENTE',
                  tipo: 'WALK_IN',
                });
              }),
            },
          };
          return fn(tx);
        },
      );

      const result = await service.createWalkIn(dto, barCodigo);

      expect(mockMembroService.findOrCreateCliente).toHaveBeenCalledWith(
        barCodigo,
        dto.cliente,
        expect.anything(),
      );
      expect(capturedClienteId).toBe(20); // Usuario.codigo, não o membro 555
      expect(result).toHaveProperty('tipo', 'WALK_IN');
      expect(mockAgendaGateway.emitAgendamentoCriado).toHaveBeenCalled();
    });

    it('usa clienteId existente sem criar cliente', async () => {
      const dto: CreateWalkInDto = {
        barbeiroId: 10,
        servicosIds: [1],
        clienteId: 77,
      };
      mockPrisma.servico.findMany.mockResolvedValue([servicoMock]);
      mockWalkInTx();

      await service.createWalkIn(dto, barCodigo);

      expect(mockMembroService.findOrCreateCliente).not.toHaveBeenCalled();
    });

    it('lança BadRequestException se serviço não encontrado', async () => {
      const dto: CreateWalkInDto = {
        barbeiroId: 10,
        servicosIds: [999],
        cliente: { nome: 'João', email: 'j@x.com' },
      };
      mockPrisma.servico.findMany.mockResolvedValue([]);

      await expect(service.createWalkIn(dto, barCodigo)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockMembroService.findOrCreateCliente).not.toHaveBeenCalled();
    });

    it('não derruba o walk-in se a notificação falha (best-effort)', async () => {
      const dto: CreateWalkInDto = {
        barbeiroId: 10,
        servicosIds: [1],
        clienteId: 77,
      };
      mockPrisma.servico.findMany.mockResolvedValue([servicoMock]);
      mockWalkInTx();
      mockNotificacaoProducer.agendamentoConfirmado.mockRejectedValueOnce(
        new Error('redis down'),
      );

      const result = await service.createWalkIn(dto, barCodigo);

      expect(result).toHaveProperty('tipo', 'WALK_IN');
      expect(mockAgendaGateway.emitAgendamentoCriado).toHaveBeenCalled();
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

    it('filtra por clienteId quando fornecido e não aplica janela de data', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([mockAgendamento]);
      const filtros: ListAgendamentoDto = { clienteId: 20 };
      await service.findAll(barCodigo, filtros);
      const [call] = mockPrisma.agendamento.findMany.mock.calls[0] as [
        { where: { clienteId?: number; inicio?: unknown } },
      ];
      expect(call.where.clienteId).toBe(20);
      expect(call.where.inicio).toBeUndefined();
    });

    it('aplica janela default de 90 dias quando não há data nem clienteId', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([]);
      const before = new Date();
      await service.findAll(barCodigo, { status: 'concluido' });
      const [call] = mockPrisma.agendamento.findMany.mock.calls[0] as [
        { where: { inicio?: { gte: Date } } },
      ];
      expect(call.where.inicio).toBeDefined();
      const gte = call.where.inicio!.gte;
      const diffMs = before.getTime() - gte.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(89);
      expect(diffDays).toBeLessThanOrEqual(91);
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

    it('aceita transição para em_andamento (iniciar atendimento)', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...mockAgendamento,
        status: 'em_andamento',
      });

      const result = await service.patchStatus(
        1,
        { status: StatusAgendamento.EM_ANDAMENTO },
        barCodigo,
      );
      expect(result.status).toBe('em_andamento');
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

    it('inclui em_andamento entre os status considerados "atual"', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      await service.agendamentoAtual(10, barCodigo);
      const calls = mockPrisma.agendamento.findFirst.mock
        .calls as unknown as Array<[{ where: { status: { in: string[] } } }]>;
      const arg = calls[calls.length - 1][0];
      expect(arg.where.status.in).toContain('em_andamento');
    });
  });

  describe('avaliarAgendamento', () => {
    const concluido = { ...mockAgendamento, status: 'concluido' };

    it('cria avaliação com sucesso', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(concluido);
      mockPrisma.avaliacaoAgendamento.findUnique.mockResolvedValue(null);
      mockPrisma.avaliacaoAgendamento.create.mockResolvedValue({});

      const result = await service.avaliarAgendamento(1, barCodigo, 20, {
        nota: 5,
        comentario: 'Ótimo!',
      });

      expect(result).toEqual({ sucesso: true });
      expect(mockPrisma.avaliacaoAgendamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ nota: 5 }) as { nota: number },
        }),
      );
    });

    it('lança NotFoundException quando agendamento não pertence ao cliente', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({
        ...concluido,
        cliente: { codigo: 999 }, // outro cliente
      });

      await expect(
        service.avaliarAgendamento(1, barCodigo, 20, { nota: 4 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException quando status não é concluido', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({
        ...mockAgendamento,
        status: 'confirmado',
      });

      await expect(
        service.avaliarAgendamento(1, barCodigo, 20, { nota: 3 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança ConflictException quando avaliação já existe', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(concluido);
      mockPrisma.avaliacaoAgendamento.findUnique.mockResolvedValue({
        codigo: 1,
      });

      await expect(
        service.avaliarAgendamento(1, barCodigo, 20, { nota: 5 }),
      ).rejects.toThrow(ConflictException);
    });

    it('lança NotFoundException quando agendamento não existe', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(null);

      await expect(
        service.avaliarAgendamento(999, barCodigo, 20, { nota: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // Força a importação do ForbiddenException para ser usável se necessário
  it('módulo importa ForbiddenException sem erros', () => {
    expect(ForbiddenException).toBeDefined();
  });
});
