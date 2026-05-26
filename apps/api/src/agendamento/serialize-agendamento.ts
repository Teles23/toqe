/**
 * Serialização da resposta de agendamento para o contrato público.
 *
 * O Prisma pode retornar `cliente` (TQE_USUARIO) ou `contato` (TQE_CONTATO)
 * dependendo do tipo de agendamento. O contrato `AgendamentoResponse`
 * (@toqe/shared) expõe sempre um campo `cliente` unificado com `tipo`
 * discriminador, sem expor o e-mail para o frontend.
 *
 * Sem essa tradução o mobile recebia `cliente.usrCodigo === undefined` (lia
 * `codigo`), quebrando funcionalidades como "Ver histórico" e ligar/WhatsApp.
 *
 * Aplicado na camada do controller (saída), preservando o objeto cru do Prisma
 * para uso interno do service.
 */

type UsuarioRel =
  | { codigo: number; nome: string; email: string; telefone: string | null }
  | null
  | undefined;

type ContatoRel =
  | { codigo: number; nome: string; telefone: string | null }
  | null
  | undefined;

type BarbeiroRel =
  | { codigo: number; nome: string; avatarUrl: string | null }
  | null
  | undefined;

function mapCliente(usuario: UsuarioRel, contato: ContatoRel) {
  if (usuario) {
    return {
      usrCodigo: usuario.codigo,
      nome: usuario.nome,
      telefone: usuario.telefone ?? null,
      tipo: 'usuario' as const,
      email: usuario.email,
    };
  }
  if (contato) {
    return {
      usrCodigo: contato.codigo,
      nome: contato.nome,
      telefone: contato.telefone ?? null,
      tipo: 'contato' as const,
      email: null,
    };
  }
  return null;
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
 * Mapeia um agendamento (ou `null`) para o shape público. Unifica `cliente`
 * (TQE_USUARIO) e `contato` (TQE_CONTATO) num único campo `cliente` com `tipo`.
 * `email` do cliente (TQE_USUARIO) é descartado no response.
 */
export function serializeAgendamento<
  T extends {
    cliente?: UsuarioRel;
    contato?: ContatoRel;
    barbeiro?: BarbeiroRel;
    itens?: ItemRel;
  } | null,
>(ag: T) {
  if (!ag) return ag;
  const { contato: _contato, ...rest } = ag as typeof ag & {
    contato?: ContatoRel;
  };
  return {
    ...rest,
    cliente: mapCliente(ag.cliente, _contato),
    barbeiro: mapBarbeiro(ag.barbeiro),
    itens: mapItens(ag.itens),
  };
}

export function serializeAgendamentos<
  T extends {
    cliente?: UsuarioRel;
    contato?: ContatoRel;
    barbeiro?: BarbeiroRel;
    itens?: ItemRel;
  },
>(list: T[]) {
  return list.map((a) => serializeAgendamento(a));
}
