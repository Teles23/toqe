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

// ---- Pessoa (visão unificada: TQE_USR + TQE_CONTATO) ----

export interface PessoaAPI {
  codigo: number;
  nome: string;
  /** "usuario" = TQE_USR (tem conta/login); "contato" = TQE_CONTATO (walk-in). */
  tipo: "usuario" | "contato";
  email: string | null;
  telefone: string | null;
  avatarUrl: string | null;
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

export type StatusAgendamento =
  | "pendente"
  | "confirmado"
  | "em_andamento"
  | "cancelado"
  | "concluido"
  | "no_show";

export interface AgendamentoAPI {
  codigo: number;
  inicio: string;
  fim: string;
  status: StatusAgendamento;
  cliente: {
    /** Código do usuário (TQE_USUARIO) ou contato (TQE_CONTATO). */
    usrCodigo: number;
    nome: string;
    telefone: string | null;
    /** "usuario" = tem conta/login; "contato" = walk-in sem conta. */
    tipo: "usuario" | "contato";
  } | null;
  barbeiro: {
    usrCodigo: number;
    nome: string;
    avatarUrl: string | null;
  } | null;
  itens: {
    codigo: number;
    servico: {
      codigo: number;
      nome: string;
      precoBase: number;
      duracaoBase: number;
    };
    preco: number;
    duracaoMin: number;
  }[];
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
