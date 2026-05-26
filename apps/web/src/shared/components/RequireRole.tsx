"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/use-auth";
import { ROUTES } from "@/shared/config/routes";
import { type Perfil } from "@/shared/config/roles";

interface RequireRoleProps {
  /** Lista de perfis autorizados. Pelo menos um precisa fazer match. */
  roles: readonly Perfil[];
  /**
   * Para onde redirecionar quando o usuário não tiver permissão.
   * Default: `/dashboard` (perfis logados sem acesso a esta tela
   * voltam à raiz autenticada). Para "esconder mas não redirecionar",
   * passe `null` e use `fallback`.
   */
  redirectTo?: string | null;
  /** Fallback renderizado enquanto `loading` ou quando não autorizado. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Guarda client-side por perfil.
 *
 * Uso típico em uma página privada:
 * ```tsx
 * import { RequireRole } from "@/shared/components/RequireRole";
 * import { PERFIL } from "@/shared/config/roles";
 *
 * export default function ConfiguracoesPage() {
 *   return (
 *     <RequireRole roles={[PERFIL.ADMIN]}>
 *       <SuaUI />
 *     </RequireRole>
 *   );
 * }
 * ```
 *
 * Comportamento:
 * 1. Enquanto `useAuth().loading === true`, renderiza `fallback` (ou
 *    `null` se não passado) — evita flash de UI antes da sessão carregar.
 * 2. Se autenticado e `perfil` autorizado, renderiza `children`.
 * 3. Se autenticado mas sem perfil autorizado, redireciona para
 *    `redirectTo` (default `/dashboard`) — ou apenas renderiza
 *    `fallback` se `redirectTo === null`.
 * 4. Não autenticado nunca chega aqui (o `proxy.ts` já redireciona
 *    para `/login`).
 *
 * Importante: esta é uma guarda de UX. A autorização server-side
 * acontece no backend (`@nestjs/passport` + `RolesGuard`). Não confie
 * neste componente para esconder dados sensíveis — sempre exigir o
 * mesmo controle no backend.
 */
export function RequireRole({
  roles,
  redirectTo = ROUTES.DASHBOARD,
  fallback = null,
  children,
}: RequireRoleProps): React.ReactNode {
  const router = useRouter();
  const { perfil, loading } = useAuth();

  const isAuthorized = !loading && perfil !== null && roles.includes(perfil);
  const shouldRedirect = !loading && !isAuthorized && redirectTo !== null;

  // Redireciona em efeito (não em render) quando não autorizado.
  useEffect(() => {
    if (shouldRedirect && redirectTo) {
      router.replace(redirectTo);
    }
  }, [shouldRedirect, redirectTo, router]);

  if (loading || !isAuthorized) {
    return fallback;
  }

  return children;
}
