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
}

export interface Plano {
  id: string;
  nome: string;
  preco: number;
  atual: boolean;
  features: string[];
}

export interface SessaoAtiva {
  dispositivo: string;
  ultimo: string;
  atual: boolean;
}
