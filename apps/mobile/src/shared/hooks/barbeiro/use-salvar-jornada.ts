import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

// Dias da semana: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado (ISO: domingo=0)
// O schema configJornadaSchema exige um POST por dia com diaSemana + inicio + fim + almocoIni + almocoFim.
// Esta tela simplificada não tem campos de almoço — usamos "12:00"/"13:00" como placeholder.

export interface DiaSemanaPayload {
  /** 0 = domingo … 6 = sábado */
  dia: number;
  inicio: string;
  fim: string;
  ativo: boolean;
}

/** Resultado de cada upsert de dia (a API retorna o registro criado/atualizado) */
interface JornadaResult {
  diaSemana: number;
  inicio: string;
  fim: string;
}

/**
 * Salva a jornada de trabalho do barbeiro autenticado.
 * Envia um POST /agenda/jornada/:barbeiroId por dia **ativo**.
 * Dias inativos são ignorados (a API não tem endpoint de "desativar dia").
 *
 * Endpoint: POST /agenda/jornada/:barbeiroId
 * Header: x-tenant-id = barbearia.codigo
 * Body por chamada: { diaSemana: number; inicio: string; fim: string; almocoIni: string; almocoFim: string }
 *
 * onSuccess: invalida queryKey ['jornada'] para forçar refetch.
 */
export function useSalvarJornada() {
  const { barbearia, user } = useAuth();
  const qc = useQueryClient();

  return useMutation<JornadaResult[], Error, DiaSemanaPayload[]>({
    mutationFn: async (dias) => {
      const tenant = tenantApi(barbearia!.codigo);
      const barbeiroId = user!.codigo;
      const ativas = dias.filter((d) => d.ativo);

      const results = await Promise.all(
        ativas.map((d) =>
          tenant.post<JornadaResult>(`/agenda/jornada/${barbeiroId}`, {
            diaSemana: d.dia,
            inicio: d.inicio,
            fim: d.fim,
            // Placeholder de almoço — a tela de jornada ainda não coleta esses campos.
            // Quando a UI for expandida, substituir pelo valor real.
            almocoIni: "12:00",
            almocoFim: "13:00",
          }),
        ),
      );

      return results;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jornada"] });
    },
  });
}
