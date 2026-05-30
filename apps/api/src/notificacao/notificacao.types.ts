// Payload armazenado na fila Bull/Redis — somente IDs, sem PII
export interface AgendamentoConfirmadoJob {
  agendamentoCodigo: number;
  clienteUsrCodigo?: number;
  barbeiroUsrCodigo?: number;
  barCodigo?: number;
}

// Dados enriquecidos buscados do DB pelo consumer — nunca persistidos na fila
export interface AgendamentoConfirmadoData {
  agendamentoCodigo: number;
  clienteNome: string;
  clienteEmail: string;
  barbeiroNome: string;
  barbeariaNome: string;
  inicio: string;
  fim: string;
  servicos: string[];
}

export interface ConviteEmailJob {
  email: string;
  conviteLink: string;
  barbeariaNome: string;
  perfil: string;
}
