/**
 * Mapa central de rotas do app `web`.
 *
 * Use estas constantes em vez de strings cruas em `<Link>`, `router.push`,
 * redirecionamentos e em `proxy.ts` para evitar typos e facilitar refactor.
 */
export const ROUTES = {
  // Públicas
  LANDING: "/",
  LOGIN: "/login",
  ONBOARDING: "/onboarding",
  RESET_PASSWORD: "/reset-password",

  // Privadas (dashboard)
  DASHBOARD: "/dashboard",
  AGENDA: "/agenda",
  SERVICOS: "/servicos",
  BARBEIROS: "/barbeiros",
  CLIENTES: "/clientes",
  RELATORIOS: "/relatorios",
  CONFIGURACOES: "/configuracoes",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

/** Conjunto de rotas públicas (sem necessidade de autenticação). */
export const PUBLIC_ROUTES = new Set<string>([
  ROUTES.LANDING,
  ROUTES.LOGIN,
  ROUTES.ONBOARDING,
  ROUTES.RESET_PASSWORD,
]);

/** Conjunto de rotas privadas que exigem login. */
export const PRIVATE_ROUTES = new Set<string>([
  ROUTES.DASHBOARD,
  ROUTES.AGENDA,
  ROUTES.SERVICOS,
  ROUTES.BARBEIROS,
  ROUTES.CLIENTES,
  ROUTES.RELATORIOS,
  ROUTES.CONFIGURACOES,
]);

/** Verifica se uma rota é pública. Considera prefixos para grupos como /api/. */
export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  // Bypass para assets e BFF
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return true;
  }
  return false;
}
