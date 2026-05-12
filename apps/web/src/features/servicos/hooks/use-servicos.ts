"use client";

import { useQuery } from "@tanstack/react-query";
import { servicoService } from "../services/servico.service";
import type { ServicoAPI } from "../types/servico.types";

export function useServicos(barCodigo: number | null) {
  return useQuery<ServicoAPI[]>({
    queryKey: ["servicos", barCodigo],
    queryFn: () => servicoService.list(barCodigo!),
    enabled: !!barCodigo,
    staleTime: 60_000,
  });
}
