/**
 * Tipos do agregado de dashboard.
 *
 * O backend ainda **não expõe** o endpoint `/dashboard/overview` — o
 * service em `../services/dashboard.service.ts` retorna dados mockados
 * com `setTimeout` para simular latência. Quando o endpoint existir,
 * esses tipos deverão migrar para `@toqe/contracts/schemas/dashboard`
 * (Zod schemas) e o service vai apenas chamar `api.get(...)`.
 */

export type StatusCor = "success" | "info" | "warning" | "error";

export interface KpiCard {
  label: string;
  value: number | string;
  unit?: string;
  status: "success" | "info" | "warning";
  subtitle?: string;
  trend?: { value: number; label: string };
  animate?: boolean;
}

export interface FaturamentoPonto {
  dia: string;
  valor: number;
}

export interface ServicoPopular {
  nome: string;
  quantidade: number;
  receita: number;
  pct: number;
}

export interface AtividadeItem {
  tipo:
    | "confirmado"
    | "novo"
    | "atrasado"
    | "encaixe"
    | "concluido"
    | "avaliacao";
  texto: string;
  tempo: string;
  cor: string;
}

export interface BarbeiroStatus {
  nome: string;
  initial: string;
  estado: "active" | "idle";
  cliente: string | null;
  servico: string | null;
  pct: number;
}

export interface LiveMetric {
  label: string;
  value: string;
  color: string;
}

export interface DashboardOverview {
  /** KPIs de topo (4 cards). */
  kpis: KpiCard[];
  /** Métricas ao vivo no header do bloco "Status ao vivo". */
  liveMetrics: LiveMetric[];
  /** Status atual dos barbeiros (operação). */
  barbeiros: BarbeiroStatus[];
  /** Série de faturamento (semana ou mês). */
  faturamento: {
    semana: FaturamentoPonto[];
    mes: FaturamentoPonto[];
  };
  /** Top serviços da semana. */
  servicos: ServicoPopular[];
  /** Feed de atividade recente. */
  atividade: AtividadeItem[];
}
