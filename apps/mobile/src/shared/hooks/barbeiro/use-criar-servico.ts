import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { CreateServicoInput } from "@toqe/contracts";

interface ServicoCriado {
  codigo: number;
  nome: string;
  precoBase: number;
  duracaoBase: number;
  ativo: boolean;
}

/**
 * Cria um novo serviço da barbearia.
 *
 * Endpoint: POST /servicos  (perfil dono/gerente)
 * Header: x-tenant-id = barbearia.codigo
 * Body: { nome, descricao?, precoBase, duracaoBase }
 *
 * onSuccess: invalida ['servicos'] para a lista refletir o novo serviço.
 */
export function useCriarServico() {
  const { barbearia } = useAuth();
  const qc = useQueryClient();

  return useMutation<ServicoCriado, Error, CreateServicoInput>({
    mutationFn: (input) =>
      tenantApi(barbearia!.codigo).post<ServicoCriado>("/servicos", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
    },
  });
}
