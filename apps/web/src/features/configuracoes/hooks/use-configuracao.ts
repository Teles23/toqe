"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { STALE_TIME, QUERY_KEYS } from "@/shared/lib/constants";
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
    queryKey: QUERY_KEYS.configuracoes.barbearia(barCodigo ?? 0),
    queryFn: () => configuracaoService.getBarbearia(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<BarbeariaConfig>) =>
      configuracaoService.updateBarbearia(barCodigo!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.configuracoes.barbearia(barCodigo ?? 0),
      });
    },
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) =>
      configuracaoService.uploadLogo(barCodigo!, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.configuracoes.barbearia(barCodigo ?? 0),
      });
    },
  });

  return { ...query, update: mutation, uploadLogo };
}

export function useConfiguracaoHorarios(barCodigo: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery<HorarioDia[]>({
    queryKey: QUERY_KEYS.configuracoes.horarios(barCodigo ?? 0),
    queryFn: () => configuracaoService.getHorarios(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
    placeholderData: HORARIOS_DEFAULT,
  });

  const mutation = useMutation({
    mutationFn: (data: HorarioDia[]) =>
      configuracaoService.updateHorarios(barCodigo!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.configuracoes.horarios(barCodigo ?? 0),
      });
    },
  });

  return { ...query, update: mutation };
}

export function useConfiguracaoNotificacoes(barCodigo: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery<NotificacaoConfig>({
    queryKey: QUERY_KEYS.configuracoes.notificacoes(barCodigo ?? 0),
    queryFn: () => configuracaoService.getNotificacoes(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
    placeholderData: NOTIFICACOES_DEFAULT,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<NotificacaoConfig>) =>
      configuracaoService.updateNotificacoes(barCodigo!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.configuracoes.notificacoes(barCodigo ?? 0),
      });
    },
  });

  return { ...query, update: mutation };
}
