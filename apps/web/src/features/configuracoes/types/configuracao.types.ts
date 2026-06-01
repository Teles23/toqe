export type SecaoId =
  | "barbearia"
  | "horarios"
  | "notificacoes"
  | "plano"
  | "seguranca"
  | "qrcode"
  | "api-keys";

export interface HorarioDia {
  diaSemana: number; // 0=Dom, 1=Seg, ..., 6=Sáb
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
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
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

export interface ApiKey {
  codigo: number;
  barCodigo: number;
  nome: string;
  keyPrefix: string;
  ativo: boolean;
  criadoEm: string;
  ultimoUsoEm: string | null;
}
