import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Preços por plano (source of truth: PlanoLimite.preco na DB)
const PLAN_PRICE: Record<string, number> = {
  free: 0,
  basic: 89,
  pro: 189,
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Métricas globais ──────────────────────────────────────────────────────

  async getMetrics() {
    const [barbearias, planLimits] = await Promise.all([
      this.prisma.barbearia.findMany({
        select: {
          plano: true,
          planoStatus: true,
          ativo: true,
          membros: { select: { perfil: true } },
          agendamentos: {
            where: {
              inicio: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1,
                ),
              },
            },
            select: { codigo: true },
          },
        },
      }),
      this.prisma.planoLimite.findMany({
        select: { plano: true, preco: true },
      }),
    ]);

    const priceMap = new Map(planLimits.map((p) => [p.plano, Number(p.preco)]));

    const mrr = barbearias
      .filter((b) => b.planoStatus === 'ativo')
      .reduce(
        (sum, b) => sum + (priceMap.get(b.plano) ?? PLAN_PRICE[b.plano] ?? 0),
        0,
      );

    const totalBarbeiros = barbearias.reduce(
      (sum, b) =>
        sum +
        b.membros.filter((m) =>
          ['barbeiro', 'dono', 'gerente'].includes(m.perfil),
        ).length,
      0,
    );

    const totalAgdMes = barbearias.reduce(
      (sum, b) => sum + b.agendamentos.length,
      0,
    );

    return {
      mrr,
      arr: mrr * 12,
      totalTenants: barbearias.length,
      activeTenants: barbearias.filter(
        (b) => b.ativo && b.planoStatus === 'ativo',
      ).length,
      totalBarbeiros,
      totalAgdMes,
    };
  }

  // ── Lista de barbearias ───────────────────────────────────────────────────

  async getBarbearias(filters: {
    search?: string;
    plano?: string;
    status?: string;
  }) {
    const barbearias = await this.prisma.barbearia.findMany({
      where: {
        ...(filters.plano ? { plano: filters.plano } : {}),
        ...(filters.status ? { planoStatus: filters.status } : {}),
      },
      include: {
        membros: { select: { perfil: true } },
        agendamentos: {
          where: {
            inicio: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          select: { codigo: true },
        },
        tema: { select: { logoUrl: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });

    const planLimits = await this.prisma.planoLimite.findMany({
      select: { plano: true, preco: true },
    });
    const priceMap = new Map(planLimits.map((p) => [p.plano, Number(p.preco)]));

    const result = barbearias
      .filter((b) => {
        if (!filters.search) return true;
        const q = filters.search.toLowerCase();
        return (
          b.nome.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q)
        );
      })
      .map((b) => ({
        codigo: b.codigo,
        nome: b.nome,
        slug: b.slug,
        cidade: null as string | null, // Barbearia ainda não tem campo cidade
        plano: b.plano,
        planoStatus: b.planoStatus,
        ativo: b.ativo,
        criadoEm: b.criadoEm.toISOString(),
        totalBarbeiros: b.membros.filter((m) =>
          ['barbeiro', 'dono', 'gerente'].includes(m.perfil),
        ).length,
        totalAgdMes: b.agendamentos.length,
        mrr:
          b.planoStatus === 'ativo'
            ? (priceMap.get(b.plano) ?? PLAN_PRICE[b.plano] ?? 0)
            : 0,
        ultimaAtividade: b.criadoEm.toISOString(),
        logoUrl: b.tema?.logoUrl ?? null,
      }));

    return result;
  }

  // ── Detalhe de uma barbearia ──────────────────────────────────────────────

  async getBarbeariaById(id: number) {
    const barbearia = await this.prisma.barbearia.findUnique({
      where: { codigo: id },
      include: {
        membros: { select: { perfil: true, criadoEm: true } },
        agendamentos: {
          where: {
            inicio: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          select: { codigo: true },
        },
        tema: { select: { logoUrl: true, corPrimaria: true } },
      },
    });

    if (!barbearia) {
      throw new NotFoundException(`Barbearia #${id} não encontrada`);
    }

    const planLimits = await this.prisma.planoLimite.findMany({
      select: { plano: true, preco: true },
    });
    const priceMap = new Map(planLimits.map((p) => [p.plano, Number(p.preco)]));

    return {
      codigo: barbearia.codigo,
      nome: barbearia.nome,
      slug: barbearia.slug,
      plano: barbearia.plano,
      planoStatus: barbearia.planoStatus,
      ativo: barbearia.ativo,
      criadoEm: barbearia.criadoEm.toISOString(),
      totalBarbeiros: barbearia.membros.filter((m) =>
        ['barbeiro', 'dono', 'gerente'].includes(m.perfil),
      ).length,
      totalAgdMes: barbearia.agendamentos.length,
      mrr:
        barbearia.planoStatus === 'ativo'
          ? (priceMap.get(barbearia.plano) ?? PLAN_PRICE[barbearia.plano] ?? 0)
          : 0,
      logoUrl: barbearia.tema?.logoUrl ?? null,
      corPrimaria: barbearia.tema?.corPrimaria ?? null,
    };
  }

  // ── Mudar plano ───────────────────────────────────────────────────────────

  async updatePlano(id: number, plano: string) {
    const exists = await this.prisma.barbearia.findUnique({
      where: { codigo: id },
      select: { codigo: true },
    });
    if (!exists) throw new NotFoundException(`Barbearia #${id} não encontrada`);

    return this.prisma.barbearia.update({
      where: { codigo: id },
      data: { plano },
      select: { codigo: true, nome: true, plano: true, planoStatus: true },
    });
  }

  // ── Mudar status ──────────────────────────────────────────────────────────

  async updateStatus(id: number, status: string) {
    const exists = await this.prisma.barbearia.findUnique({
      where: { codigo: id },
      select: { codigo: true },
    });
    if (!exists) throw new NotFoundException(`Barbearia #${id} não encontrada`);

    const ativo = status === 'ativo';
    const bloqueadaEm = status === 'suspenso' ? new Date() : null;

    return this.prisma.barbearia.update({
      where: { codigo: id },
      data: { planoStatus: status, ativo, bloqueadaEm },
      select: {
        codigo: true,
        nome: true,
        plano: true,
        planoStatus: true,
        ativo: true,
      },
    });
  }

  // ── Receita ───────────────────────────────────────────────────────────────

  async getRevenue() {
    // Agrega MRR dos últimos 7 meses por contagem de barbearias ativas
    const now = new Date();
    const historico: Array<{ mes: string; mrr: number }> = [];

    const [planLimits, allBarbearias] = await Promise.all([
      this.prisma.planoLimite.findMany({
        select: { plano: true, preco: true },
      }),
      this.prisma.barbearia.findMany({
        select: { plano: true, planoStatus: true, criadoEm: true },
      }),
    ]);

    const priceMap = new Map(planLimits.map((p) => [p.plano, Number(p.preco)]));

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mesLabel = d.toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      });

      // Barbearias que existiam nesse mês e estavam ativas
      const mrr = allBarbearias
        .filter(
          (b) =>
            b.criadoEm <= new Date(d.getFullYear(), d.getMonth() + 1, 0) &&
            b.planoStatus === 'ativo',
        )
        .reduce(
          (sum, b) => sum + (priceMap.get(b.plano) ?? PLAN_PRICE[b.plano] ?? 0),
          0,
        );

      historico.push({ mes: mesLabel, mrr });
    }

    const currentMrr = historico[historico.length - 1]?.mrr ?? 0;

    // Breakdown por plano
    const planCounts = new Map<string, number>();
    allBarbearias
      .filter((b) => b.planoStatus === 'ativo')
      .forEach((b) => {
        planCounts.set(b.plano, (planCounts.get(b.plano) ?? 0) + 1);
      });

    const breakdown = ['free', 'basic', 'pro'].map((plano) => {
      const count = planCounts.get(plano) ?? 0;
      const preco = priceMap.get(plano) ?? PLAN_PRICE[plano] ?? 0;
      return { plano, count, preco, total: count * preco };
    });

    // Churn estimado (barbearias inativas este mês)
    const churnMes = allBarbearias.filter(
      (b) =>
        b.planoStatus === 'cancelado' &&
        b.criadoEm >= new Date(now.getFullYear(), now.getMonth(), 1),
    ).length;

    return {
      historico,
      breakdown,
      churnMes,
      mrr: currentMrr,
      arr: currentMrr * 12,
    };
  }

  // ── Atividade global ──────────────────────────────────────────────────────

  async getActivity() {
    // Busca eventos recentes: novos cadastros + atualizações de plano
    const [recentSignups, recentMembers] = await Promise.all([
      this.prisma.barbearia.findMany({
        orderBy: { criadoEm: 'desc' },
        take: 5,
        select: { nome: true, slug: true, plano: true, criadoEm: true },
      }),
      this.prisma.membroBarbearia.findMany({
        orderBy: { criadoEm: 'desc' },
        take: 5,
        select: {
          perfil: true,
          criadoEm: true,
          barbearia: { select: { nome: true, slug: true } },
        },
      }),
    ]);

    const agora = new Date();
    function tempoRelativo(d: Date): string {
      const diff = Math.floor((agora.getTime() - d.getTime()) / 60000); // minutos
      if (diff < 60) return `${diff}min`;
      if (diff < 1440) return `${Math.floor(diff / 60)}h`;
      return `${Math.floor(diff / 1440)} dia(s)`;
    }

    const events = [
      ...recentSignups.map((b) => ({
        tipo: 'signup' as const,
        texto: `${b.nome} criou conta (plano ${b.plano})`,
        tempo: tempoRelativo(b.criadoEm),
        barbeariaSlug: b.slug,
      })),
      ...recentMembers
        .filter((m) => m.perfil === 'barbeiro')
        .map((m) => ({
          tipo: 'signup' as const,
          texto: `Novo barbeiro em ${m.barbearia.nome}`,
          tempo: tempoRelativo(m.criadoEm),
          barbeariaSlug: m.barbearia.slug,
        })),
    ]
      .sort((a, b) => {
        // ordena pelo tempo numérico
        const parse = (s: string) => {
          const n = parseInt(s);
          if (s.includes('dia')) return n * 1440;
          if (s.includes('h')) return n * 60;
          return n;
        };
        return parse(a.tempo) - parse(b.tempo);
      })
      .slice(0, 8);

    return events;
  }
}
