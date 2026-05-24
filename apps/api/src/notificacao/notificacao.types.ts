export interface AgendamentoConfirmadoJob {
  agendamentoCodigo: number;
  clienteNome: string;
  clienteEmail: string;
  clienteUsrCodigo?: number;
  barbeiroUsrCodigo?: number;
  barbeiroNome: string;
  barbeariaNome: string;
  inicio: string; // ISO string
  fim: string; // ISO string
  servicos: string[];
}
