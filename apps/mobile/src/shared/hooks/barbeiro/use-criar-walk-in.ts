import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { AgendamentoResponse } from "@toqe/shared";
import type { CriarClienteRapidoInput } from "@toqe/contracts";

interface ClienteResponse {
  codigo: number;
  nome: string;
  email: string;
}

export interface CriarWalkInInput {
  /** Dados do cliente novo. Se omitido, usar `clienteId` existente. */
  cliente?: CriarClienteRapidoInput;
  /** Cliente já existente — passado em vez de criar um novo. */
  clienteId?: number;
  barbeiroId: number;
  servicosIds: number[];
}

/**
 * Orquestra a criação de um walk-in:
 *   1. Se `cliente` foi passado: POST /barbearias/:codigo/clientes (cria cliente novo)
 *   2. POST /agendamentos { tipo: 'WALK_IN', inicio: now(), ... }
 *
 * Reusa `criarClienteRapidoSchema` de `@toqe/contracts` (já existe).
 *
 * onSuccess: invalida queryKeys ['fila'] e ['agendamentos'] para refletir
 * o novo walk-in em todas as listas relacionadas.
 *
 * TODO: se a 2ª chamada falhar, o cliente fica órfão no DB. Mitigar com
 * endpoint transacional no backend numa próxima fase.
 */
export function useCriarWalkIn() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation<AgendamentoResponse, Error, CriarWalkInInput>({
    mutationFn: async (input) => {
      if (!input.cliente && !input.clienteId) {
        throw new Error("Forneça `cliente` (criar novo) ou `clienteId`");
      }

      const tenant = tenantApi(barbearia!.codigo);

      let clienteId = input.clienteId;
      if (!clienteId && input.cliente) {
        const novoCliente = await tenant.post<ClienteResponse>(
          `/barbearias/${barbearia!.codigo}/clientes`,
          input.cliente,
        );
        clienteId = novoCliente.codigo;
      }

      return tenant.post<AgendamentoResponse>("/agendamentos", {
        barbeiroId: input.barbeiroId,
        clienteId,
        servicosIds: input.servicosIds,
        inicio: new Date().toISOString(),
        tipo: "WALK_IN",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fila"] });
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
    },
  });
}
