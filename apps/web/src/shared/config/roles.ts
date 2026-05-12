/**
 * Perfis (roles) de usuário em uma barbearia.
 * Espelha o enum `Perfil` do backend (apps/api/prisma/schema.prisma).
 *
 * Será usado para RBAC em `proxy.ts` (server-side) e no componente
 * `<RequireRole>` (client-side) — a ser introduzido em sub-PR seguinte
 * desta mesma Fase 3.
 */
export const PERFIL = {
  ADMIN: "ADMIN",
  GERENTE: "GERENTE",
  BARBEIRO: "BARBEIRO",
  RECEPCAO: "RECEPCAO",
} as const;

export type Perfil = (typeof PERFIL)[keyof typeof PERFIL];

/**
 * Matriz de permissões: quais perfis podem acessar cada rota privada.
 * Usado pelo `proxy.ts` para RBAC server-side.
 */
export const ROUTE_ROLES: Record<string, readonly Perfil[]> = {
  "/dashboard": [
    PERFIL.ADMIN,
    PERFIL.GERENTE,
    PERFIL.BARBEIRO,
    PERFIL.RECEPCAO,
  ],
  "/agenda": [PERFIL.ADMIN, PERFIL.GERENTE, PERFIL.BARBEIRO, PERFIL.RECEPCAO],
  "/servicos": [PERFIL.ADMIN, PERFIL.GERENTE],
  "/barbeiros": [PERFIL.ADMIN, PERFIL.GERENTE],
  "/clientes": [PERFIL.ADMIN, PERFIL.GERENTE, PERFIL.RECEPCAO],
  "/relatorios": [PERFIL.ADMIN, PERFIL.GERENTE],
  "/configuracoes": [PERFIL.ADMIN],
};

/**
 * Retorna `true` se algum dos perfis informados pode acessar a rota.
 * Se a rota não está na matriz, retorna `true` (rota pública ou ainda não
 * categorizada — não bloqueia para evitar falsos negativos).
 */
export function canAccessRoute(pathname: string, perfis: Perfil[]): boolean {
  const allowed = ROUTE_ROLES[pathname];
  if (!allowed) return true;
  return perfis.some((p) => allowed.includes(p));
}
