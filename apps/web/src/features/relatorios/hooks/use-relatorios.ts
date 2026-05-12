"use client";

import { useQuery } from "@tanstack/react-query";
import { relatorioService } from "../services/relatorio.service";
import type { Periodo } from "../types/relatorio.types";

export function useFaturamento(barCodigo: number | null, periodo: Periodo) {
  return useQuery({
    queryKey: ["relatorios-faturamento", barCodigo, periodo],
    queryFn: () => relatorioService.faturamento(barCodigo!, periodo),
    enabled: !!barCodigo,
    staleTime: 60_000,
  });
}

export function useAgendamentosRelatorio(
  barCodigo: number | null,
  periodo: Periodo,
) {
  return useQuery({
    queryKey: ["relatorios-agendamentos", barCodigo, periodo],
    queryFn: () => relatorioService.agendamentos(barCodigo!, periodo),
    enabled: !!barCodigo,
    staleTime: 60_000,
  });
}

export function useServicosRelatorio(
  barCodigo: number | null,
  periodo: Periodo,
) {
  return useQuery({
    queryKey: ["relatorios-servicos", barCodigo, periodo],
    queryFn: () => relatorioService.servicos(barCodigo!, periodo),
    enabled: !!barCodigo,
    staleTime: 60_000,
  });
}

export function useBarbeirosRelatorio(
  barCodigo: number | null,
  periodo: Periodo,
) {
  return useQuery({
    queryKey: ["relatorios-barbeiros", barCodigo, periodo],
    queryFn: () => relatorioService.barbeiros(barCodigo!, periodo),
    enabled: !!barCodigo,
    staleTime: 60_000,
  });
}

export function useHorariosPico(barCodigo: number | null, periodo: Periodo) {
  return useQuery({
    queryKey: ["relatorios-horarios-pico", barCodigo, periodo],
    queryFn: () => relatorioService.horariosPico(barCodigo!, periodo),
    enabled: !!barCodigo,
    staleTime: 60_000,
  });
}
