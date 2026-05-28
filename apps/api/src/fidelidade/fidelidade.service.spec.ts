import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FidelidadeService } from './fidelidade.service';
import { PrismaService } from '../prisma/prisma.service';

const makePrisma = () => ({
  usuario: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  membroBarbearia: {
    findFirst: jest.fn(),
  },
  pontoFidelidade: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  agendamento: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
});

describe('FidelidadeService', () => {
  let service: FidelidadeService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FidelidadeService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FidelidadeService>(FidelidadeService);
  });

  // ─── getSaldo ──────────────────────────────────────────────────────────────

  describe('getSaldo', () => {
    it('retorna saldo e histórico do cliente', async () => {
      const cliente = { codigo: 1, pontosAcumulados: 50 };
      const historico = [
        {
          codigo: 1,
          clienteCodigo: 1,
          barCodigo: 10,
          pontos: 50,
          tipo: 'ganho',
        },
      ];
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        barCodigo: 10,
        usrCodigo: 1,
      });
      prisma.usuario.findFirst.mockResolvedValue(cliente);
      prisma.pontoFidelidade.findMany.mockResolvedValue(historico);

      const resultado = await service.getSaldo(1, 10);

      expect(resultado.pontos).toBe(50);
      expect(resultado.historico).toEqual(historico);
      expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
        where: { codigo: 1 },
        select: { codigo: true, pontosAcumulados: true },
      });
      expect(prisma.pontoFidelidade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clienteCodigo: 1, barCodigo: 10 },
          take: 20,
        }),
      );
    });

    it('lança NotFoundException quando cliente não existe', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        barCodigo: 10,
        usrCodigo: 999,
      });
      prisma.usuario.findFirst.mockResolvedValue(null);

      await expect(service.getSaldo(999, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── registrarGanho ────────────────────────────────────────────────────────

  describe('registrarGanho', () => {
    it('cria registro e incrementa saldo do cliente', async () => {
      prisma.pontoFidelidade.findFirst.mockResolvedValue(null);
      prisma.agendamento.findFirst.mockResolvedValue({
        codigo: 5,
        clienteId: 1,
        barCodigo: 10,
        itens: [{ preco: '50.00' }, { preco: '30.00' }],
      });
      prisma.$transaction.mockImplementation((ops: unknown[]) =>
        Promise.all(ops),
      );
      prisma.pontoFidelidade.create.mockResolvedValue({});
      prisma.usuario.update.mockResolvedValue({});

      await service.registrarGanho(5, 10);

      expect(prisma.$transaction).toHaveBeenCalled();
      const [firstCall] = prisma.$transaction.mock.calls as [unknown[]][];
      const transactionArgs = firstCall[0];
      expect(transactionArgs).toHaveLength(2);
    });

    it('calcula 1 ponto por R$10 (mínimo 1 ponto)', async () => {
      prisma.pontoFidelidade.findFirst.mockResolvedValue(null);
      prisma.agendamento.findFirst.mockResolvedValue({
        codigo: 5,
        clienteId: 1,
        barCodigo: 10,
        itens: [{ preco: '80.00' }],
      });

      let pontosRegistrados = 0;
      prisma.pontoFidelidade.create.mockImplementation(
        (args: { data: { pontos: number } }) => {
          pontosRegistrados = args.data.pontos;
          return Promise.resolve({});
        },
      );
      prisma.usuario.update.mockResolvedValue({});
      prisma.$transaction.mockImplementation((ops: unknown[]) =>
        Promise.all(ops),
      );

      await service.registrarGanho(5, 10);

      expect(pontosRegistrados).toBe(8); // floor(80/10) = 8
    });

    it('garante mínimo de 1 ponto quando valor é menor que R$10', async () => {
      prisma.pontoFidelidade.findFirst.mockResolvedValue(null);
      prisma.agendamento.findFirst.mockResolvedValue({
        codigo: 5,
        clienteId: 1,
        barCodigo: 10,
        itens: [{ preco: '5.00' }],
      });

      let pontosRegistrados = 0;
      prisma.pontoFidelidade.create.mockImplementation(
        (args: { data: { pontos: number } }) => {
          pontosRegistrados = args.data.pontos;
          return Promise.resolve({});
        },
      );
      prisma.usuario.update.mockResolvedValue({});
      prisma.$transaction.mockImplementation((ops: unknown[]) =>
        Promise.all(ops),
      );

      await service.registrarGanho(5, 10);

      expect(pontosRegistrados).toBe(1);
    });

    it('é idempotente — não duplica ganho para o mesmo agendamento', async () => {
      prisma.pontoFidelidade.findFirst.mockResolvedValue({
        codigo: 99,
        agendamentoCodigo: 5,
        tipo: 'ganho',
      });

      await service.registrarGanho(5, 10);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.agendamento.findFirst).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando agendamento não existe', async () => {
      prisma.pontoFidelidade.findFirst.mockResolvedValue(null);
      prisma.agendamento.findFirst.mockResolvedValue(null);

      await expect(service.registrarGanho(999, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── resgatar ──────────────────────────────────────────────────────────────

  describe('resgatar', () => {
    it('resgata pontos e retorna desconto correto (R$0,50 por ponto)', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        barCodigo: 10,
        usrCodigo: 1,
      });
      prisma.usuario.findFirst.mockResolvedValue({
        codigo: 1,
        pontosAcumulados: 100,
      });
      prisma.pontoFidelidade.create.mockResolvedValue({});
      prisma.usuario.update.mockResolvedValue({});
      prisma.$transaction.mockImplementation((ops: unknown[]) =>
        Promise.all(ops),
      );

      const resultado = await service.resgatar(1, 10, 20);

      expect(resultado.desconto).toBe(10); // 20 * 0.5 = 10
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('lança BadRequestException quando pontos são menores que 10', async () => {
      await expect(service.resgatar(1, 10, 9)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.usuario.findFirst).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando saldo é insuficiente', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        barCodigo: 10,
        usrCodigo: 1,
      });
      prisma.usuario.findFirst.mockResolvedValue({
        codigo: 1,
        pontosAcumulados: 5,
      });

      await expect(service.resgatar(1, 10, 10)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando cliente não existe', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        barCodigo: 10,
        usrCodigo: 999,
      });
      prisma.usuario.findFirst.mockResolvedValue(null);

      await expect(service.resgatar(999, 10, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('decrementa exatamente os pontos resgatados', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        barCodigo: 10,
        usrCodigo: 1,
      });
      prisma.usuario.findFirst.mockResolvedValue({
        codigo: 1,
        pontosAcumulados: 50,
      });
      prisma.pontoFidelidade.create.mockResolvedValue({});

      let decrementado = 0;
      prisma.usuario.update.mockImplementation(
        (args: { data: { pontosAcumulados: { decrement: number } } }) => {
          decrementado = args.data.pontosAcumulados.decrement;
          return Promise.resolve({});
        },
      );
      prisma.$transaction.mockImplementation((ops: unknown[]) =>
        Promise.all(ops),
      );

      await service.resgatar(1, 10, 30);

      expect(decrementado).toBe(30);
    });
  });
});
