export type Periodo = "7d" | "30d" | "3m" | "6m" | "12m";

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

export interface ServicoItem {
  nome: string;
  quantidade: number;
  total: number;
}

export interface BarbeiroItem {
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
