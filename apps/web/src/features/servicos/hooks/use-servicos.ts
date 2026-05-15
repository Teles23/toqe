"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { STALE_TIME, QUERY_KEYS } from "@/shared/lib/constants";
import { servicoService } from "../services/servico.service";
import type { ServicoAPI } from "../types/servico.types";
import type { CreateServicoInput, UpdateServicoInput } from "@toqe/contracts";

export function useServicos(barCodigo: number | null) {
  return useQuery<ServicoAPI[]>({
    queryKey: QUERY_KEYS.servicos(barCodigo ?? 0),
    queryFn: () => servicoService.list(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });
}

export function useServicoMutations(barCodigo: number | null) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.servicos(barCodigo ?? 0),
    });

  const create = useMutation({
    mutationFn: (data: CreateServicoInput) =>
      servicoService.create(barCodigo!, data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      codigo,
      data,
    }: {
      codigo: number;
      data: UpdateServicoInput;
    }) => servicoService.update(barCodigo!, codigo, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (codigo: number) => servicoService.remove(barCodigo!, codigo),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
