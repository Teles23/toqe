"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateAgendamentoInput } from "@toqe/contracts";
import { format } from "date-fns";
import { agendaService } from "../services/agenda.service";
import { API_STATUS_TO_SLOT } from "../constants/agenda.constants";
import { getInitial } from "@/shared/lib/utils";
import { STALE_TIME, QUERY_KEYS } from "@/shared/lib/constants";
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
    clientInitial: getInitial(clienteNome),
    service: servicoNome,
    barbeiro: barbeiroNome,
    barbeiroInitial: getInitial(barbeiroNome),
    barbeiroUsrCodigo: a.barbeiro?.usrCodigo ?? null,
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
    (a) => a.barbeiro?.usrCodigo === b.codigo,
  );

  // Barbeiro fica "active" se tiver agendamento confirmado no momento
  const isActive = agendamentosBarbeiro.some((a) => a.status === "confirmado");

  return {
    id: b.codigo,
    nome: b.nome,
    initial: getInitial(b.nome),
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
    queryKey: QUERY_KEYS.agendamentos(barCodigo ?? 0, dateStr),
    queryFn: () => agendaService.listAgendamentos(barCodigo!, dateStr),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.REALTIME,
    refetchInterval: 60_000, // Atualiza a cada minuto para mover barra de progresso
  });

  const barbeirosQuery = useQuery({
    queryKey: QUERY_KEYS.barbeirosAgenda(barCodigo ?? 0),
    queryFn: () => agendaService.listBarbeiros(barCodigo!),
    enabled: !!barCodigo,
    staleTime: STALE_TIME.DEFAULT,
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

export function useDisponibilidade(
  barCodigo: number | null,
  barbeiroId: number | null,
  date: string,
  duracao: number,
) {
  return useQuery<string[]>({
    queryKey: [
      "disponibilidade",
      barCodigo ?? 0,
      barbeiroId ?? 0,
      date,
      duracao,
    ],
    queryFn: () =>
      agendaService.listarDisponibilidade(
        barCodigo!,
        barbeiroId!,
        date,
        duracao,
      ),
    enabled: !!barCodigo && !!barbeiroId && !Number.isNaN(barbeiroId),
    staleTime: STALE_TIME.REALTIME,
  });
}

export function useAgendaMutations(barCodigo: number | null, date: string) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.agendamentos(barCodigo ?? 0, date),
    });

  const criar = useMutation({
    mutationFn: (data: CreateAgendamentoInput) =>
      agendaService.criar(barCodigo!, data),
    onSuccess: invalidate,
  });

  return { criar };
}
