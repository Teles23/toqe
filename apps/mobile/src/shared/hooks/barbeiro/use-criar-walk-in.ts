import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";
import type { CriarContatoInput } from "@toqe/contracts";

export interface CriarWalkInInput {
  /** Novo contato anônimo (TQE_CONTATO). Exatamente um de: contato, contatoId, clienteId. */
  contato?: CriarContatoInput;
  /** Contato já existente (TQE_CONTATO). */
  contatoId?: number;
  /** Usuário autenticável já existente (TQE_USR). */
  clienteId?: number;
  barbeiroId: number;
  servicosIds: number[];
}

/**
 * Cria um walk-in via `POST /agendamentos/walk-in`.
 * O servidor persiste o contato como TQE_CONTATO (sem criar conta de usuário).
 *
 * onSuccess: invalida ['fila'] e ['agendamentos'].
 */
export function useCriarWalkIn() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation<AgendamentoResponse, Error, CriarWalkInInput>({
    mutationFn: (input) => {
      const options = [input.contato, input.contatoId, input.clienteId].filter(
        (v) => v != null,
      );
      if (options.length !== 1) {
        throw new Error(
          "Forneça exatamente um de: contato (novo), contatoId (existente) ou clienteId (usuário)",
        );
      }

      return tenantApi(barbearia!.codigo).post<AgendamentoResponse>(
        "/agendamentos/walk-in",
        {
          barbeiroId: input.barbeiroId,
          servicosIds: input.servicosIds,
          ...(input.contato && { contato: input.contato }),
          ...(input.contatoId && { contatoId: input.contatoId }),
          ...(input.clienteId && { clienteId: input.clienteId }),
        },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fila"] });
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
    },
  });
}
