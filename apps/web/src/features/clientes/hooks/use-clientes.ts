"use client";

import { useQuery } from "@tanstack/react-query";
import { clienteService } from "../services/cliente.service";
import type {
  ClienteAPI,
  Cliente,
  ClienteStatus,
} from "../types/cliente.types";

function toCliente(c: ClienteAPI): Cliente {
  const hasVisits = c.totalVisitas > 0;
  const isRecent =
    c.ultimaVisita !== null &&
    new Date(c.ultimaVisita) > new Date(Date.now() - 30 * 24 * 3600 * 1000);

  let status: ClienteStatus = "inativo";
  if (!hasVisits) status = "novo";
  else if (isRecent) status = "ativo";

  return {
    ...c,
    initial: c.nome.charAt(0).toUpperCase(),
    status,
  };
}

export function useClientes(barCodigo: number | null) {
  const query = useQuery<ClienteAPI[]>({
    queryKey: ["clientes", barCodigo],
    queryFn: () => clienteService.list(barCodigo!),
    enabled: !!barCodigo,
    staleTime: 60_000,
  });

  return {
    ...query,
    data: query.data?.map(toCliente) ?? [],
  };
}
