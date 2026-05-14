"use client";

import { useQuery } from "@tanstack/react-query";
import { getInitial } from "@/shared/lib/utils";
import { DIAS_SEMANA_CURTO } from "@/shared/lib/constants";
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
    queryKey: ["barbeiros-detail", barCodigo],
    queryFn: () => barbeiroService.list(barCodigo!),
    enabled: !!barCodigo,
    staleTime: 30_000,
  });

  return {
    ...query,
    data: query.data?.map(toBarbeiro) ?? [],
  };
}
