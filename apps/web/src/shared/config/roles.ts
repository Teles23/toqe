/**
 * Perfis (roles) e matriz de autorização.
 *
 * Re-exporta o enum `Perfil` do `@toqe/shared` (single source of truth)
 * e adiciona a matriz `ROUTE_ROLES` específica do frontend para guarda
 * client-side via `<RequireRole>`.
 */

import { Perfil } from "@toqe/shared";

export { Perfil };

/**
 * Matriz de permissões: quais perfis podem acessar cada rota privada.
 * Consumida por `<RequireRole>` (client-side guard de UX).
 *
 * A autorização "de verdade" continua server-side via `@nestjs/passport`
 * + `RolesGuard` no backend — esta matriz é só para esconder UIs.
 */
export const ROUTE_ROLES: Record<string, readonly Perfil[]> = {
  "/dashboard": [
    Perfil.SUPER_ADMIN,
    Perfil.DONO,
    Perfil.GERENTE,
    Perfil.BARBEIRO,
    Perfil.RECEPCIONISTA,
  ],
  "/agenda": [
    Perfil.SUPER_ADMIN,
    Perfil.DONO,
    Perfil.GERENTE,
    Perfil.BARBEIRO,
    Perfil.RECEPCIONISTA,
  ],
  "/servicos": [Perfil.SUPER_ADMIN, Perfil.DONO, Perfil.GERENTE],
  "/barbeiros": [Perfil.SUPER_ADMIN, Perfil.DONO, Perfil.GERENTE],
  "/clientes": [
    Perfil.SUPER_ADMIN,
    Perfil.DONO,
    Perfil.GERENTE,
    Perfil.RECEPCIONISTA,
  ],
  "/relatorios": [Perfil.SUPER_ADMIN, Perfil.DONO, Perfil.GERENTE],
  "/configuracoes": [Perfil.SUPER_ADMIN, Perfil.DONO],
};

/**
 * Retorna `true` se algum dos perfis informados pode acessar a rota.
 * Se a rota não está na matriz, retorna `true` (rota pública ou ainda
 * não categorizada — não bloqueia para evitar falsos negativos).
 */
export function canAccessRoute(pathname: string, perfis: Perfil[]): boolean {
  const allowed = ROUTE_ROLES[pathname];
  if (!allowed) return true;
  return perfis.some((p) => allowed.includes(p));
}
