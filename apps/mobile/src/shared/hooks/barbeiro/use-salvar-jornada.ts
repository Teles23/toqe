import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

// Dias da semana: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado (ISO: domingo=0)

export interface DiaSemanaPayload {
  /** 0 = domingo … 6 = sábado */
  dia: number;
  inicio: string;
  fim: string;
  ativo: boolean;
}

/** Registro de jornada retornado pela API (um por dia ativo). */
interface JornadaResult {
  diaSemana: number;
  inicio: string;
  fim: string;
}

/**
 * Salva a jornada de trabalho do barbeiro autenticado numa ÚNICA chamada
 * transacional: `PUT /agenda/jornada/:barbeiroId` com os 7 dias de uma vez.
 * O backend, numa transação, cria/atualiza os dias ativos e remove (folga) os
 * inativos — a semana nunca fica meio-salva.
 *
 * Header: x-tenant-id = barbearia.codigo
 * Body: { dias: [{ diaSemana, ativo, inicio, fim, almocoIni, almocoFim }] }
 *
 * onSuccess: invalida queryKey ['jornada'] para forçar refetch.
 *
 * Almoço: a tela ainda não coleta — placeholder "12:00"/"13:00" (substituir
 * quando a UI for expandida).
 */
export function useSalvarJornada() {
  const { barbearia, user } = useAuth();
  const qc = useQueryClient();

  return useMutation<JornadaResult[], Error, DiaSemanaPayload[]>({
    mutationFn: (dias) =>
      tenantApi(barbearia!.codigo).put<JornadaResult[]>(
        `/agenda/jornada/${user!.codigo}`,
        {
          dias: dias.map((d) => ({
            diaSemana: d.dia,
            ativo: d.ativo,
            inicio: d.inicio,
            fim: d.fim,
            almocoIni: "12:00",
            almocoFim: "13:00",
          })),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jornada"] });
    },
  });
}
