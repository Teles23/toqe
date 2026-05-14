import type { DashboardOverview } from "../types/dashboard.types";

const MOCK: DashboardOverview = {
  kpis: [
    {
      label: "Faturamento hoje",
      value: 890,
      unit: "R$",
      status: "success",
      trend: { value: 12, label: "vs ontem" },
    },
    {
      label: "Agendamentos",
      value: 14,
      status: "info",
      subtitle: "9 concluídos · 3 ativos",
    },
    {
      label: "Ticket médio",
      value: 63,
      unit: "R$",
      status: "warning",
      trend: { value: 5, label: "vs semana" },
    },
    {
      label: "Avaliação média",
      value: "4.8",
      unit: "★",
      status: "success",
      subtitle: "Baseado em 38 avaliações",
      animate: false,
    },
  ],
  liveMetrics: [
    { label: "Barbeiros ativos", value: "3", color: "var(--status-success)" },
    { label: "Próximo horário", value: "10:30", color: "var(--text-primary)" },
    { label: "Aguardando", value: "2", color: "var(--status-warning)" },
    { label: "Tempo médio", value: "38min", color: "var(--status-info)" },
  ],
  barbeiros: [
    {
      nome: "Carlos",
      initial: "C",
      estado: "active",
      cliente: "João Silva",
      servico: "Corte",
      pct: 68,
    },
    {
      nome: "Lucas",
      initial: "L",
      estado: "idle",
      cliente: null,
      servico: null,
      pct: 0,
    },
    {
      nome: "Felipe",
      initial: "F",
      estado: "active",
      cliente: "Ana Costa",
      servico: "Sobrancelha",
      pct: 45,
    },
  ],
  faturamento: {
    semana: [
      { dia: "Seg", valor: 420 },
      { dia: "Ter", valor: 580 },
      { dia: "Qua", valor: 390 },
      { dia: "Qui", valor: 710 },
      { dia: "Sex", valor: 890 },
      { dia: "Sáb", valor: 1240 },
      { dia: "Dom", valor: 0 },
    ],
    mes: [
      { dia: "Sem 1", valor: 3200 },
      { dia: "Sem 2", valor: 4100 },
      { dia: "Sem 3", valor: 3850 },
      { dia: "Sem 4", valor: 4230 },
    ],
  },
  servicos: [
    { nome: "Corte", quantidade: 48, receita: 1440, pct: 100 },
    { nome: "Corte + Barba", quantidade: 32, receita: 1760, pct: 67 },
    { nome: "Barba", quantidade: 21, receita: 630, pct: 44 },
    { nome: "Sobrancelha", quantidade: 15, receita: 300, pct: 31 },
    { nome: "Pigmentação", quantidade: 8, receita: 720, pct: 17 },
  ],
  atividade: [
    {
      tipo: "confirmado",
      texto: "Pedro Santos confirmou 09:00",
      tempo: "2min",
      cor: "var(--status-success)",
    },
    {
      tipo: "novo",
      texto: "Novo agendamento — Rafael 14:00",
      tempo: "8min",
      cor: "var(--status-info)",
    },
    {
      tipo: "atrasado",
      texto: "João Silva atrasado — 08:30",
      tempo: "12min",
      cor: "var(--status-error)",
    },
    {
      tipo: "encaixe",
      texto: "Horário encaixado — Carlos 13:00",
      tempo: "18min",
      cor: "var(--status-warning)",
    },
    {
      tipo: "concluido",
      texto: "Diego Mendes — Corte concluído",
      tempo: "34min",
      cor: "var(--status-success)",
    },
    {
      tipo: "avaliacao",
      texto: "Marco Oliveira deixou 5 estrelas",
      tempo: "1h",
      cor: "var(--status-warning)",
    },
  ],
};

/**
 * Busca o overview do dashboard (MOCK).
 */
export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK;
}
