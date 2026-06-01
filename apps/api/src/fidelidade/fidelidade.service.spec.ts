import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FidelidadeService } from './fidelidade.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, PrismaMock } from '../test/prisma-mock.factory';
import type {
  Usuario,
  PontoFidelidade,
  Agendamento,
} from '../generated/prisma';

describe('FidelidadeService', () => {
  let service: FidelidadeService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
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
    it('retorna saldo e histórico do cliente (saldo calculado por barbearia)', async () => {
      const historico = [
        {
          codigo: 1,
          clienteCodigo: 1,
          barCodigo: 10,
          pontos: 50,
          tipo: 'ganho',
          agendamentoCodigo: null,
          criadoEm: new Date(),
        },
      ] as PontoFidelidade[];
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        codigo: 1,
        barCodigo: 10,
        usrCodigo: 1,
        perfil: 'cliente',
        criadoEm: new Date(),
      });
      prisma.usuario.findFirst.mockResolvedValue({
        codigo: 1,
      } as unknown as Usuario);
      prisma.pontoFidelidade.findMany.mockResolvedValue(historico);
      prisma.pontoFidelidade.groupBy.mockResolvedValue([
        { tipo: 'ganho', _sum: { pontos: 50 } },
      ] as never);

      const resultado = await service.getSaldo(1, 10);

      expect(resultado.pontos).toBe(50);
      expect(resultado.historico).toEqual(historico);
      expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
        where: { codigo: 1 },
        select: { codigo: true },
      });
      expect(prisma.pontoFidelidade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clienteCodigo: 1, barCodigo: 10 },
          take: 20,
        }),
      );
    });

    it('subtrai resgates do saldo por barbearia', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        codigo: 1,
        barCodigo: 10,
        usrCodigo: 1,
        perfil: 'cliente',
        criadoEm: new Date(),
      });
      prisma.usuario.findFirst.mockResolvedValue({
        codigo: 1,
      } as unknown as Usuario);
      prisma.pontoFidelidade.findMany.mockResolvedValue([]);
      prisma.pontoFidelidade.groupBy.mockResolvedValue([
        { tipo: 'ganho', _sum: { pontos: 50 } },
        { tipo: 'resgate', _sum: { pontos: 20 } },
      ] as never);

      const resultado = await service.getSaldo(1, 10);

      expect(resultado.pontos).toBe(30);
    });

    it('lança NotFoundException quando cliente não existe', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        codigo: 2,
        barCodigo: 10,
        usrCodigo: 999,
        perfil: 'cliente',
        criadoEm: new Date(),
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
      } as unknown as Agendamento);
      prisma.$transaction.mockImplementation(((ops: unknown[]) =>
        Promise.all(ops)) as unknown as typeof prisma.$transaction);
      prisma.pontoFidelidade.create.mockResolvedValue(
        {} as unknown as PontoFidelidade,
      );
      prisma.usuario.update.mockResolvedValue({} as unknown as Usuario);

      await service.registrarGanho(5, 10);

      expect(prisma.$transaction).toHaveBeenCalled();
      const [firstCall] = prisma.$transaction.mock.calls as unknown as [
        unknown[],
      ][];
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
      } as unknown as Agendamento);

      let pontosRegistrados = 0;
      prisma.pontoFidelidade.create.mockImplementation(((args: {
        data: { pontos: number };
      }) => {
        pontosRegistrados = args.data.pontos;
        return Promise.resolve({} as PontoFidelidade);
      }) as unknown as typeof prisma.pontoFidelidade.create);
      prisma.usuario.update.mockResolvedValue({} as unknown as Usuario);
      prisma.$transaction.mockImplementation(((ops: unknown[]) =>
        Promise.all(ops)) as unknown as typeof prisma.$transaction);

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
      } as unknown as Agendamento);

      let pontosRegistrados = 0;
      prisma.pontoFidelidade.create.mockImplementation(((args: {
        data: { pontos: number };
      }) => {
        pontosRegistrados = args.data.pontos;
        return Promise.resolve({} as PontoFidelidade);
      }) as unknown as typeof prisma.pontoFidelidade.create);
      prisma.usuario.update.mockResolvedValue({} as unknown as Usuario);
      prisma.$transaction.mockImplementation(((ops: unknown[]) =>
        Promise.all(ops)) as unknown as typeof prisma.$transaction);

      await service.registrarGanho(5, 10);

      expect(pontosRegistrados).toBe(1);
    });

    it('é idempotente — não duplica ganho para o mesmo agendamento', async () => {
      prisma.pontoFidelidade.findFirst.mockResolvedValue({
        codigo: 99,
        agendamentoCodigo: 5,
        tipo: 'ganho',
        barCodigo: 10,
        clienteCodigo: 1,
        pontos: 5,
        criadoEm: new Date(),
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
    function mockTxInterativo() {
      prisma.$transaction.mockImplementation(
        (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
      );
    }

    function mockSaldoLocal(ganhos: number, resgates = 0) {
      const rows: { tipo: string; _sum: { pontos: number } }[] = [
        { tipo: 'ganho', _sum: { pontos: ganhos } },
      ];
      if (resgates > 0) {
        rows.push({ tipo: 'resgate', _sum: { pontos: resgates } });
      }
      prisma.pontoFidelidade.groupBy.mockResolvedValue(rows as never);
    }

    it('resgata pontos e retorna desconto correto (R$0,50 por ponto)', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        codigo: 3,
        barCodigo: 10,
        usrCodigo: 1,
        perfil: 'cliente',
        criadoEm: new Date(),
      });
      mockSaldoLocal(50);
      prisma.usuario.updateMany.mockResolvedValue({ count: 1 });
      prisma.pontoFidelidade.create.mockResolvedValue(
        {} as unknown as PontoFidelidade,
      );
      mockTxInterativo();

      const resultado = await service.resgatar(1, 10, 20);

      expect(resultado.desconto).toBe(10); // 20 * 0.5 = 10
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('lança BadRequestException quando pontos são menores que 10', async () => {
      await expect(service.resgatar(1, 10, 9)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando saldo na barbearia é insuficiente (cross-tenant guard)', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        codigo: 4,
        barCodigo: 10,
        usrCodigo: 1,
        perfil: 'cliente',
        criadoEm: new Date(),
      });
      mockSaldoLocal(5); // apenas 5 pontos nesta barbearia

      await expect(service.resgatar(1, 10, 20)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando saldo global é insuficiente (updateMany retorna 0)', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        codigo: 4,
        barCodigo: 10,
        usrCodigo: 1,
        perfil: 'cliente',
        criadoEm: new Date(),
      });
      mockSaldoLocal(50); // passa o check local
      prisma.usuario.updateMany.mockResolvedValue({ count: 0 });
      prisma.usuario.findUnique.mockResolvedValue({
        codigo: 1,
      } as unknown as Usuario);
      mockTxInterativo();

      await expect(service.resgatar(1, 10, 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança NotFoundException quando cliente não existe', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        codigo: 5,
        barCodigo: 10,
        usrCodigo: 999,
        perfil: 'cliente',
        criadoEm: new Date(),
      });
      mockSaldoLocal(50); // passa o check local
      prisma.usuario.updateMany.mockResolvedValue({ count: 0 });
      prisma.usuario.findUnique.mockResolvedValue(null);
      mockTxInterativo();

      await expect(service.resgatar(999, 10, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('decrementa exatamente os pontos resgatados via updateMany condicional', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        codigo: 6,
        barCodigo: 10,
        usrCodigo: 1,
        perfil: 'cliente',
        criadoEm: new Date(),
      });
      mockSaldoLocal(50); // passa o check local
      prisma.pontoFidelidade.create.mockResolvedValue(
        {} as unknown as PontoFidelidade,
      );

      let capturedWhere: unknown;
      prisma.usuario.updateMany.mockImplementation(((args: unknown) => {
        capturedWhere = args;
        return Promise.resolve({ count: 1 });
      }) as unknown as typeof prisma.usuario.updateMany);
      mockTxInterativo();

      await service.resgatar(1, 10, 30);

      expect(capturedWhere).toMatchObject({
        where: { codigo: 1, pontosAcumulados: { gte: 30 } },
        data: { pontosAcumulados: { decrement: 30 } },
      });
    });
  });
});
