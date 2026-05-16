"use client";

import { useMutation } from "@tanstack/react-query";
import { requestResetPassword } from "@/features/auth/services/auth.service";

export function useResetPassword() {
  return useMutation({
    mutationKey: ["auth", "reset-password"],
    mutationFn: ({ token, novaSenha }: { token: string; novaSenha: string }) =>
      requestResetPassword(token, novaSenha),
  });
}
