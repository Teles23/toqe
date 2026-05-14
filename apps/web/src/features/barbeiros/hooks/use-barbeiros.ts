"use client";

import { useQuery } from "@tanstack/react-query";
import { barbeiroService } from "../services/barbeiro.service";
import type { BarbeiroAPI, Barbeiro } from "../types/barbeiro.types";

function toBarbeiro(b: BarbeiroAPI): Barbeiro {
  return {
    ...b,
    initial: b.nome.charAt(0).toUpperCase(),
    estado: "idle",
    especialidade: "",
    avaliacao: 0,
    horarioEntrada: "08:00",
    diasSemana: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
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
