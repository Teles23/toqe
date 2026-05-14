"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE_TIME, QUERY_KEYS } from "@/shared/lib/constants";
import { relatorioService } from "../services/relatorio.service";
import type { Periodo } from "../types/relatorio.types";

export function useFaturamento(barCodigo: number | null, periodo: Periodo) {
  return useQuery({
    queryKey: QUERY_KEYS.relatorios.faturamento(barCodigo ?? 0, periodo),
    queryFn: () => relatorioService.faturamento(barCodigo!, periodo),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });
}

export function useAgendamentosRelatorio(
  barCodigo: number | null,
  periodo: Periodo,
) {
  return useQuery({
    queryKey: QUERY_KEYS.relatorios.agendamentos(barCodigo ?? 0, periodo),
    queryFn: () => relatorioService.agendamentos(barCodigo!, periodo),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });
}

export function useServicosRelatorio(
  barCodigo: number | null,
  periodo: Periodo,
) {
  return useQuery({
    queryKey: QUERY_KEYS.relatorios.servicos(barCodigo ?? 0, periodo),
    queryFn: () => relatorioService.servicos(barCodigo!, periodo),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });
}

export function useBarbeirosRelatorio(
  barCodigo: number | null,
  periodo: Periodo,
) {
  return useQuery({
    queryKey: QUERY_KEYS.relatorios.barbeiros(barCodigo ?? 0, periodo),
    queryFn: () => relatorioService.barbeiros(barCodigo!, periodo),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });
}

export function useHorariosPico(barCodigo: number | null, periodo: Periodo) {
  return useQuery({
    queryKey: QUERY_KEYS.relatorios.horariosPico(barCodigo ?? 0, periodo),
    queryFn: () => relatorioService.horariosPico(barCodigo!, periodo),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });
}
