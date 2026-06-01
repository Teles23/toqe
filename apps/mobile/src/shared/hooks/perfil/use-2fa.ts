import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/src/shared/api/api-client";

export interface TwoFaSetupResponse {
  qrCode: string; // data URL (base64 PNG)
}

/**
 * Gera QR code + secret para configurar 2FA.
 * Endpoint: POST /auth/2fa/setup
 *
 * Importante: o secret ainda NÃO está ativo após esta call — usuário
 * precisa escanear o QR no app autenticador e confirmar com `use2faEnable`.
 */
export function use2faSetup() {
  return useMutation({
    mutationFn: () => api.post<TwoFaSetupResponse>("/auth/2fa/setup"),
  });
}

/**
 * Ativa 2FA após o user confirmar o código TOTP do app autenticador.
 * Endpoint: POST /auth/2fa/enable
 *
 * onSuccess: invalida ['usuario-me'] (twoFaEnabled mudou).
 */
export function use2faEnable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      api.post<{ message: string }>("/auth/2fa/enable", { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuario-me"] });
    },
  });
}

/**
 * Desativa 2FA. Backend exige código TOTP atual para evitar que alguém
 * com acesso ao app desative sem ter o autenticador.
 * Endpoint: POST /auth/2fa/disable
 */
export function use2faDisable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      api.post<{ message: string }>("/auth/2fa/disable", { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuario-me"] });
    },
  });
}
