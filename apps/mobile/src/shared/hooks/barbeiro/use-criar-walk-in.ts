import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";
import type { CriarClienteRapidoInput } from "@toqe/contracts";

export interface CriarWalkInInput {
  /**
   * Dados do cliente novo. Se omitido, usar `clienteId` existente.
   * `email` é opcional no encaixe — o servidor gera um único quando ausente.
   */
  cliente?: Omit<CriarClienteRapidoInput, "email"> & { email?: string };
  /** Cliente já existente — passado em vez de criar um novo. */
  clienteId?: number;
  barbeiroId: number;
  servicosIds: number[];
}

/**
 * Cria um walk-in numa ÚNICA chamada atômica ao backend
 * (`POST /agendamentos/walk-in`): o servidor cria/reaproveita o cliente e o
 * agendamento na mesma transação. Se o agendamento falha, o cliente não é
 * persistido — sem cliente órfão (o bug do fluxo anterior de duas chamadas).
 *
 * Reusa `criarClienteRapidoSchema` de `@toqe/contracts`. `inicio` é definido
 * pelo servidor (agora).
 *
 * onSuccess: invalida ['fila'] e ['agendamentos'] para refletir o novo walk-in.
 */
export function useCriarWalkIn() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation<AgendamentoResponse, Error, CriarWalkInInput>({
    mutationFn: (input) => {
      if (!input.cliente && !input.clienteId) {
        throw new Error("Forneça `cliente` (criar novo) ou `clienteId`");
      }

      return tenantApi(barbearia!.codigo).post<AgendamentoResponse>(
        "/agendamentos/walk-in",
        {
          barbeiroId: input.barbeiroId,
          servicosIds: input.servicosIds,
          ...(input.clienteId
            ? { clienteId: input.clienteId }
            : { cliente: input.cliente }),
        },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fila"] });
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
    },
  });
}
