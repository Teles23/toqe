"use client";

import { useMutation } from "@tanstack/react-query";
import { requestChangePassword } from "@/features/auth/services/auth.service";

export function useChangePassword() {
  return useMutation({
    mutationKey: ["auth", "change-password"],
    mutationFn: ({
      senhaAtual,
      novaSenha,
    }: {
      senhaAtual: string;
      novaSenha: string;
    }) => requestChangePassword(senhaAtual, novaSenha),
  });
}
