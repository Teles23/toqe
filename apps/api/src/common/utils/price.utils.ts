import { Prisma } from '../../generated/prisma';

export function somarItens(itens: { preco: Prisma.Decimal }[]): number {
  return itens.reduce((acc, it) => acc + it.preco.toNumber(), 0);
}

export function somarAgendamentos(
  agendamentos: { itens: { preco: Prisma.Decimal }[] }[],
): number {
  return agendamentos.reduce((acc, ag) => acc + somarItens(ag.itens), 0);
}
