/**
 * useCriarBloqueio — cria um bloqueio manual na agenda do barbeiro.
 *
 * Endpoint: POST /agenda/bloqueios/:barbeiroId
 * Header:   x-tenant-id (barCodigo)
 *
 * Calcula `inicio` e `fim` a partir do momento atual e da duração (minutos).
 * Arredonda o `inicio` para o próximo múltiplo de 15 minutos.
 *
 * Após sucesso, invalida a query de agendamentos do dia para forçar refetch.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CriarBloqueioInput {
  /** Duração em minutos (15 | 30 | 45 | 60 | 90 | 120). */
  duration: number;
  /** Motivo legível (Almoço, Limpeza, etc.). */
  motivo?: string;
  /** Se verdadeiro, salva como bloqueio recorrente semanal. */
  recorrente?: boolean;
}

// ─── Helper: arredonda para próximo múltiplo de 15min ────────────────────────

export function roundToNext15(now: Date): Date {
  const ms = 15 * 60 * 1000;
  return new Date(Math.ceil(now.getTime() / ms) * ms);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCriarBloqueio() {
  const { barbearia, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      duration,
      motivo,
      recorrente,
    }: CriarBloqueioInput) => {
      if (!barbearia || !user) throw new Error("Não autenticado");

      const inicio = roundToNext15(new Date());
      const fim = new Date(inicio.getTime() + duration * 60 * 1000);

      return tenantApi(barbearia.codigo).post(
        `/agenda/bloqueios/${user.codigo}`,
        {
          inicio: inicio.toISOString(),
          fim: fim.toISOString(),
          motivo: motivo || undefined,
          recorrente: recorrente || undefined,
        },
      );
    },
    onSuccess: () => {
      // Invalida o cache da agenda para o dia corrente
      void queryClient.invalidateQueries({
        queryKey: ["agendamentos"],
      });
    },
  });
}
