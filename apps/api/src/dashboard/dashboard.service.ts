import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusAgendamento } from '../common/constants/agendamento-status';
import { SELECT_USUARIO_COM_AVATAR } from '../common/constants/prisma-selects';
import {
  startOfDay,
  endOfDay,
  toDateString,
  currentMonthRange,
} from '../common/utils/date.utils';
import { somarItens } from '../common/utils/price.utils';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(barCodigo: number) {
    const hoje = startOfDay(new Date());

    // Últimos 7 dias
    const dias7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    // Faturamento por dia (últimos 7 dias)
    const faturamento7d = await Promise.all(
      dias7.map(async (dia) => {
        const fimDia = endOfDay(dia);

        const itens = await this.prisma.agendamentoItem.findMany({
          where: {
            barCodigo,
            agendamento: {
              status: StatusAgendamento.CONCLUIDO,
              inicio: { gte: dia, lte: fimDia },
            },
          },
          select: { preco: true },
        });

        return {
          data: toDateString(dia),
          total: somarItens(itens),
        };
      }),
    );

    // Agendamentos de hoje
    const fimHoje = endOfDay(hoje);

    const agendamentosHoje = await this.prisma.agendamento.findMany({
      where: { barCodigo, inicio: { gte: hoje, lte: fimHoje } },
      include: {
        cliente: { select: { nome: true, avatarUrl: true } },
        barbeiro: { select: { nome: true } },
        itens: { include: { servico: { select: { nome: true } } } },
      },
      orderBy: { inicio: 'asc' },
      take: 10,
    });

    // Barbeiros ativos hoje
    const barbeirosAtivos = await this.prisma.membroBarbearia.findMany({
      where: { barCodigo, perfil: 'barbeiro' },
      include: { usuario: { select: SELECT_USUARIO_COM_AVATAR } },
    });

    // Top 5 serviços do mês
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

    const servicoMap: Record<
      string,
      { nome: string; total: number; quantidade: number }
    > = {};
    itensMes.forEach((it) => {
      const { nome } = it.servico;
      if (!servicoMap[nome])
        servicoMap[nome] = { nome, total: 0, quantidade: 0 };
      servicoMap[nome].total += Number(it.preco);
      servicoMap[nome].quantidade += 1;
    });

    const topServicos = Object.values(servicoMap)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    return {
      faturamento7d,
      agendamentosHoje,
      barbeirosAtivos: barbeirosAtivos.map((m) => m.usuario),
      topServicos,
    };
  }
}
