"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/hooks/use-auth";

/**
 * Hook de logout: chama `useAuth().logout()` e limpa todo o cache do
 * TanStack Query (queries autenticadas viram lixo após logout).
 */
export function useLogout() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: () => logout(),
    onSettled: () => {
      queryClient.clear();
    },
  });
}
