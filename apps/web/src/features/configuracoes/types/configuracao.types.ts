export type SecaoId =
  | "barbearia"
  | "horarios"
  | "notificacoes"
  | "plano"
  | "seguranca";

export interface HorarioDia {
  dia: string;
  aberto: boolean;
  abertura: string;
  fechamento: string;
}

export interface NotificacaoConfig {
  novoAgendamento: boolean;
  cancelamento: boolean;
  lembreteCliente: boolean;
  lembreteInternos: boolean;
  relatorioDiario: boolean;
  clienteNovo: boolean;
  avaliacaoRecebida: boolean;
  pagamentoRecebido: boolean;
}

export interface BarbeariaConfig {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  logoUrl?: string | null;
  /** Permissões concedidas aos barbeiros (definidas pelo dono). */
  barbeiroCriaServico?: boolean;
  barbeiroAlteraPreco?: boolean;
}

export interface Plano {
  id: string;
  nome: string;
  preco: number;
  atual: boolean;
  features: string[];
}
