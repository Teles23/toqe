export interface AdminTenant {
  codigo: number;
  nome: string;
  slug: string;
  cidade: string | null;
  plano: "free" | "basic" | "pro";
  planoStatus: "ativo" | "inativo" | "suspenso";
  ativo: boolean;
  criadoEm: string;
  totalBarbeiros: number;
  totalAgdMes: number;
  mrr: number;
  ultimaAtividade: string | null;
  logoUrl: string | null;
}

export interface AdminMetrics {
  mrr: number;
  arr: number;
  totalTenants: number;
  activeTenants: number;
  totalBarbeiros: number;
  totalAgdMes: number;
}

export interface AdminRevenueMonth {
  mes: string;
  mrr: number;
}

export interface AdminRevenuePlan {
  plano: string;
  count: number;
  preco: number;
  total: number;
}

export interface AdminRevenue {
  historico: AdminRevenueMonth[];
  breakdown: AdminRevenuePlan[];
  churnMes: number;
  mrr: number;
  arr: number;
}

export interface AdminActivityItem {
  tipo: "signup" | "upgrade" | "churn" | "payment" | "alert";
  texto: string;
  tempo: string;
  barbeariaSlug: string | null;
}

export type AdminRoute = "overview" | "barbearias" | "receita" | "health";
