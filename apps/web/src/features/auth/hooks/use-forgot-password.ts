"use client";

import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "@/features/auth/services/auth.service";

interface ForgotPasswordInput {
  email: string;
}

/** Hook de recuperação de senha — delega ao BFF → API. */
export function useForgotPassword() {
  return useMutation({
    mutationKey: ["auth", "forgot-password"],
    mutationFn: ({ email }: ForgotPasswordInput) => requestPasswordReset(email),
  });
}
