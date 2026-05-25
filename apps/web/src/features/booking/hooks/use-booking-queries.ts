"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getBarbeariaPublica,
  getAvaliacoesPublicas,
  listarBarbeirosPublicos,
  listarServicosPublicos,
  listarSlotsPublicos,
  criarAgendamentoPublico,
  type AgendamentoPublicoResponse,
  type AvaliacoesPublicasResponse,
} from "../services/booking.service";
import type { CreatePublicAgendamentoInput } from "@toqe/contracts";

/**
 * Hooks de leitura/escrita do fluxo público.
 *
 * Mantemos todos juntos porque compartilham a chave-raiz `["publico", slug, ...]`
 * — facilita invalidações futuras e mantém o feature em um único arquivo.
 */

export function useBarbeariaPublica(slug: string) {
  return useQuery({
    queryKey: ["publico", slug, "barbearia"],
    queryFn: () => getBarbeariaPublica(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useServicosPublicos(slug: string) {
  return useQuery({
    queryKey: ["publico", slug, "servicos"],
    queryFn: () => listarServicosPublicos(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBarbeirosPublicos(slug: string) {
  return useQuery({
    queryKey: ["publico", slug, "barbeiros"],
    queryFn: () => listarBarbeirosPublicos(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

interface UseSlotsParams {
  slug: string;
  barbeiroId: number;
  data: string; // YYYY-MM-DD
  duracao: number;
  enabled?: boolean;
}

export function useSlotsPublicos({
  slug,
  barbeiroId,
  data,
  duracao,
  enabled = true,
}: UseSlotsParams) {
  return useQuery({
    queryKey: ["publico", slug, "slots", barbeiroId, data, duracao],
    queryFn: () => listarSlotsPublicos({ slug, barbeiroId, data, duracao }),
    enabled: enabled && Boolean(slug) && Boolean(data) && duracao > 0,
    staleTime: 30 * 1000,
  });
}

export function useAvaliacoesPublicas(slug: string) {
  return useQuery<AvaliacoesPublicasResponse>({
    queryKey: ["publico", slug, "avaliacoes"],
    queryFn: () => getAvaliacoesPublicas(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCriarAgendamentoPublico(slug: string) {
  return useMutation<
    AgendamentoPublicoResponse,
    Error,
    CreatePublicAgendamentoInput
  >({
    mutationFn: (payload) => criarAgendamentoPublico(slug, payload),
  });
}
