/** Campos mínimos para exibição de avatar em listas */
export const SELECT_USUARIO_COM_AVATAR = {
  codigo: true,
  nome: true,
  avatarUrl: true,
} as const;

/** Campos completos para listagem de membros/perfil */
export const SELECT_USUARIO_PERFIL = {
  codigo: true,
  nome: true,
  email: true,
  telefone: true,
  avatarUrl: true,
} as const;

/** Include para trazer apenas o preço dos itens de agendamento */
export const INCLUDE_ITENS_PRECO = {
  itens: { select: { preco: true } },
} as const;
