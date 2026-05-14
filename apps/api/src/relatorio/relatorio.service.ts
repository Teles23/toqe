import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StatusAgendamento,
  STATUSES_ENCERRADOS,
  STATUSES_ATIVOS,
} from '../common/constants/agendamento-status';
import {
  SELECT_USUARIO_COM_AVATAR,
  INCLUDE_ITENS_PRECO,
} from '../common/constants/prisma-selects';
import { startOfDay, toDateString } from '../common/utils/date.utils';
import { somarAgendamentos } from '../common/utils/price.utils';

type Periodo = '7d' | '30d' | '3m' | '6m' | '12m';

function periodoParaDias(periodo: Periodo): number {
  return { '7d': 7, '30d': 30, '3m': 90, '6m': 180, '12m': 365 }[periodo] ?? 30;
}

@Injectable()
export class RelatorioService {
  constructor(private prisma: PrismaService) {}

  private getRange(periodo: Periodo) {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - periodoParaDias(periodo));
    return { inicio: startOfDay(inicio), fim };
  }

  /** Faturamento diário no período */
  async faturamento(barCodigo: number, periodo: Periodo = '30d') {
    const { inicio, fim } = this.getRange(periodo);

    const itens = await this.prisma.agendamentoItem.findMany({
      where: {
        barCodigo,
        agendamento: {
          status: StatusAgendamento.CONCLUIDO,
          inicio: { gte: inicio, lte: fim },
        },
      },
      select: {
        preco: true,
        agendamento: { select: { inicio: true } },
      },
    });

    // Agrupar por dia
    const porDia: Record<string, number> = {};
    itens.forEach((it) => {
      const dia = toDateString(it.agendamento.inicio);
      porDia[dia] = (porDia[dia] ?? 0) + Number(it.preco);
    });

    return Object.entries(porDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, total]) => ({ data, total }));
  }

  /** Agendamentos concluídos vs cancelados por dia */
  async agendamentos(barCodigo: number, periodo: Periodo = '30d') {
    const { inicio, fim } = this.getRange(periodo);

    const todos = await this.prisma.agendamento.findMany({
      where: {
        barCodigo,
        status: { in: [...STATUSES_ENCERRADOS] },
        inicio: { gte: inicio, lte: fim },
      },
      select: { inicio: true, status: true },
    });

    const porDia: Record<
      string,
      { concluido: number; cancelado: number; no_show: number }
    > = {};
    todos.forEach((ag) => {
      const dia = toDateString(ag.inicio);
      if (!porDia[dia])
        porDia[dia] = { concluido: 0, cancelado: 0, no_show: 0 };
      porDia[dia][ag.status as 'concluido' | 'cancelado' | 'no_show'] += 1;
    });

    return Object.entries(porDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, counts]) => ({ data, ...counts }));
  }

  /** Distribuição de receita por serviço */
  async servicos(barCodigo: number, periodo: Periodo = '30d') {
    const { inicio, fim } = this.getRange(periodo);

    const itens = await this.prisma.agendamentoItem.findMany({
      where: {
        barCodigo,
        agendamento: {
          status: StatusAgendamento.CONCLUIDO,
          inicio: { gte: inicio, lte: fim },
        },
      },
      select: { preco: true, servico: { select: { nome: true } } },
    });

    const mapa: Record<
      string,
      { nome: string; quantidade: number; total: number }
    > = {};
    itens.forEach((it) => {
      const { nome } = it.servico;
      if (!mapa[nome]) mapa[nome] = { nome, quantidade: 0, total: 0 };
      mapa[nome].quantidade += 1;
      mapa[nome].total += Number(it.preco);
    });

    return Object.values(mapa).sort((a, b) => b.quantidade - a.quantidade);
  }

  /** Ranking de barbeiros por faturamento */
  async barbeiros(barCodigo: number, periodo: Periodo = '30d') {
    const { inicio, fim } = this.getRange(periodo);

    const membros = await this.prisma.membroBarbearia.findMany({
      where: { barCodigo, perfil: 'barbeiro' },
      include: { usuario: { select: SELECT_USUARIO_COM_AVATAR } },
    });

    return Promise.all(
      membros.map(async (m) => {
        const agendamentos = await this.prisma.agendamento.findMany({
          where: {
            barCodigo,
            barbeiroId: m.usrCodigo,
            status: StatusAgendamento.CONCLUIDO,
            inicio: { gte: inicio, lte: fim },
          },
          include: INCLUDE_ITENS_PRECO,
        });

        const faturamento = somarAgendamentos(agendamentos);

        return {
          ...m.usuario,
          atendimentos: agendamentos.length,
          faturamento,
          ticketMedio:
            agendamentos.length > 0 ? faturamento / agendamentos.length : 0,
        };
      }),
    ).then((lista) => lista.sort((a, b) => b.faturamento - a.faturamento));
  }

  /** Volume de agendamentos por hora do dia (horários de pico) */
  async horariosPico(barCodigo: number, periodo: Periodo = '30d') {
    const { inicio, fim } = this.getRange(periodo);

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        barCodigo,
        status: { in: [...STATUSES_ATIVOS] },
        inicio: { gte: inicio, lte: fim },
      },
      select: { inicio: true },
    });

    const porHora: Record<number, number> = {};
    agendamentos.forEach((ag) => {
      const hora = ag.inicio.getUTCHours();
      porHora[hora] = (porHora[hora] ?? 0) + 1;
    });

    return Array.from({ length: 24 }, (_, h) => ({
      hora: `${String(h).padStart(2, '0')}:00`,
      quantidade: porHora[h] ?? 0,
    }));
  }
}
