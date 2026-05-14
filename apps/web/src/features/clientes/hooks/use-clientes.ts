"use client";

import { useQuery } from "@tanstack/react-query";
import { getInitial } from "@/shared/lib/utils";
import { STALE_TIME, QUERY_KEYS } from "@/shared/lib/constants";
import { clienteService } from "../services/cliente.service";
import type {
  ClienteAPI,
  Cliente,
  ClienteStatus,
} from "../types/cliente.types";

export function toCliente(c: ClienteAPI): Cliente {
  const hasVisits = c.totalVisitas > 0;
  const isRecent =
    c.ultimaVisita !== null &&
    new Date(c.ultimaVisita) > new Date(Date.now() - 30 * 24 * 3600 * 1000);

  let status: ClienteStatus = "inativo";
  if (!hasVisits) status = "novo";
  else if (isRecent) status = "ativo";

  return {
    ...c,
    initial: getInitial(c.nome),
    status,
  };
}

export function useClientes(barCodigo: number | null) {
  const query = useQuery<ClienteAPI[]>({
    queryKey: QUERY_KEYS.clientes(barCodigo ?? 0),
    queryFn: () => clienteService.list(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
  });

  return {
    ...query,
    data: query.data?.map(toCliente) ?? [],
  };
}
