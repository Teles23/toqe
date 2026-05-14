"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configuracaoService } from "../services/configuracao.service";
import {
  HORARIOS_DEFAULT,
  NOTIFICACOES_DEFAULT,
} from "../constants/configuracao.constants";
import type {
  BarbeariaConfig,
  HorarioDia,
  NotificacaoConfig,
} from "../types/configuracao.types";

export function useConfiguracaoBarbearia(barCodigo: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery<BarbeariaConfig>({
    queryKey: ["configuracao-barbearia", barCodigo],
    queryFn: () => configuracaoService.getBarbearia(barCodigo!),
    enabled: !!barCodigo,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<BarbeariaConfig>) =>
      configuracaoService.updateBarbearia(barCodigo!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["configuracao-barbearia", barCodigo],
      });
    },
  });

  return { ...query, update: mutation };
}

export function useConfiguracaoHorarios(barCodigo: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery<HorarioDia[]>({
    queryKey: ["configuracao-horarios", barCodigo],
    queryFn: () => configuracaoService.getHorarios(barCodigo!),
    enabled: !!barCodigo,
    staleTime: 60_000,
    placeholderData: HORARIOS_DEFAULT,
  });

  const mutation = useMutation({
    mutationFn: (data: HorarioDia[]) =>
      configuracaoService.updateHorarios(barCodigo!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["configuracao-horarios", barCodigo],
      });
    },
  });

  return { ...query, update: mutation };
}

export function useConfiguracaoNotificacoes(barCodigo: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery<NotificacaoConfig>({
    queryKey: ["configuracao-notificacoes", barCodigo],
    queryFn: () => configuracaoService.getNotificacoes(barCodigo!),
    enabled: !!barCodigo,
    staleTime: 60_000,
    placeholderData: NOTIFICACOES_DEFAULT,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<NotificacaoConfig>) =>
      configuracaoService.updateNotificacoes(barCodigo!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["configuracao-notificacoes", barCodigo],
      });
    },
  });

  return { ...query, update: mutation };
}
