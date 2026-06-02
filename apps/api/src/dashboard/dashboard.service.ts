import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusAgendamento } from '../common/constants/agendamento-status';
import { SELECT_USUARIO_COM_AVATAR } from '../common/constants/prisma-selects';
import {
  startOfDay,
  endOfDay,
  currentMonthRange,
} from '../common/utils/date.utils';
import { somarItens } from '../common/utils/price.utils';

const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(barCodigo: number) {
    const agora = new Date();
    const hoje = startOfDay(agora);
    const fimHoje = endOfDay(hoje);

    const [kpis, liveMetrics, barbeiros, faturamento, servicos, atividade] =
      await Promise.all([
        this.getKpis(barCodigo, hoje, fimHoje),
        this.getLiveMetrics(barCodigo, hoje, fimHoje, agora),
        this.getBarbeirosStatus(barCodigo, agora),
        this.getFaturamento(barCodigo, hoje),
        this.getServicosPopulares(barCodigo),
        this.getAtividade(barCodigo, hoje, fimHoje),
      ]);

    return { kpis, liveMetrics, barbeiros, faturamento, servicos, atividade };
  }

  // ─── Dashboard consolidado da rede ────────────────────────────────────────

  async getRedeOverview(usuarioCodigo: number) {
    const agora = new Date();
    const hoje = startOfDay(agora);
    const fimHoje = endOfDay(hoje);
    const { inicio: inicioMes } = currentMonthRange();

    const barbearias = await this.prisma.membroBarbearia.findMany({
      where: { usrCodigo: usuarioCodigo, perfil: 'dono' },
      select: { barCodigo: true, barbearia: { select: { nome: true } } },
    });

    const unidades = await Promise.all(
      barbearias.map(async ({ barCodigo, barbearia }) => {
        const [itensHoje, itensMes, agendamentosHoje] = await Promise.all([
          this.prisma.agendamentoItem.findMany({
            where: {
              barCodigo,
              agendamento: {
                status: StatusAgendamento.CONCLUIDO,
                inicio: { gte: hoje, lte: fimHoje },
              },
            },
            select: { preco: true },
          }),
          this.prisma.agendamentoItem.findMany({
            where: {
              barCodigo,
              agendamento: {
                status: StatusAgendamento.CONCLUIDO,
                inicio: { gte: inicioMes, lte: fimHoje },
              },
            },
            select: { preco: true },
          }),
          this.prisma.agendamento.findMany({
            where: { barCodigo, inicio: { gte: hoje, lte: fimHoje } },
            select: { status: true },
          }),
        ]);

        const faturamentoHoje = somarItens(itensHoje);
        const faturamentoMes = somarItens(itensMes);
        const concluido = StatusAgendamento.CONCLUIDO as string;
        const qtdConcluidos = agendamentosHoje.filter(
          (a) => a.status === concluido,
        ).length;

        return {
          barCodigo,
          nome: barbearia.nome,
          faturamentoHoje,
          faturamentoMes,
          agendamentosHoje: agendamentosHoje.length,
          concluidos: qtdConcluidos,
        };
      }),
    );

    const totais = {
      faturamentoHoje: unidades.reduce((s, u) => s + u.faturamentoHoje, 0),
      faturamentoMes: unidades.reduce((s, u) => s + u.faturamentoMes, 0),
      agendamentosHoje: unidades.reduce((s, u) => s + u.agendamentosHoje, 0),
      concluidos: unidades.reduce((s, u) => s + u.concluidos, 0),
    };

    return { unidades, totais };
  }

  // ─── KPIs ─────────────────────────────────────────────────────────────────

  private async getKpis(barCodigo: number, hoje: Date, fimHoje: Date) {
    const [itensConcluidos, agendamentosHoje, itensMes] = await Promise.all([
      this.prisma.agendamentoItem.findMany({
        where: {
          barCodigo,
          agendamento: {
            status: StatusAgendamento.CONCLUIDO,
            inicio: { gte: hoje, lte: fimHoje },
          },
        },
        select: { preco: true },
      }),
      this.prisma.agendamento.findMany({
        where: { barCodigo, inicio: { gte: hoje, lte: fimHoje } },
        select: { status: true },
      }),
      this.prisma.agendamentoItem.findMany({
        where: {
          barCodigo,
          agendamento: {
            status: StatusAgendamento.CONCLUIDO,
            inicio: {
              gte: startOfDay(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
              lte: fimHoje,
            },
          },
        },
        select: { preco: true },
      }),
    ]);

    const faturamentoHoje = somarItens(itensConcluidos);
    const concluido = StatusAgendamento.CONCLUIDO as string;
    const confirmado = StatusAgendamento.CONFIRMADO as string;
    const qtdConcluidos = agendamentosHoje.filter(
      (a) => a.status === concluido,
    ).length;
    const qtdConfirmados = agendamentosHoje.filter(
      (a) => a.status === confirmado,
    ).length;
    const ticketMedio =
      qtdConcluidos > 0 ? Math.round(faturamentoHoje / qtdConcluidos) : 0;
    const faturamentoMes = somarItens(itensMes);

    return [
      {
        label: 'Faturamento hoje',
        value: faturamentoHoje,
        unit: 'R$',
        status: 'success' as const,
        trend: { value: 0, label: 'vs ontem' },
      },
      {
        label: 'Agendamentos',
        value: agendamentosHoje.length,
        status: 'info' as const,
        subtitle: `${qtdConcluidos} concluídos · ${qtdConfirmados} ativos`,
      },
      {
        label: 'Ticket médio',
        value: ticketMedio,
        unit: 'R$',
        status: 'warning' as const,
        trend: { value: 0, label: 'vs semana' },
      },
      {
        label: 'Faturamento mês',
        value: faturamentoMes,
        unit: 'R$',
        status: 'success' as const,
        subtitle: 'Mês atual',
      },
    ];
  }

  // ─── Live metrics ──────────────────────────────────────────────────────────

  private async getLiveMetrics(
    barCodigo: number,
    hoje: Date,
    fimHoje: Date,
    agora: Date,
  ) {
    const [agdAtivos, proximo, aguardando, duracoes] = await Promise.all([
      this.prisma.agendamento.count({
        where: {
          barCodigo,
          status: {
            in: [StatusAgendamento.CONFIRMADO, StatusAgendamento.EM_ANDAMENTO],
          },
          inicio: { lte: agora },
          fim: { gte: agora },
        },
      }),
      this.prisma.agendamento.findFirst({
        where: {
          barCodigo,
          status: {
            in: [StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO],
          },
          inicio: { gte: agora },
        },
        orderBy: { inicio: 'asc' },
        select: { inicio: true },
      }),
      this.prisma.agendamento.count({
        where: {
          barCodigo,
          status: StatusAgendamento.PENDENTE,
          inicio: { gte: hoje, lte: fimHoje },
        },
      }),
      this.prisma.agendamento.findMany({
        where: {
          barCodigo,
          status: StatusAgendamento.CONCLUIDO,
          inicio: { gte: hoje, lte: fimHoje },
        },
        select: { inicio: true, fim: true },
      }),
    ]);

    const tempoMedio =
      duracoes.length > 0
        ? Math.round(
            duracoes.reduce(
              (acc, a) => acc + (a.fim.getTime() - a.inicio.getTime()) / 60_000,
              0,
            ) / duracoes.length,
          )
        : 0;

    const proximoHorario = proximo
      ? proximo.inicio.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

    return [
      {
        label: 'Barbeiros ativos',
        value: String(agdAtivos),
        color: 'var(--status-success)',
      },
      {
        label: 'Próximo horário',
        value: proximoHorario,
        color: 'var(--text-primary)',
      },
      {
        label: 'Aguardando',
        value: String(aguardando),
        color: 'var(--status-warning)',
      },
      {
        label: 'Tempo médio',
        value: tempoMedio > 0 ? `${tempoMedio}min` : '—',
        color: 'var(--status-info)',
      },
    ];
  }

  // ─── Barbeiros status ao vivo ──────────────────────────────────────────────

  private async getBarbeirosStatus(barCodigo: number, agora: Date) {
    const membros = await this.prisma.membroBarbearia.findMany({
      where: { barCodigo, perfil: 'barbeiro' },
      include: { usuario: { select: SELECT_USUARIO_COM_AVATAR } },
    });

    return Promise.all(
      membros.map(async (m) => {
        const agdAtual = await this.prisma.agendamento.findFirst({
          where: {
            barCodigo,
            barbeiroId: m.usrCodigo,
            status: {
              in: [
                StatusAgendamento.CONFIRMADO,
                StatusAgendamento.EM_ANDAMENTO,
              ],
            },
            inicio: { lte: agora },
            fim: { gte: agora },
          },
          include: {
            cliente: { select: { nome: true } },
            itens: {
              include: { servico: { select: { nome: true } } },
              take: 1,
            },
          },
        });

        const nome = m.usuario.nome;
        const initial = nome.charAt(0).toUpperCase();

        if (!agdAtual) {
          return {
            nome,
            initial,
            estado: 'idle' as const,
            cliente: null,
            servico: null,
            pct: 0,
          };
        }

        const totalMs = agdAtual.fim.getTime() - agdAtual.inicio.getTime();
        const elapsedMs = agora.getTime() - agdAtual.inicio.getTime();
        const pct = Math.min(
          100,
          Math.max(0, Math.round((elapsedMs / totalMs) * 100)),
        );

        return {
          nome,
          initial,
          estado: 'active' as const,
          cliente: agdAtual.cliente?.nome ?? null,
          servico: agdAtual.itens[0]?.servico.nome ?? null,
          pct,
        };
      }),
    );
  }

  // ─── Faturamento semana + mês ──────────────────────────────────────────────

  private async getFaturamento(barCodigo: number, hoje: Date) {
    const semana = await this.getFaturamentoDias(barCodigo, hoje, 7);
    const mes = await this.getFaturamentoSemanas(barCodigo, hoje);
    return { semana, mes };
  }

  private async getFaturamentoDias(
    barCodigo: number,
    hoje: Date,
    dias: number,
  ) {
    const pontos = Array.from({ length: dias }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(d.getDate() - (dias - 1 - i));
      return d;
    });

    return Promise.all(
      pontos.map(async (dia) => {
        const itens = await this.prisma.agendamentoItem.findMany({
          where: {
            barCodigo,
            agendamento: {
              status: StatusAgendamento.CONCLUIDO,
              inicio: { gte: dia, lte: endOfDay(dia) },
            },
          },
          select: { preco: true },
        });
        return {
          dia: DIAS_SEMANA_ABREV[dia.getDay()],
          valor: somarItens(itens),
        };
      }),
    );
  }

  private async getFaturamentoSemanas(barCodigo: number, hoje: Date) {
    const { inicio: inicioMes } = currentMonthRange();
    const semanas: { dia: string; valor: number }[] = [];

    for (let s = 0; s < 4; s++) {
      const inicioSemana = new Date(inicioMes);
      inicioSemana.setDate(inicioMes.getDate() + s * 7);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);

      if (inicioSemana > hoje) {
        semanas.push({ dia: `Sem ${s + 1}`, valor: 0 });
        continue;
      }

      const itens = await this.prisma.agendamentoItem.findMany({
        where: {
          barCodigo,
          agendamento: {
            status: StatusAgendamento.CONCLUIDO,
            inicio: { gte: inicioSemana, lte: fimSemana },
          },
        },
        select: { preco: true },
      });
      semanas.push({ dia: `Sem ${s + 1}`, valor: somarItens(itens) });
    }

    return semanas;
  }

  // ─── Serviços populares ───────────────────────────────────────────────────

  private async getServicosPopulares(barCodigo: number) {
    const { inicio: inicioMes, fim: fimMes } = currentMonthRange();

    const itensMes = await this.prisma.agendamentoItem.findMany({
      where: {
        barCodigo,
        agendamento: {
          status: StatusAgendamento.CONCLUIDO,
          inicio: { gte: inicioMes, lte: fimMes },
        },
      },
      select: { preco: true, servico: { select: { nome: true } } },
    });

    const map: Record<
      string,
      { nome: string; total: number; quantidade: number }
    > = {};
    itensMes.forEach((it) => {
      const { nome } = it.servico;
      if (!map[nome]) map[nome] = { nome, total: 0, quantidade: 0 };
      map[nome].total += it.preco.toNumber();
      map[nome].quantidade += 1;
    });

    const sorted = Object.values(map)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    const maxQtd = sorted[0]?.quantidade ?? 1;
    return sorted.map((s) => ({
      nome: s.nome,
      quantidade: s.quantidade,
      receita: s.total,
      pct: Math.round((s.quantidade / maxQtd) * 100),
    }));
  }

  // ─── Atividade recente ─────────────────────────────────────────────────────

  private async getAtividade(barCodigo: number, hoje: Date, fimHoje: Date) {
    const agendamentos = await this.prisma.agendamento.findMany({
      where: { barCodigo, inicio: { gte: hoje, lte: fimHoje } },
      include: { cliente: { select: { nome: true } } },
      orderBy: { inicio: 'desc' },
      take: 10,
    });

    const agora = new Date();

    return agendamentos.map((a) => {
      const diffMin = Math.round(
        (agora.getTime() - a.inicio.getTime()) / 60_000,
      );
      const tempo =
        diffMin < 1
          ? 'agora'
          : diffMin < 60
            ? `${diffMin}min`
            : `${Math.round(diffMin / 60)}h`;
      const horario = a.inicio.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const nomeCliente = a.cliente?.nome ?? 'Cliente';

      const STATUS_MAP = {
        [StatusAgendamento.CONFIRMADO]: {
          tipo: 'confirmado',
          texto: `${nomeCliente} confirmou ${horario}`,
          cor: 'var(--status-success)',
        },
        [StatusAgendamento.CONCLUIDO]: {
          tipo: 'concluido',
          texto: `${nomeCliente} — atendimento concluído`,
          cor: 'var(--status-success)',
        },
        [StatusAgendamento.CANCELADO]: {
          tipo: 'atrasado',
          texto: `${nomeCliente} cancelou ${horario}`,
          cor: 'var(--status-error)',
        },
        [StatusAgendamento.NO_SHOW]: {
          tipo: 'atrasado',
          texto: `${nomeCliente} não compareceu — ${horario}`,
          cor: 'var(--status-error)',
        },
        [StatusAgendamento.PENDENTE]: {
          tipo: 'novo',
          texto: `Novo agendamento — ${nomeCliente} ${horario}`,
          cor: 'var(--status-info)',
        },
      } as const;

      const entry = STATUS_MAP[a.status as keyof typeof STATUS_MAP] ?? {
        tipo: 'novo',
        texto: `${nomeCliente} ${horario}`,
        cor: 'var(--text-muted)',
      };

      return { ...entry, tempo };
    });
  }
}
