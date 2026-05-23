import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { ClienteAPI, CriarClienteManualInput } from "@toqe/contracts";

/**
 * Cadastro manual de cliente pelo barbeiro (tela Clientes).
 *
 * Endpoint: POST /barbearias/:barCodigo/clientes
 * E-mail é OPCIONAL — o backend gera um sintético quando ausente (igual ao
 * walk-in). `nome` obrigatório; `telefone` é exigido pela UI (regra do form).
 *
 * onSuccess: invalida ['clientes'] para a lista refletir o novo cadastro.
 */
export function useCriarCliente() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation<ClienteAPI, Error, CriarClienteManualInput>({
    mutationFn: (dto) =>
      tenantApi(barbearia!.codigo).post<ClienteAPI>(
        `/barbearias/${barbearia!.codigo}/clientes`,
        dto,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}
