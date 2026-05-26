export enum StatusAgendamento {
  PENDENTE = 'pendente',
  CONFIRMADO = 'confirmado',
  EM_ANDAMENTO = 'em_andamento',
  CANCELADO = 'cancelado',
  CONCLUIDO = 'concluido',
  NO_SHOW = 'no_show',
}

/** Agendamentos que já tiveram desfecho (não vão mais mudar) */
export const STATUSES_ENCERRADOS = [
  StatusAgendamento.CONCLUIDO,
  StatusAgendamento.CANCELADO,
  StatusAgendamento.NO_SHOW,
] as const;

/** Agendamentos que contam para métricas de volume/faturamento */
export const STATUSES_ATIVOS = [
  StatusAgendamento.CONCLUIDO,
  StatusAgendamento.CONFIRMADO,
] as const;

/** Agendamentos que bloqueiam o slot da agenda */
export const STATUSES_BLOQUEANTES = [
  StatusAgendamento.CONFIRMADO,
  StatusAgendamento.PENDENTE,
  StatusAgendamento.EM_ANDAMENTO,
] as const;
