/**
 * Serialização da resposta de agendamento para o contrato público.
 *
 * O Prisma retorna as relações `cliente`/`barbeiro` com a PK `codigo` (Usuario)
 * e o `cliente.email` (usado internamente p/ notificações e checks de
 * ownership). O contrato `AgendamentoResponse` (@toqe/shared) — que web e mobile
 * consomem — expõe esses participantes como `usrCodigo` + `telefone`
 * (cliente) / `avatarUrl` (barbeiro), sem `email`.
 *
 * Sem essa tradução o mobile recebia `cliente.usrCodigo === undefined` (lia
 * `codigo`), quebrando funcionalidades como "Ver histórico" (busca por id) e o
 * ligar/WhatsApp do detalhe (lia `telefone`, que nem era selecionado).
 *
 * Aplicado na camada do controller (saída), preservando o objeto cru do Prisma
 * para uso interno do service.
 */

type ClienteRel =
  | { codigo: number; nome: string; telefone: string | null }
  | null
  | undefined;

type BarbeiroRel =
  | { codigo: number; nome: string; avatarUrl: string | null }
  | null
  | undefined;

function mapCliente(c: ClienteRel) {
  if (!c) return c;
  return { usrCodigo: c.codigo, nome: c.nome, telefone: c.telefone ?? null };
}

function mapBarbeiro(b: BarbeiroRel) {
  if (!b) return b;
  return { usrCodigo: b.codigo, nome: b.nome, avatarUrl: b.avatarUrl ?? null };
}

type ItemRel = { preco?: unknown; duracao?: unknown }[] | null | undefined;

/**
 * Normaliza `preco`/`duracao` dos itens para number. O Prisma serializa
 * `Decimal` como string no JSON (o contrato `AgendamentoItemResponse.preco` é
 * `number`) — sem isso o front faz `0 + "35"` = `"035"`.
 */
function mapItens(itens: ItemRel) {
  if (!itens) return itens;
  return itens.map((i) => ({
    ...i,
    ...(i.preco != null ? { preco: Number(i.preco) } : {}),
    ...(i.duracao != null ? { duracao: Number(i.duracao) } : {}),
  }));
}

/**
 * Mapeia um agendamento (ou `null`) para o shape público. `email` do cliente é
 * descartado (não faz parte do contrato). Robusto a `cliente`/`barbeiro`
 * ausentes para não quebrar em payloads parciais.
 */
export function serializeAgendamento<
  T extends {
    cliente?: ClienteRel;
    barbeiro?: BarbeiroRel;
    itens?: ItemRel;
  } | null,
>(ag: T) {
  if (!ag) return ag;
  return {
    ...ag,
    cliente: mapCliente(ag.cliente),
    barbeiro: mapBarbeiro(ag.barbeiro),
    itens: mapItens(ag.itens),
  };
}

export function serializeAgendamentos<
  T extends { cliente?: ClienteRel; barbeiro?: BarbeiroRel; itens?: ItemRel },
>(list: T[]) {
  return list.map((a) => serializeAgendamento(a));
}
