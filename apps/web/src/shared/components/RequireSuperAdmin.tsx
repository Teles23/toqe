"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/use-auth";

interface RequireSuperAdminProps {
  /** Fallback renderizado durante carregamento ou acesso negado. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Guarda client-side exclusiva para o super admin da plataforma.
 *
 * Verifica `user.superAdmin === true`. Qualquer outro usuário (mesmo
 * com perfil `admin` de uma barbearia) é redirecionado para `/dashboard`.
 *
 * Importante: esta é uma guarda de UX. A autorização real acontece no
 * backend via `SuperAdminGuard` em todas as rotas `/admin/*`.
 */
export function RequireSuperAdmin({
  fallback = null,
  children,
}: RequireSuperAdminProps): React.ReactNode {
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthorized = !loading && user?.superAdmin === true;
  const shouldRedirect = !loading && !isAuthorized;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/dashboard");
    }
  }, [shouldRedirect, router]);

  if (loading || !isAuthorized) {
    return fallback;
  }

  return children;
}
