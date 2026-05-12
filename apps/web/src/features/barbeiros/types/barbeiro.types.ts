export type BarbeiroEstado = "active" | "idle" | "off";

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

export interface Barbeiro extends BarbeiroAPI {
  initial: string;
  estado: BarbeiroEstado;
  especialidade: string;
  avaliacao: number;
  horarioEntrada: string;
  diasSemana: string[];
  clienteAtual?: string;
  servicoAtual?: string;
  progressoAtual?: number;
}
