import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PontoFidelidade } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FidelidadeService {
  constructor(private readonly prisma: PrismaService) {}

  async getSaldo(
    clienteCodigo: number,
    barCodigo: number,
  ): Promise<{ pontos: number; historico: PontoFidelidade[] }> {
    const membroCliente = await this.prisma.membroBarbearia.findFirst({
      where: { barCodigo, usrCodigo: clienteCodigo },
    });
    if (!membroCliente) {
      throw new NotFoundException('Cliente não encontrado nesta barbearia');
    }

    const cliente = await this.prisma.usuario.findFirst({
      where: { codigo: clienteCodigo },
      select: { codigo: true },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const [historico, saldoData] = await Promise.all([
      this.prisma.pontoFidelidade.findMany({
        where: { clienteCodigo, barCodigo },
        orderBy: { criadoEm: 'desc' },
        take: 20,
      }),
      this.prisma.pontoFidelidade.groupBy({
        by: ['tipo'],
        where: { clienteCodigo, barCodigo },
        _sum: { pontos: true },
      }),
    ]);

    // Compute per-barbearia balance: sum of ganhos minus sum of resgates
    const pontos = saldoData.reduce((acc, row) => {
      const pts = row._sum.pontos ?? 0;
      return row.tipo === 'ganho' ? acc + pts : acc - pts;
    }, 0);

    return { pontos, historico };
  }

  async registrarGanho(
    agendamentoCodigo: number,
    barCodigo: number,
  ): Promise<void> {
    const jaExiste = await this.prisma.pontoFidelidade.findFirst({
      where: { agendamentoCodigo, barCodigo, tipo: 'ganho' },
    });

    if (jaExiste) {
      return;
    }

    const agendamento = await this.prisma.agendamento.findFirst({
      where: { codigo: agendamentoCodigo, barCodigo },
      include: { itens: true },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (agendamento.clienteId == null) {
      return; // Walk-in sem conta — não acumula pontos
    }

    const totalValor = agendamento.itens.reduce(
      (acc, item) => acc + Number(item.preco),
      0,
    );

    const pontos = Math.max(1, Math.floor(totalValor / 10));

    try {
      await this.prisma.$transaction([
        this.prisma.pontoFidelidade.create({
          data: {
            barCodigo,
            clienteCodigo: agendamento.clienteId,
            pontos,
            tipo: 'ganho',
            agendamentoCodigo,
          },
        }),
        this.prisma.usuario.update({
          where: { codigo: agendamento.clienteId },
          data: { pontosAcumulados: { increment: pontos } },
        }),
      ]);
    } catch (e) {
      // Unique index "TQE_PONTO_FIDELIDADE_ganho_agd_key" prevents duplicate ganho
      // for the same appointment — idempotency guarantee at DB level.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return;
      }
      throw e;
    }
  }

  async getRanking(
    barCodigo: number,
    limit: number,
  ): Promise<{ codigo: number; nome: string; pontosAcumulados: number }[]> {
    const membros = await this.prisma.membroBarbearia.findMany({
      where: { barCodigo },
      select: {
        usuario: {
          select: {
            codigo: true,
            nome: true,
            pontosAcumulados: true,
          },
        },
      },
      orderBy: { usuario: { pontosAcumulados: 'desc' } },
      take: limit,
    });

    return membros.map((m) => m.usuario).filter((u) => u.pontosAcumulados > 0);
  }

  async resgatar(
    clienteCodigo: number,
    barCodigo: number,
    pontos: number,
  ): Promise<{ desconto: number }> {
    if (pontos < 10) {
      throw new BadRequestException('Mínimo de 10 pontos para resgate');
    }

    const membroCliente = await this.prisma.membroBarbearia.findFirst({
      where: { barCodigo, usrCodigo: clienteCodigo },
    });
    if (!membroCliente) {
      throw new NotFoundException('Cliente não encontrado nesta barbearia');
    }

    // Validate per-barbearia balance — prevents redeeming in barbearia B points
    // earned exclusively in barbearia A (pontosAcumulados is a global counter).
    const saldoData = await this.prisma.pontoFidelidade.groupBy({
      by: ['tipo'],
      where: { clienteCodigo, barCodigo },
      _sum: { pontos: true },
    });
    const saldoLocal = saldoData.reduce((acc, row) => {
      const pts = row._sum.pontos ?? 0;
      return row.tipo === 'ganho' ? acc + pts : acc - pts;
    }, 0);
    if (saldoLocal < pontos) {
      throw new BadRequestException('Saldo insuficiente nesta barbearia');
    }

    const desconto = pontos * 0.5;

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.usuario.updateMany({
        where: { codigo: clienteCodigo, pontosAcumulados: { gte: pontos } },
        data: { pontosAcumulados: { decrement: pontos } },
      });

      if (updated.count === 0) {
        const existe = await tx.usuario.findUnique({
          where: { codigo: clienteCodigo },
          select: { codigo: true },
        });
        if (!existe) throw new NotFoundException('Cliente não encontrado');
        throw new BadRequestException('Saldo de pontos insuficiente');
      }

      await tx.pontoFidelidade.create({
        data: { barCodigo, clienteCodigo, pontos, tipo: 'resgate' },
      });
    });

    return { desconto };
  }
}
