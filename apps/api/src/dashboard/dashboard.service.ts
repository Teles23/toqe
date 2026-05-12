import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(barCodigo: number) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Últimos 7 dias
    const dias7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    // Faturamento por dia (últimos 7 dias)
    const faturamento7d = await Promise.all(
      dias7.map(async (dia) => {
        const fimDia = new Date(dia);
        fimDia.setHours(23, 59, 59, 999);

        const itens = await this.prisma.agendamentoItem.findMany({
          where: {
            barCodigo,
            agendamento: {
              status: 'concluido',
              inicio: { gte: dia, lte: fimDia },
            },
          },
          select: { preco: true },
        });

        return {
          data: dia.toISOString().split('T')[0],
          total: itens.reduce((acc, it) => acc + Number(it.preco), 0),
        };
      }),
    );

    // Agendamentos de hoje
    const fimHoje = new Date(hoje);
    fimHoje.setHours(23, 59, 59, 999);

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
      include: {
        usuario: { select: { codigo: true, nome: true, avatarUrl: true } },
      },
    });

    // Top 5 serviços do mês
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const itensMes = await this.prisma.agendamentoItem.findMany({
      where: {
        barCodigo,
        agendamento: {
          status: 'concluido',
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
