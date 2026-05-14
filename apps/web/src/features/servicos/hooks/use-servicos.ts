"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE_TIME, QUERY_KEYS } from "@/shared/lib/constants";
import { servicoService } from "../services/servico.service";
import type { ServicoAPI } from "../types/servico.types";

export function useServicos(barCodigo: number | null) {
  return useQuery<ServicoAPI[]>({
    queryKey: QUERY_KEYS.servicos(barCodigo ?? 0),
    queryFn: () => servicoService.list(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });
}
