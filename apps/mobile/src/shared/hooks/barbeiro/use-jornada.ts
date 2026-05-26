import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import type { JornadaResponse } from "@toqe/shared";

/**
 * Carrega a jornada de trabalho do barbeiro autenticado.
 *
 * Endpoint: GET /agenda/jornada/:barbeiroId  (header x-tenant-id = barbearia)
 * Retorna `JornadaResponse[]` — um registro por dia ATIVO (dias de folga não
 * têm registro no banco).
 *
 * queryKey ['jornada', user.codigo] — mesma key invalidada pelo `useSalvarJornada`,
 * então salvar e reabrir reflete o estado real.
 */
export function useJornada() {
  const { barbearia, user } = useAuth();

  return useQuery<JornadaResponse[]>({
    queryKey: ["jornada", user?.codigo],
    queryFn: () =>
      tenantApi(barbearia!.codigo).get<JornadaResponse[]>(
        `/agenda/jornada/${user!.codigo}`,
      ),
    enabled: !!barbearia && !!user,
    staleTime: 5 * 60_000,
  });
}

// ─── Merge com a semana completa ──────────────────────────────────────────────

/** Dia da jornada já no formato de exibição da tela (rótulos + estado). */
export interface DiaJornadaView {
  /** 0 = domingo … 6 = sábado (padrão ISO/API) */
  diaSemana: number;
  dia: string;
  diaShort: string;
  abre: string | null;
  fecha: string | null;
  ativo: boolean;
  almoco: { de: string; ate: string } | null;
}

/** Semana na ordem de exibição (segunda → domingo). */
const SEMANA: { diaSemana: number; dia: string; diaShort: string }[] = [
  { diaSemana: 1, dia: "Segunda", diaShort: "SEG" },
  { diaSemana: 2, dia: "Terça", diaShort: "TER" },
  { diaSemana: 3, dia: "Quarta", diaShort: "QUA" },
  { diaSemana: 4, dia: "Quinta", diaShort: "QUI" },
  { diaSemana: 5, dia: "Sexta", diaShort: "SEX" },
  { diaSemana: 6, dia: "Sábado", diaShort: "SAB" },
  { diaSemana: 0, dia: "Domingo", diaShort: "DOM" },
];

/**
 * Combina os registros salvos (um por dia ativo) com os 7 dias da semana:
 * dias com registro ficam ativos com os horários reais; dias sem registro
 * ficam inativos (folga) com horários `null`.
 */
export function mergeJornadaComSemana(
  registros: JornadaResponse[] | undefined,
): DiaJornadaView[] {
  const porDia = new Map<number, JornadaResponse>();
  (registros ?? []).forEach((r) => porDia.set(r.diaSemana, r));

  return SEMANA.map(({ diaSemana, dia, diaShort }) => {
    const r = porDia.get(diaSemana);
    if (!r) {
      return {
        diaSemana,
        dia,
        diaShort,
        abre: null,
        fecha: null,
        ativo: false,
        almoco: null,
      };
    }
    return {
      diaSemana,
      dia,
      diaShort,
      abre: r.inicio,
      fecha: r.fim,
      ativo: true,
      almoco:
        r.almocoIni && r.almocoFim
          ? { de: r.almocoIni, ate: r.almocoFim }
          : null,
    };
  });
}
