export interface UnidadeResumo {
  barCodigo: number;
  nome: string;
  faturamentoHoje: number;
  faturamentoMes: number;
  agendamentosHoje: number;
  concluidos: number;
}

export interface RedeTotais {
  faturamentoHoje: number;
  faturamentoMes: number;
  agendamentosHoje: number;
  concluidos: number;
}

export interface RedeOverview {
  unidades: UnidadeResumo[];
  totais: RedeTotais;
}
