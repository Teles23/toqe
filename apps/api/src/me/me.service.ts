import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusAgendamento } from '../common/constants/agendamento-status';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export type Periodo = 'mes' | 'semana';

export interface MeStatsResult {
  atendimentos: number;
  faturamento: number;
  presenca: number;
  ticketMedio: number;
}

@Injectable()
export class MeService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: number, periodo: Periodo): Promise<MeStatsResult> {
    const now = new Date();
    const inicio =
      periodo === 'semana'
        ? startOfWeek(now, { weekStartsOn: 1 })
        : startOfMonth(now);
    const fim =
      periodo === 'semana'
        ? endOfWeek(now, { weekStartsOn: 1 })
        : endOfMonth(now);

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        barbeiroId: userId,
        inicio: { gte: inicio, lte: fim },
        status: {
          in: [StatusAgendamento.CONCLUIDO, StatusAgendamento.NO_SHOW],
        },
      },
      include: { itens: true },
    });

    const concluidos = agendamentos.filter(
      (a) => (a.status as StatusAgendamento) === StatusAgendamento.CONCLUIDO,
    );
    const noShows = agendamentos.filter(
      (a) => (a.status as StatusAgendamento) === StatusAgendamento.NO_SHOW,
    );

    const atendimentos = concluidos.length;

    const faturamento = concluidos.reduce((total, ag) => {
      const somaItens = ag.itens.reduce(
        (acc, it) => acc + it.preco.toNumber(),
        0,
      );
      return total + somaItens;
    }, 0);

    const total = concluidos.length + noShows.length;
    const presenca = total === 0 ? 1.0 : concluidos.length / total;

    const ticketMedio = atendimentos === 0 ? 0 : faturamento / atendimentos;

    return {
      atendimentos,
      faturamento: Math.round(faturamento * 100),
      presenca: Math.round(presenca * 100) / 100,
      ticketMedio: Math.round(ticketMedio * 100),
    };
  }
}
