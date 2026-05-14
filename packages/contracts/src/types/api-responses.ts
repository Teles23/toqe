// Shapes de resposta da API — source of truth para frontend e backend.
// Tipos de UI derivados (initials, status calculado, etc.) ficam em cada feature.

// ---- Período (compartilhado por relatórios) ----

export type Periodo = "7d" | "30d" | "3m" | "6m" | "12m";

// ---- Barbeiro ----

export interface BarbeiroAPI {
  codigo: number;
  nome: string;
  email: string;
  telefone: string | null;
  avatarUrl: string | null;
  perfil: string;
  atendimentosHoje: number;
  atendimentosMes: number;
  faturamentoMes: number;
  ticketMedio: number;
}

// ---- Cliente ----

export interface ClienteAPI {
  codigo: number;
  nome: string;
  email: string;
  telefone: string | null;
  avatarUrl: string | null;
  perfil: string;
  totalVisitas: number;
  totalGasto: number;
  ticketMedio: number;
  ultimaVisita: string | null;
  servicoFav: string | null;
}

// ---- Serviço ----

export interface ServicoAPI {
  codigo: number;
  barCodigo: number;
  nome: string;
  precoBase: number | null;
  duracaoBase: number | null;
  ativo: boolean;
}

// ---- Agendamento ----

export interface AgendamentoAPI {
  codigo: number;
  inicio: string;
  fim: string;
  status: string;
  cliente: { codigo: number; nome: string; email: string } | null;
  barbeiro: { codigo: number; nome: string } | null;
  itens: { servico: { nome: string }; duracaoMin: number }[];
}

// ---- Relatórios ----

export interface FaturamentoItem {
  data: string;
  total: number;
}

export interface AgendamentosItem {
  data: string;
  concluido: number;
  cancelado: number;
  no_show: number;
}

export interface ServicoRelatorioItem {
  nome: string;
  quantidade: number;
  total: number;
}

export interface BarbeiroRelatorioItem {
  nome: string;
  faturamento: number;
  atendimentos: number;
  ticketMedio: number;
  avaliacao: number;
}

export interface HorarioPicoItem {
  hora: number;
  quantidade: number;
}
