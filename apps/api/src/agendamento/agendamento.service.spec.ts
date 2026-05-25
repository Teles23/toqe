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
import { ContatoService } from '../contato/contato.service';
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

const mockContatoService = {
  findOrCreate: jest.fn(),
  findById: jest.fn(),
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
        { provide: ContatoService, useValue: mockContatoService },
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
            barbearia: {
              findUniqueOrThrow: jest.fn().mockResolvedValue({ plano: 'free' }),
            },
            planoLimite: { findUnique: jest.fn().mockResolvedValue(null) },
            agendamento: {
              count: jest.fn().mockResolvedValue(0),
              create: jest.fn().mockResolvedValue(mockAgendamento),
            },
            $queryRaw: jest.fn().mockResolvedValue([{ count: BigInt(0) }]),
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
            barbearia: {
              findUniqueOrThrow: jest.fn().mockResolvedValue({ plano: 'free' }),
            },
            planoLimite: { findUnique: jest.fn().mockResolvedValue(null) },
            agendamento: {
              count: jest.fn().mockResolvedValue(0),
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
            $queryRaw: jest.fn().mockResolvedValue([{ count: BigInt(0) }]),
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
            barbearia: {
              findUniqueOrThrow: jest.fn().mockResolvedValue({ plano: 'free' }),
            },
            planoLimite: { findUnique: jest.fn().mockResolvedValue(null) },
            agendamento: {
              count: jest.fn().mockResolvedValue(0),
              create: jest.fn(),
            },
            $queryRaw: jest.fn().mockResolvedValue([{ count: BigInt(1) }]),
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

    it('cria TQE_CONTATO + walk-in atomicamente (sem criar TQE_USR)', async () => {
      const dto: CreateWalkInDto = {
        barbeiroId: 10,
        servicosIds: [1],
        contato: { nome: 'João' },
      };
      mockPrisma.servico.findMany.mockResolvedValue([servicoMock]);
      mockContatoService.findOrCreate.mockResolvedValue({
        codigo: 99,
        nome: 'João',
        telefone: null,
      });

      let capturedContatoId: number | undefined;
      mockPrisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => unknown) => {
          const tx = {
            contato: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue({
                codigo: 99,
                nome: 'João',
                telefone: null,
              }),
            },
            agendamento: {
              create: jest.fn().mockImplementation((args: unknown) => {
                capturedContatoId = (args as { data: { contatoId: number } })
                  .data.contatoId;
                return Promise.resolve({
                  ...mockAgendamento,
                  clienteId: null,
                  contatoId: 99,
                  contato: { codigo: 99, nome: 'João', telefone: null },
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

      expect(mockMembroService.findOrCreateCliente).not.toHaveBeenCalled();
      expect(capturedContatoId).toBe(99);
      expect(result).toHaveProperty('tipo', 'WALK_IN');
      expect(mockAgendaGateway.emitAgendamentoCriado).toHaveBeenCalled();
    });

    it('usa clienteId existente sem criar contato (usuário com conta)', async () => {
      const dto: CreateWalkInDto = {
        barbeiroId: 10,
        servicosIds: [1],
        clienteId: 77,
      };
      mockPrisma.servico.findMany.mockResolvedValue([servicoMock]);
      mockWalkInTx();

      await service.createWalkIn(dto, barCodigo);

      expect(mockMembroService.findOrCreateCliente).not.toHaveBeenCalled();
      expect(mockContatoService.findOrCreate).not.toHaveBeenCalled();
    });

    it('lança BadRequestException se serviço não encontrado', async () => {
      const dto: CreateWalkInDto = {
        barbeiroId: 10,
        servicosIds: [999],
        contato: { nome: 'João' },
      };
      mockPrisma.servico.findMany.mockResolvedValue([]);

      await expect(service.createWalkIn(dto, barCodigo)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockContatoService.findOrCreate).not.toHaveBeenCalled();
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

    it('barbeiroCompativel: exclui encaixes com serviço desativado (ativo=false) do barbeiro', async () => {
      mockPrisma.barbeiroServico.findMany.mockResolvedValue([
        { srvCodigo: 5 },
        { srvCodigo: 9 },
      ]);
      mockPrisma.agendamento.findMany.mockResolvedValue([]);

      await service.findAll(barCodigo, {
        data: '2024-06-01',
        tipo: 'WALK_IN',
        barbeiroId: 77,
        barbeiroCompativel: 'true',
      });

      expect(mockPrisma.barbeiroServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { barbeiroId: 77, barCodigo, ativo: false },
        }),
      );
      const [call] = mockPrisma.agendamento.findMany.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      // Filtra por compatibilidade, NÃO por barbeiro designado.
      expect(call.where.barbeiroId).toBeUndefined();
      expect(call.where.itens).toEqual({
        none: { srvCodigo: { in: [5, 9] } },
      });
    });

    it('barbeiroCompativel sem serviços desativados: não restringe por itens', async () => {
      mockPrisma.barbeiroServico.findMany.mockResolvedValue([]);
      mockPrisma.agendamento.findMany.mockResolvedValue([]);

      await service.findAll(barCodigo, {
        tipo: 'WALK_IN',
        barbeiroId: 77,
        barbeiroCompativel: 'true',
      });

      const [call] = mockPrisma.agendamento.findMany.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(call.where.itens).toBeUndefined();
      expect(call.where.barbeiroId).toBeUndefined();
    });

    it('barbeiroId SEM barbeiroCompativel mantém filtro por barbeiro designado', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([]);

      await service.findAll(barCodigo, { barbeiroId: 77 });

      expect(mockPrisma.barbeiroServico.findMany).not.toHaveBeenCalled();
      const [call] = mockPrisma.agendamento.findMany.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(call.where.barbeiroId).toBe(77);
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

    // ── Guard de compatibilidade ao iniciar encaixe (WALK_IN → em_andamento) ──

    const walkIn = {
      ...mockAgendamento,
      tipo: 'WALK_IN',
      status: 'pendente',
      itens: [{ srvCodigo: 5 }],
    };

    it('WALK_IN em_andamento: barbeiro SEM registro em BarbeiroServico pode atender', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(walkIn);
      mockPrisma.barbeiroServico.findFirst.mockResolvedValue(null);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...walkIn,
        status: 'em_andamento',
      });

      const result = await service.patchStatus(
        1,
        { status: StatusAgendamento.EM_ANDAMENTO },
        barCodigo,
        77,
      );
      expect(result.status).toBe('em_andamento');
      // Buscou pelos serviços desativados do executor (77), nenhum encontrado.
      expect(mockPrisma.barbeiroServico.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            barbeiroId: 77,
            barCodigo,
            srvCodigo: { in: [5] },
            ativo: false,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('WALK_IN em_andamento: barbeiro com serviço ATIVO (sem registro inativo) pode atender', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(walkIn);
      // ativo=true → a query por ativo:false não retorna nada
      mockPrisma.barbeiroServico.findFirst.mockResolvedValue(null);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...walkIn,
        status: 'em_andamento',
      });

      const result = await service.patchStatus(
        1,
        { status: StatusAgendamento.EM_ANDAMENTO },
        barCodigo,
        77,
      );
      expect(result.status).toBe('em_andamento');
    });

    it('WALK_IN em_andamento: barbeiro com serviço DESATIVADO (ativo=false) → ForbiddenException', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(walkIn);
      mockPrisma.barbeiroServico.findFirst.mockResolvedValue({
        codigo: 1,
        barbeiroId: 77,
        srvCodigo: 5,
        barCodigo,
        ativo: false,
      });

      await expect(
        service.patchStatus(
          1,
          { status: StatusAgendamento.EM_ANDAMENTO },
          barCodigo,
          77,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.agendamento.update).not.toHaveBeenCalled();
    });

    it('em_andamento em agendamento NORMAL (não WALK_IN) NÃO verifica BarbeiroServico', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({
        ...mockAgendamento,
        tipo: 'AGENDADO',
        itens: [{ srvCodigo: 5 }],
      });
      mockPrisma.agendamento.update.mockResolvedValue({
        ...mockAgendamento,
        status: 'em_andamento',
      });

      const result = await service.patchStatus(
        1,
        { status: StatusAgendamento.EM_ANDAMENTO },
        barCodigo,
        77,
      );
      expect(result.status).toBe('em_andamento');
      expect(mockPrisma.barbeiroServico.findFirst).not.toHaveBeenCalled();
    });

    it('confirmado em WALK_IN NÃO verifica BarbeiroServico', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(walkIn);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...walkIn,
        status: 'confirmado',
      });

      const result = await service.patchStatus(
        1,
        { status: StatusAgendamento.CONFIRMADO },
        barCodigo,
        77,
      );
      expect(result.status).toBe('confirmado');
      expect(mockPrisma.barbeiroServico.findFirst).not.toHaveBeenCalled();
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

  describe('meusAtendimentos', () => {
    it('retorna agendamentos concluídos do barbeiro', async () => {
      const concluido = { ...mockAgendamento, status: 'CONCLUIDO' };
      mockPrisma.agendamento.findMany.mockResolvedValue([concluido]);

      const result = await service.meusAtendimentos(10, barCodigo);

      expect(result).toEqual([concluido]);
      const [callArg] = mockPrisma.agendamento.findMany.mock.calls[0] as [
        { where: { barbeiroId: number; barCodigo: number; status: string } },
      ];
      expect(callArg.where.barbeiroId).toBe(10);
      expect(callArg.where.barCodigo).toBe(barCodigo);
    });

    it('respeita o parâmetro limit', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([]);

      await service.meusAtendimentos(10, barCodigo, 5);

      const [callArg] = mockPrisma.agendamento.findMany.mock.calls[0] as [
        { take: number },
      ];
      expect(callArg.take).toBe(5);
    });

    it('usa limit padrão 20 quando não fornecido', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([]);

      await service.meusAtendimentos(10, barCodigo);

      const [callArg] = mockPrisma.agendamento.findMany.mock.calls[0] as [
        { take: number },
      ];
      expect(callArg.take).toBe(20);
    });
  });

  describe('reagendar', () => {
    const futuro = new Date(Date.now() + 86_400_000).toISOString();
    const futuroPlusMeia = new Date(
      Date.now() + 86_400_000 + 30 * 60_000,
    ).toISOString();

    it('reagenda com sucesso para o cliente owner', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...mockAgendamento,
        inicio: new Date(futuro),
        fim: new Date(futuroPlusMeia),
      });

      const result = await service.reagendar(
        1,
        { inicio: futuro },
        20, // clienteId
        barCodigo,
      );

      expect(mockPrisma.agendamento.update).toHaveBeenCalled();
      expect(mockAgendaGateway.emitAgendamentoCriado).toHaveBeenCalled();
      expect(result.inicio).toEqual(new Date(futuro));
    });

    it('lança ForbiddenException se requester não é cliente nem barbeiro', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);

      await expect(
        service.reagendar(1, { inicio: futuro }, 999, barCodigo),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lança BadRequestException se status é CONCLUIDO', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({
        ...mockAgendamento,
        status: 'CONCLUIDO',
      });

      await expect(
        service.reagendar(1, { inicio: futuro }, 20, barCodigo),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException se novo início é no passado', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      const passado = new Date(Date.now() - 60_000).toISOString();

      await expect(
        service.reagendar(1, { inicio: passado }, 20, barCodigo),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança ConflictException se há conflito de horário', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(mockAgendamento);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(1) }]);

      await expect(
        service.reagendar(1, { inicio: futuro }, 20, barCodigo),
      ).rejects.toThrow(ConflictException);
    });

    it('calcula fim automaticamente quando não fornecido', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({
        ...mockAgendamento,
        inicio: new Date('2024-06-01T09:00:00Z'),
        fim: new Date('2024-06-01T09:30:00Z'), // 30 min duração
      });
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...mockAgendamento,
        inicio: new Date(futuro),
        fim: new Date(new Date(futuro).getTime() + 30 * 60_000),
      });

      await service.reagendar(1, { inicio: futuro }, 20, barCodigo);

      const [callArg] = mockPrisma.agendamento.update.mock.calls[0] as [
        { data: { inicio: Date; fim: Date } },
      ];
      const duracao =
        callArg.data.fim.getTime() - callArg.data.inicio.getTime();
      expect(duracao).toBe(30 * 60_000);
    });

    it('lança NotFoundException se agendamento não encontrado', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(null);

      await expect(
        service.reagendar(999, { inicio: futuro }, 20, barCodigo),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('transferir', () => {
    const barCodigo = 1;
    const codigo = 10;
    const novoBarbeiroId = 5;

    const agendamentoBase = {
      codigo,
      barCodigo,
      barbeiroId: 2,
      clienteId: 3,
      inicio: new Date('2026-05-25T10:00:00Z'),
      fim: new Date('2026-05-25T11:00:00Z'),
      status: 'pendente',
      itens: [],
      cliente: { codigo: 3, nome: 'Cliente Teste', email: 'cliente@teste.com' },
      barbeiro: { codigo: 2, nome: 'Barbeiro Antigo' },
      barbearia: { codigo: 1, nome: 'Barbearia Teste' },
    };

    const membroBarbeiro = {
      codigo: 7,
      barCodigo,
      usrCodigo: novoBarbeiroId,
      perfil: 'barbeiro',
    };

    it('sucesso: transfere o agendamento para o novo barbeiro sem conflito', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(agendamentoBase);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(membroBarbeiro);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...agendamentoBase,
        barbeiroId: novoBarbeiroId,
      });

      const resultado = await service.transferir(
        codigo,
        { novoBarbeiroId },
        barCodigo,
      );

      expect(resultado.barbeiroId).toBe(novoBarbeiroId);
      expect(mockPrisma.agendamento.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { codigo },
          data: { barbeiroId: novoBarbeiroId },
        }),
      );
    });

    it('sucesso: transfere agendamento com status confirmado', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({
        ...agendamentoBase,
        status: 'confirmado',
      });
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(membroBarbeiro);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...agendamentoBase,
        status: 'confirmado',
        barbeiroId: novoBarbeiroId,
      });

      const resultado = await service.transferir(
        codigo,
        { novoBarbeiroId },
        barCodigo,
      );
      expect(resultado.barbeiroId).toBe(novoBarbeiroId);
    });

    it('erro: lança BadRequestException quando status é concluido', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({
        ...agendamentoBase,
        status: 'concluido',
      });

      await expect(
        service.transferir(codigo, { novoBarbeiroId }, barCodigo),
      ).rejects.toThrow(BadRequestException);
    });

    it('erro: lança BadRequestException quando status é cancelado', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({
        ...agendamentoBase,
        status: 'cancelado',
      });

      await expect(
        service.transferir(codigo, { novoBarbeiroId }, barCodigo),
      ).rejects.toThrow(BadRequestException);
    });

    it('erro: lança NotFoundException quando barbeiro não pertence à barbearia', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(agendamentoBase);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);

      await expect(
        service.transferir(codigo, { novoBarbeiroId }, barCodigo),
      ).rejects.toThrow(NotFoundException);
    });

    it('erro: lança BadRequestException quando há conflito de horário', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(agendamentoBase);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(membroBarbeiro);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(1) }]);

      await expect(
        service.transferir(codigo, { novoBarbeiroId }, barCodigo),
      ).rejects.toThrow(BadRequestException);
    });

    it('isolamento: lança NotFoundException quando agendamento pertence a outra barbearia', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(null);

      await expect(
        service.transferir(codigo, { novoBarbeiroId }, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('não chama update quando validação falha por status inválido', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue({
        ...agendamentoBase,
        status: 'concluido',
      });

      await expect(
        service.transferir(codigo, { novoBarbeiroId }, barCodigo),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.agendamento.update).not.toHaveBeenCalled();
    });

    it('não chama update quando validação falha por barbeiro inválido', async () => {
      mockPrisma.agendamento.findFirst.mockResolvedValue(agendamentoBase);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);

      await expect(
        service.transferir(codigo, { novoBarbeiroId }, barCodigo),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.agendamento.update).not.toHaveBeenCalled();
    });
  });
});
