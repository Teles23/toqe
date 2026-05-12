"use client";

import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/shared/hooks/use-auth";
import type { LoginInput } from "@/features/auth/schemas";

/**
 * Hook de login: encapsula a chamada `useAuth().login()` em um
 * `useMutation` do TanStack Query. Componentes consomem `mutate`,
 * `isPending`, `error` etc. sem precisar gerenciar `useState`.
 *
 * O service (`auth.service.ts`) e o estado global (AuthProvider) já
 * lidam com BFF + cookies + fetch de `/usuarios/me`. Este hook é
 * apenas a "casca" ergonômica para a UI.
 */
export function useLogin() {
  const { login } = useAuth();

  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: ({ email, senha }: LoginInput) => login(email, senha),
  });
}
