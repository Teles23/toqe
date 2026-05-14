type WithPreco = { preco: number | string | { toNumber(): number } };
type WithItens = { itens: WithPreco[] };

export function somarItens(itens: WithPreco[]): number {
  return itens.reduce((acc, it) => acc + Number(it.preco), 0);
}

export function somarAgendamentos(agendamentos: WithItens[]): number {
  return agendamentos.reduce((acc, ag) => acc + somarItens(ag.itens), 0);
}
