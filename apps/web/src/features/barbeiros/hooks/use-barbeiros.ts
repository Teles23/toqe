"use client";

import { useQuery } from "@tanstack/react-query";
import { getInitial } from "@/shared/lib/utils";
import {
  DIAS_SEMANA_CURTO,
  STALE_TIME,
  QUERY_KEYS,
} from "@/shared/lib/constants";
import { barbeiroService } from "../services/barbeiro.service";
import type { BarbeiroAPI, Barbeiro } from "../types/barbeiro.types";

function toBarbeiro(b: BarbeiroAPI): Barbeiro {
  return {
    ...b,
    initial: getInitial(b.nome),
    estado: "idle",
    especialidade: "",
    avaliacao: 0,
    horarioEntrada: "08:00",
    diasSemana: [...DIAS_SEMANA_CURTO],
  };
}

export function useBarbeiros(barCodigo: number | null) {
  const query = useQuery<BarbeiroAPI[]>({
    queryKey: QUERY_KEYS.barbeiros(barCodigo ?? 0),
    queryFn: () => barbeiroService.list(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });

  return {
    ...query,
    data: query.data?.map(toBarbeiro) ?? [],
  };
}
