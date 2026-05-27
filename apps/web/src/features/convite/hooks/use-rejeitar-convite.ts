"use client";

import { useMutation } from "@tanstack/react-query";
import { requestRejeitarConvite } from "@/features/convite/services/convite.service";

/**
 * Rejeita um convite de barbearia — remove o token no backend
 * (`DELETE /api/convite/:token` via BFF). Não cria conta nem vínculo.
 * Idempotente.
 */
export function useRejeitarConvite() {
  return useMutation<void, Error, string>({
    mutationKey: ["convite", "rejeitar"],
    mutationFn: (token) => requestRejeitarConvite(token),
  });
}
