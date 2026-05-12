"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { agendaService } from "../services/agenda.service";
import { API_STATUS_TO_SLOT } from "../constants/agenda.constants";
import type {
  Slot,
  Barbeiro,
  AgendamentoAPI,
  BarbeiroAPI,
} from "../types/agenda.types";

function toSlot(a: AgendamentoAPI): Slot {
  const inicio = new Date(a.inicio);
  const fim = new Date(a.fim);
  const duracao = Math.round((fim.getTime() - inicio.getTime()) / 60_000);
  const status = API_STATUS_TO_SLOT[a.status] ?? "pending";
  const clienteNome = a.cliente?.nome ?? "—";
  const barbeiroNome = a.barbeiro?.nome ?? "—";
  const servicoNome = a.itens.map((i) => i.servico.nome).join(" + ") || "—";

  return {
    id: a.codigo,
    time: format(inicio, "HH:mm"),
    endTime: format(fim, "HH:mm"),
    client: clienteNome,
    clientInitial: clienteNome.charAt(0).toUpperCase(),
    service: servicoNome,
    barbeiro: barbeiroNome,
    barbeiroInitial: barbeiroNome.charAt(0).toUpperCase(),
    duration: duracao,
    status,
    startedAt: status === "active" ? format(inicio, "HH:mm") : undefined,
    progressPct: status === "active" ? 50 : undefined,
  };
}

function toBarbeiro(b: BarbeiroAPI, agendamentos: AgendamentoAPI[]): Barbeiro {
  const total = agendamentos.filter(
    (a) => a.barbeiro?.codigo === b.codigo,
  ).length;
  return {
    id: b.codigo,
    nome: b.nome,
    initial: b.nome.charAt(0).toUpperCase(),
    state: "idle",
    agendamentos: total,
    livres: 0,
  };
}

export function useAgenda(barCodigo: number | null, date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");

  const agendamentosQuery = useQuery({
    queryKey: ["agendamentos", barCodigo, dateStr],
    queryFn: () => agendaService.listAgendamentos(barCodigo!, dateStr),
    enabled: !!barCodigo,
    staleTime: 30_000,
  });

  const barbeirosQuery = useQuery({
    queryKey: ["barbeiros", barCodigo],
    queryFn: () => agendaService.listBarbeiros(barCodigo!),
    enabled: !!barCodigo,
    staleTime: 60_000,
  });

  const raw = agendamentosQuery.data ?? [];
  const slots: Slot[] = raw.map(toSlot);
  const barbeiros: Barbeiro[] = (barbeirosQuery.data ?? []).map((b) =>
    toBarbeiro(b, raw),
  );

  return {
    slots,
    barbeiros,
    isLoading: agendamentosQuery.isLoading || barbeirosQuery.isLoading,
    isError: agendamentosQuery.isError || barbeirosQuery.isError,
    refetch: agendamentosQuery.refetch,
  };
}
