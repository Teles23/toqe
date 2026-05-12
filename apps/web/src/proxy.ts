import { NextRequest, NextResponse } from "next/server";
import { isPublicRoute } from "@/shared/config/routes";

/**
 * Proxy / middleware (Next.js 16 convention).
 *
 * Responsabilidade: bloquear rotas privadas para visitantes anônimos
 * (sem cookie `access_token`) e redirecionar para `/login` preservando
 * o `redirect` na query string.
 *
 * RBAC por perfil (admin / gerente / barbeiro / recepção) **não é**
 * aplicado aqui. O motivo: o `perfil` do usuário é por-barbearia
 * (multi-tenant) e não está no JWT — ele vem do endpoint `/usuarios/me`
 * após login e é mantido no `AuthProvider`. A guarda fina de perfil
 * acontece client-side via `<RequireRole>` em
 * `@/shared/components/RequireRole`, consumindo `useAuth().perfil` e
 * a matriz `ROUTE_ROLES` de `@/shared/config/roles`.
 *
 * O backend é a fonte da verdade: toda chamada de API ainda é validada
 * por `JwtAuthGuard` + `RolesGuard` no NestJS. O `RequireRole`
 * client-side só evita renderizar UIs que o usuário sabidamente não
 * deveria ver (UX), não substitui a autorização server-side.
 */
export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Rota privada exige cookie de access_token presente. A validação
  // criptográfica do token acontece nas chamadas à API (NestJS).
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica em todas as rotas exceto assets estáticos do Next.js.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
