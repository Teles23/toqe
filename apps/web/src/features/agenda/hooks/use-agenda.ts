"use client";

import { useState, useEffect, useMemo } from "react";
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

export function toSlot(a: AgendamentoAPI, now: Date): Slot {
  const inicio = new Date(a.inicio);
  const fim = new Date(a.fim);
  const duracao = Math.round((fim.getTime() - inicio.getTime()) / 60_000);
  const status = API_STATUS_TO_SLOT[a.status] ?? "pending";

  // Cálculo de progresso real se estiver ativo
  let progressPct: number | undefined = undefined;
  if (status === "active") {
    const totalMs = fim.getTime() - inicio.getTime();
    const elapsedMs = now.getTime() - inicio.getTime();
    progressPct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  }

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
    progressPct,
  };
}

export function toBarbeiro(
  b: BarbeiroAPI,
  agendamentos: AgendamentoAPI[],
): Barbeiro {
  const agendamentosBarbeiro = agendamentos.filter(
    (a) => a.barbeiro?.codigo === b.codigo,
  );

  // Barbeiro fica "active" se tiver agendamento EM_ATENDIMENTO agora
  const isActive = agendamentosBarbeiro.some(
    (a) => a.status === "EM_ATENDIMENTO",
  );

  return {
    id: b.codigo,
    nome: b.nome,
    initial: b.nome.charAt(0).toUpperCase(),
    state: isActive ? "active" : "idle",
    agendamentos: agendamentosBarbeiro.length,
    livres: 0, // Pode ser calculado depois com base na jornada
  };
}

export function useAgenda(barCodigo: number | null, date: Date) {
  const [now, setNow] = useState(new Date());
  const dateStr = format(date, "yyyy-MM-dd");

  // Loop de atualização local (para mover barras de progresso sem bater na API)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000); // Atualiza o "agora" a cada 10 segundos
    return () => clearInterval(timer);
  }, []);

  const agendamentosQuery = useQuery({
    queryKey: ["agendamentos", barCodigo, dateStr],
    queryFn: () => agendaService.listAgendamentos(barCodigo!, dateStr),
    enabled: !!barCodigo,
    staleTime: 10_000,
    refetchInterval: 60_000, // Atualiza a cada minuto para mover barra de progresso
  });

  const barbeirosQuery = useQuery({
    queryKey: ["barbeiros", barCodigo],
    queryFn: () => agendaService.listBarbeiros(barCodigo!),
    enabled: !!barCodigo,
    staleTime: 60_000,
  });

  const { slots, barbeiros } = useMemo(() => {
    const raw = agendamentosQuery.data ?? [];
    return {
      slots: raw.map((s) => toSlot(s, now)),
      barbeiros: (barbeirosQuery.data ?? []).map((b) => toBarbeiro(b, raw)),
    };
  }, [agendamentosQuery.data, barbeirosQuery.data, now]);

  return {
    slots,
    barbeiros,
    isLoading: agendamentosQuery.isLoading || barbeirosQuery.isLoading,
    isError: agendamentosQuery.isError || barbeirosQuery.isError,
    refetch: agendamentosQuery.refetch,
  };
}
