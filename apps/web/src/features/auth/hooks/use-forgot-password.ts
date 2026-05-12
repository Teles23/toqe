"use client";

import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "@/features/auth/services/auth.service";

interface ForgotPasswordInput {
  email: string;
}

/**
 * Hook de recuperação de senha. Atualmente é um stub que delega ao
 * `requestPasswordReset` (que aguarda 1s e retorna sucesso) — o
 * endpoint real será conectado quando estiver disponível na API.
 */
export function useForgotPassword() {
  return useMutation({
    mutationKey: ["auth", "forgot-password"],
    mutationFn: ({ email }: ForgotPasswordInput) => requestPasswordReset(email),
  });
}
