"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS, STALE_TIME } from "@/shared/lib/constants";
import { fetchDashboardOverview } from "@/features/dashboard/services/dashboard.service";
import { configuracaoService } from "@/features/configuracoes/services/configuracao.service";
import type { HorarioDia } from "@/features/configuracoes/types/configuracao.types";

/**
 * Determina se a barbearia está aberta agora com base nos horários de
 * funcionamento configurados.
 *
 * @param horarios Array de HorarioDia retornado pela API.
 * @returns true se a barbearia estiver aberta no momento atual.
 */
export function calcularAberta(horarios: HorarioDia[]): boolean {
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0=Dom … 6=Sáb
  const horarioDia = horarios.find((h) => h.diaSemana === diaSemana);

  if (!horarioDia || !horarioDia.aberto) return false;

  const [hAbertura = 0, mAbertura = 0] = horarioDia.abertura
    .split(":")
    .map(Number);
  const [hFechamento = 0, mFechamento = 0] = horarioDia.fechamento
    .split(":")
    .map(Number);

  const totalMinutos = agora.getHours() * 60 + agora.getMinutes();
  const abertura = (hAbertura as number) * 60 + (mAbertura as number);
  const fechamento = (hFechamento as number) * 60 + (mFechamento as number);

  return totalMinutos >= abertura && totalMinutos < fechamento;
}

export interface SidebarStatus {
  aberta: boolean;
  barbeirosAtivos: number;
  isLoading: boolean;
}

/**
 * Hook para exibir o status ao vivo da barbearia na sidebar.
 *
 * Reutiliza as mesmas query keys do dashboard e das configurações,
 * portanto compartilha o cache sem disparar chamadas duplicadas.
 *
 * @param barCodigo Código da barbearia ativa (null = desabilitado).
 */
export function useSidebarStatus(barCodigo: number | null): SidebarStatus {
  const dashboardQuery = useQuery({
    queryKey: QUERY_KEYS.dashboard(barCodigo ?? 0),
    queryFn: () => fetchDashboardOverview(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.REALTIME,
    refetchInterval: 60_000,
  });

  const horariosQuery = useQuery({
    queryKey: QUERY_KEYS.configuracoes.horarios(barCodigo ?? 0),
    queryFn: () => configuracaoService.getHorarios(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });

  const isLoading = dashboardQuery.isLoading || horariosQuery.isLoading;

  // liveMetrics[0] = "Barbeiros ativos"
  const primeiraMetrica = dashboardQuery.data?.liveMetrics?.[0];
  const barbeirosAtivos =
    primeiraMetrica?.label === "Barbeiros ativos"
      ? Number(primeiraMetrica.value)
      : 0;

  const aberta = horariosQuery.data
    ? calcularAberta(horariosQuery.data)
    : false;

  return { aberta, barbeirosAtivos, isLoading };
}
