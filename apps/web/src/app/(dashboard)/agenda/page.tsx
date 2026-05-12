"use client";

import React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Ban,
  CircleDot,
} from "lucide-react";

/* ── Tipos ── */
type SlotStatus =
  | "active"
  | "confirmed"
  | "pending"
  | "late"
  | "blocked"
  | "available";

/**
 * Mapeamento entre status da API (português) e status de exibição (inglês).
 * Usado ao converter respostas reais da API para o estado local do componente.
 *
 * API → Frontend:
 *   confirmado → confirmed
 *   concluido  → active    (em andamento)
 *   cancelado  → blocked
 *   no_show    → late
 */
export const API_STATUS_TO_SLOT: Record<string, SlotStatus> = {
  confirmado: "confirmed",
  concluido: "active",
  cancelado: "blocked",
  no_show: "late",
} as const;

/**
 * Mapeamento inverso: estado local → status da API.
 * Usado ao enviar PATCH /agendamentos/:codigo/status.
 */
export const SLOT_TO_API_STATUS: Partial<Record<SlotStatus, string>> = {
  confirmed: "confirmado",
  active: "concluido",
  blocked: "cancelado",
  late: "no_show",
} as const;

interface Slot {
  id: number;
  time: string;
  endTime: string;
  client: string;
  clientInitial: string;
  service: string;
  barbeiro: string;
  barbeiroInitial: string;
  duration: number; // minutos
  status: SlotStatus;
  progressPct?: number; // 0–100, só se active
  startedAt?: string; // hora que começou
}

interface Barbeiro {
  id: number;
  nome: string;
  initial: string;
  state: "active" | "idle" | "late";
  agendamentos: number;
  livres: number;
}

/* ── Dados de exemplo ── */
const BARBEIROS: Barbeiro[] = [
  {
    id: 1,
    nome: "Carlos",
    initial: "C",
    state: "active",
    agendamentos: 6,
    livres: 2,
  },
  {
    id: 2,
    nome: "Lucas",
    initial: "L",
    state: "idle",
    agendamentos: 4,
    livres: 4,
  },
  {
    id: 3,
    nome: "Felipe",
    initial: "F",
    state: "active",
    agendamentos: 5,
    livres: 3,
  },
];

const SLOTS_INICIAL: Slot[] = [
  {
    id: 1,
    time: "08:30",
    endTime: "09:00",
    client: "João Silva",
    clientInitial: "J",
    service: "Corte",
    barbeiro: "Carlos",
    barbeiroInitial: "C",
    duration: 30,
    status: "active",
    progressPct: 68,
    startedAt: "08:30",
  },
  {
    id: 2,
    time: "09:00",
    endTime: "09:50",
    client: "Pedro Santos",
    clientInitial: "P",
    service: "Corte + Barba",
    barbeiro: "Lucas",
    barbeiroInitial: "L",
    duration: 50,
    status: "confirmed",
  },
  {
    id: 3,
    time: "09:30",
    endTime: "09:50",
    client: "Ana Costa",
    clientInitial: "A",
    service: "Sobrancelha",
    barbeiro: "Felipe",
    barbeiroInitial: "F",
    duration: 20,
    status: "confirmed",
  },
  {
    id: 4,
    time: "10:00",
    endTime: "10:30",
    client: "Marco Oliveira",
    clientInitial: "M",
    service: "Barba",
    barbeiro: "Carlos",
    barbeiroInitial: "C",
    duration: 30,
    status: "pending",
  },
  {
    id: 5,
    time: "10:30",
    endTime: "11:00",
    client: "Bruno Lima",
    clientInitial: "B",
    service: "Corte",
    barbeiro: "Lucas",
    barbeiroInitial: "L",
    duration: 30,
    status: "late",
  },
  {
    id: 6,
    time: "12:00",
    endTime: "13:00",
    client: "Almoço",
    clientInitial: "—",
    service: "Intervalo",
    barbeiro: "Todos",
    barbeiroInitial: "—",
    duration: 60,
    status: "blocked",
  },
  {
    id: 7,
    time: "13:00",
    endTime: "13:30",
    client: "—",
    clientInitial: "—",
    service: "—",
    barbeiro: "Carlos",
    barbeiroInitial: "C",
    duration: 30,
    status: "available",
  },
  {
    id: 8,
    time: "14:00",
    endTime: "14:50",
    client: "Rafael Souza",
    clientInitial: "R",
    service: "Corte + Barba",
    barbeiro: "Felipe",
    barbeiroInitial: "F",
    duration: 50,
    status: "confirmed",
  },
  {
    id: 9,
    time: "15:30",
    endTime: "16:00",
    client: "Diego Mendes",
    clientInitial: "D",
    service: "Corte",
    barbeiro: "Lucas",
    barbeiroInitial: "L",
    duration: 30,
    status: "confirmed",
  },
];

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const today = new Date();

/* ── Helpers de status ── */
const STATUS_CONFIG: Record<
  SlotStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    glow: string;
    icon: React.ReactNode;
    pulse?: boolean;
  }
> = {
  active: {
    label: "Atendendo",
    color: "var(--status-success)",
    bg: "rgba(29,185,84,0.05)",
    border: "rgba(29,185,84,0.25)",
    glow: "0 0 20px rgba(29,185,84,0.1)",
    icon: <CircleDot size={11} />,
    pulse: true,
  },
  confirmed: {
    label: "Confirmado",
    color: "var(--status-info)",
    bg: "transparent",
    border: "var(--border-default)",
    glow: "none",
    icon: <CheckCircle size={11} />,
  },
  pending: {
    label: "Pendente",
    color: "var(--status-warning)",
    bg: "transparent",
    border: "var(--border-default)",
    glow: "none",
    icon: <Clock size={11} />,
  },
  late: {
    label: "Atrasado",
    color: "var(--status-error)",
    bg: "rgba(255,77,79,0.04)",
    border: "rgba(255,77,79,0.25)",
    glow: "0 0 16px rgba(255,77,79,0.08)",
    icon: <AlertCircle size={11} />,
    pulse: true,
  },
  blocked: {
    label: "Bloqueado",
    color: "var(--text-muted)",
    bg: "transparent",
    border: "var(--border-subtle)",
    glow: "none",
    icon: <Ban size={11} />,
  },
  available: {
    label: "Livre",
    color: "var(--text-muted)",
    bg: "transparent",
    border: "var(--border-subtle)",
    glow: "none",
    icon: <Plus size={11} />,
  },
};

/* ── Hook: progresso do atendimento ativo ── */
function useActiveProgress(slots: Slot[]) {
  const [slots2, setSlots2] = useState(slots);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlots2((prev) =>
        prev.map((s) => {
          if (s.status !== "active" || s.progressPct === undefined) return s;
          const next = Math.min(100, (s.progressPct ?? 0) + 0.5);
          return { ...s, progressPct: next };
        }),
      );
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return slots2;
}

/* ── Hook: countdown ── */
function useCountdown(startedAt?: string, duration?: number) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!startedAt || !duration) return;

    const tick = () => {
      const [h, m] = startedAt.split(":").map(Number) as [number, number];
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + duration * 60_000);
      const diff = end.getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("00:00");
        return;
      }
      const mm = Math.floor(diff / 60_000);
      const ss = Math.floor((diff % 60_000) / 1000);
      setRemaining(
        `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`,
      );
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt, duration]);

  return remaining;
}

/* ── Componente: Badge de status ── */
function StatusBadge({ status }: { status: SlotStatus }): React.JSX.Element {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background:
          cfg.bg !== "transparent" ? cfg.bg : "rgba(255,255,255,0.04)",
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        style={{
          animation: cfg.pulse
            ? "tqe-pulse-green 1.5s ease-in-out infinite"
            : "none",
        }}
      >
        {cfg.icon}
      </span>
      {cfg.label}
    </span>
  );
}

/* ── Componente: Slot de agenda ── */
function AgendaSlot({
  slot,
  index,
}: {
  slot: Slot;
  index: number;
}): React.JSX.Element {
  const cfg = STATUS_CONFIG[slot.status];
  const countdown = useCountdown(slot.startedAt, slot.duration);
  const isAvailable = slot.status === "available";
  const isBlocked = slot.status === "blocked";
  const isActive = slot.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={!isBlocked ? { y: -1 } : {}}
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: cfg.bg !== "transparent" ? cfg.bg : "var(--bg-card)",
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${isAvailable || isBlocked ? "var(--border-default)" : cfg.color}`,
        borderLeftStyle: isAvailable ? "dashed" : "solid",
        boxShadow: cfg.glow !== "none" ? cfg.glow : undefined,
        opacity: isBlocked ? 0.45 : 1,
        transition: "border-color 160ms, box-shadow 160ms, transform 160ms",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Hora */}
        <div
          className="flex-shrink-0 flex flex-col items-center"
          style={{ minWidth: 44 }}
        >
          <span
            className="font-semibold leading-none"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 13,
              color: isActive ? cfg.color : "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {slot.time}
          </span>
          <span
            className="text-[10px] mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            {slot.endTime}
          </span>
        </div>

        {/* Divider vertical */}
        <div
          className="self-stretch flex-shrink-0 rounded-full"
          style={{ width: 1, background: "var(--border-subtle)" }}
        />

        {/* Avatar do cliente */}
        {!isBlocked && !isAvailable && (
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full font-semibold text-xs"
            style={{
              width: 30,
              height: 30,
              background: `${cfg.color}18`,
              color: cfg.color,
              border: `1px solid ${cfg.color}30`,
              fontFamily: "var(--font-heading)",
            }}
          >
            {slot.clientInitial}
          </div>
        )}

        {/* Ícone para bloqueado/livre */}
        {(isBlocked || isAvailable) && (
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{
              width: 30,
              height: 30,
              background: "var(--bg-hover)",
              color: "var(--text-muted)",
            }}
          >
            {isAvailable ? <Plus size={13} /> : <Ban size={13} />}
          </div>
        )}

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="font-medium truncate text-[13px]"
              style={{
                color:
                  isAvailable || isBlocked
                    ? "var(--text-muted)"
                    : "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {isAvailable ? "Horário disponível" : slot.client}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {slot.service}
            </span>
            <span style={{ color: "var(--border-default)" }}>·</span>
            <span
              className="text-[11px] truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {slot.duration}min
            </span>
          </div>

          {/* Barra de progresso — só no ativo */}
          {isActive && slot.progressPct !== undefined && (
            <div className="mt-2" style={{ maxWidth: 160 }}>
              <div
                className="tqe-progress-track"
                style={{
                  height: 2,
                  borderRadius: 2,
                  background: "var(--border-default)",
                }}
              >
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    background: "var(--status-success)",
                    width: `${slot.progressPct}%`,
                  }}
                  animate={{ width: `${slot.progressPct}%` }}
                  transition={{ duration: 0.8, ease: "linear" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Direita: badge + barbeiro + countdown */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <StatusBadge status={slot.status} />

          {/* Barbeiro */}
          {!isBlocked && (
            <div className="flex items-center gap-1">
              <div
                className="flex items-center justify-center rounded-full text-[9px] font-bold"
                style={{
                  width: 16,
                  height: 16,
                  background: "var(--bg-hover)",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-heading)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {slot.barbeiroInitial}
              </div>
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                {slot.barbeiro}
              </span>
            </div>
          )}

          {/* Countdown no slot ativo */}
          {isActive && countdown && (
            <span
              className="text-[11px] font-mono font-medium tabular-nums"
              style={{
                color: "var(--status-success)",
                fontFamily: "monospace",
                letterSpacing: "0.04em",
              }}
            >
              {countdown}
            </span>
          )}

          {/* CTA encaixar no livre */}
          {isAvailable && (
            <button
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded transition-all opacity-0 group-hover:opacity-100"
              style={{
                background: "rgba(29,185,84,0.1)",
                color: "var(--status-success)",
                border: "1px solid rgba(29,185,84,0.2)",
              }}
            >
              Encaixar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Componente: Card de barbeiro ── */
function BarbeiroCard({ b }: { b: Barbeiro }): React.JSX.Element {
  const stateColor = {
    active: "var(--status-success)",
    idle: "var(--text-muted)",
    late: "var(--status-error)",
  }[b.state];

  const stateBg = {
    active: "rgba(29,185,84,0.08)",
    idle: "transparent",
    late: "rgba(255,77,79,0.08)",
  }[b.state];

  const stateBorder = {
    active: "rgba(29,185,84,0.2)",
    idle: "var(--border-default)",
    late: "rgba(255,77,79,0.2)",
  }[b.state];

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: stateBg !== "transparent" ? stateBg : "var(--bg-card)",
        border: `1px solid ${stateBorder}`,
        boxShadow:
          b.state === "active"
            ? "0 0 20px rgba(29,185,84,0.08)"
            : b.state === "late"
              ? "0 0 16px rgba(255,77,79,0.08)"
              : "none",
        transition: "all 200ms",
        padding: "12px 14px",
      }}
    >
      {/* Barra lateral de estado */}
      <div
        className="absolute left-0 top-3 bottom-3 rounded-r"
        style={{
          width: 2,
          background: stateColor,
          animation:
            b.state === "active"
              ? "tqe-sidebar-pulse 2s ease-in-out infinite"
              : b.state === "late"
                ? "tqe-sidebar-pulse-red 1.5s ease-in-out infinite"
                : "none",
        }}
      />

      <div className="flex items-center gap-3 pl-2">
        {/* Avatar */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm relative"
          style={{
            width: 36,
            height: 36,
            background: `${stateColor}18`,
            color: stateColor,
            border: `1px solid ${stateColor}30`,
            fontFamily: "var(--font-heading)",
          }}
        >
          {b.initial}
          {/* Indicator online */}
          <span
            className="absolute bottom-0 right-0 rounded-full"
            style={{
              width: 9,
              height: 9,
              background: stateColor,
              border: "2px solid var(--bg-card)",
              animation:
                b.state !== "idle"
                  ? "tqe-pulse-green 2s ease-in-out infinite"
                  : "none",
            }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span
            className="block font-medium text-[13px] truncate"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {b.nome}
          </span>
          <span
            className="text-[11px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {b.agendamentos} hoje · {b.livres} livres
          </span>
        </div>

        {/* Estado badge */}
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: stateColor }}
        >
          {b.state === "active"
            ? "Ativo"
            : b.state === "late"
              ? "Atrasado"
              : "Livre"}
        </span>
      </div>
    </motion.div>
  );
}

/* ── Página principal ── */
export default function Agenda(): React.JSX.Element {
  const [selectedDate, setSelectedDate] = useState(0); // índice relativo ao hoje
  const [filterBarbeiro, setFilterBarbeiro] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const slots = useActiveProgress(SLOTS_INICIAL);

  // Gera os 7 dias ao redor de hoje para o seletor
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i);
    return d;
  });

  // Filtra slots
  const filtered = slots.filter((s) => {
    if (filterBarbeiro !== "Todos" && s.barbeiro !== filterBarbeiro)
      return false;
    if (filterStatus !== "Todos" && s.status !== filterStatus.toLowerCase())
      return false;
    if (
      searchQuery &&
      !s.client.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // Métricas rápidas ao vivo
  const totalHoje = slots.filter(
    (s) => !["blocked", "available"].includes(s.status),
  ).length;
  const ativos = slots.filter((s) => s.status === "active").length;
  const pendentes = slots.filter((s) => s.status === "pending").length;
  const livres = slots.filter((s) => s.status === "available").length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* ── Seletor de data ── */}
      <div className="flex items-center gap-3">
        <button
          className="p-1.5 rounded-lg transition-colors"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
          onClick={() => setSelectedDate((d) => d - 1)}
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex gap-1.5 flex-1 overflow-x-auto">
          {days.map((d, i) => {
            const idx = i - 3;
            const isToday = idx === 0;
            const isSelected = idx === selectedDate;
            return (
              <motion.button
                key={i}
                onClick={() => setSelectedDate(idx)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                className="flex flex-col items-center px-3 py-2 rounded-lg flex-shrink-0 transition-all"
                style={{
                  background: isSelected
                    ? "var(--primary)"
                    : isToday
                      ? "var(--bg-hover)"
                      : "var(--bg-card)",
                  border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-default)"}`,
                  color: isSelected
                    ? "#0D0D0D"
                    : isToday
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  boxShadow: isSelected
                    ? "0 0 14px rgba(244,180,0,0.2)"
                    : "none",
                  minWidth: 52,
                }}
              >
                <span
                  className="text-[10px] font-medium uppercase tracking-wider"
                  style={{ opacity: isSelected ? 0.7 : 0.6 }}
                >
                  {DIAS[d.getDay()]}
                </span>
                <span
                  className="text-[15px] font-bold leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {d.getDate()}
                </span>
              </motion.button>
            );
          })}
        </div>

        <button
          className="p-1.5 rounded-lg transition-colors"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
          onClick={() => setSelectedDate((d) => d + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* ── Métricas ao vivo ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Agendamentos",
            value: totalHoje,
            color: "var(--status-info)",
          },
          {
            label: "Em atendimento",
            value: ativos,
            color: "var(--status-success)",
          },
          {
            label: "Pendentes",
            value: pendentes,
            color: "var(--status-warning)",
          },
          { label: "Livres", value: livres, color: "var(--text-secondary)" },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.22 }}
            className="rounded-xl px-4 py-3 relative overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            {/* Linha de acento no topo */}
            <div
              className="absolute top-0 left-4 right-4 rounded-b"
              style={{ height: 2, background: m.color, opacity: 0.6 }}
            />
            <motion.span
              key={m.value}
              initial={{ y: 4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="block font-bold leading-none mb-1"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 24,
                color: m.color,
                letterSpacing: "-0.04em",
              }}
            >
              {m.value}
            </motion.span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {m.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── Layout principal: slots + barbeiros ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
        {/* ── Coluna de slots ── */}
        <div className="space-y-3">
          {/* Filtros inline */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex items-center">
              <Search
                size={13}
                className="absolute left-2.5"
                style={{ color: "var(--text-muted)", pointerEvents: "none" }}
              />
              <input
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Buscar cliente..."
                style={{
                  paddingLeft: 28,
                  height: 30,
                  fontSize: 12,
                  width: 160,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 6,
                  color: "var(--text-primary)",
                  outline: "none",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>

            <Filter size={13} style={{ color: "var(--text-muted)" }} />

            {/* Filtro barbeiro */}
            <div className="flex gap-1">
              {["Todos", ...BARBEIROS.map((b) => b.nome)].map((name) => (
                <button
                  key={name}
                  onClick={() => setFilterBarbeiro(name)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                  style={{
                    background:
                      filterBarbeiro === name
                        ? "var(--bg-hover)"
                        : "transparent",
                    border: `1px solid ${filterBarbeiro === name ? "var(--border-strong)" : "transparent"}`,
                    color:
                      filterBarbeiro === name
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {name}
                </button>
              ))}
            </div>

            <div
              className="self-stretch"
              style={{ width: 1, background: "var(--border-subtle)" }}
            />

            {/* Filtro status */}
            {[
              { key: "Todos", label: "Todos" },
              { key: "active", label: "Ativos" },
              { key: "confirmed", label: "Confirmados" },
              { key: "pending", label: "Pendentes" },
              { key: "available", label: "Livres" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className="px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                style={{
                  background:
                    filterStatus === f.key ? "var(--bg-hover)" : "transparent",
                  border: `1px solid ${filterStatus === f.key ? "var(--border-strong)" : "transparent"}`,
                  color:
                    filterStatus === f.key
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {f.label}
              </button>
            ))}

            <div className="flex-1" />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3 rounded-lg font-semibold text-[12px]"
              style={{
                height: 32,
                background: "var(--primary)",
                color: "#0D0D0D",
                fontFamily: "var(--font-body)",
                boxShadow: "0 0 12px rgba(244,180,0,0.2)",
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Agendar</span>
            </motion.button>
          </div>

          {/* Lista de slots */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((slot, i) => (
                  <AgendaSlot key={slot.id} slot={slot} index={i} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-3"
                >
                  <div
                    className="flex items-center justify-center rounded-xl"
                    style={{
                      width: 48,
                      height: 48,
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <CalendarIcon size={20} />
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    Nenhum agendamento encontrado
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Coluna lateral: barbeiros ── */}
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Barbeiros
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              {BARBEIROS.filter((b) => b.state === "active").length} ativos
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {BARBEIROS.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.2 }}
              >
                <BarbeiroCard b={b} />
              </motion.div>
            ))}
          </div>

          {/* Legenda */}
          <div
            className="rounded-xl p-4 space-y-2.5 mt-2"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <span
              className="block text-[10px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Legenda
            </span>
            {[
              { color: "var(--status-success)", label: "Atendendo" },
              { color: "var(--status-info)", label: "Confirmado" },
              { color: "var(--status-warning)", label: "Pendente" },
              { color: "var(--status-error)", label: "Atrasado" },
              { color: "var(--text-muted)", label: "Bloqueado / Livre" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <span
                  className="rounded-sm flex-shrink-0"
                  style={{ width: 8, height: 8, background: l.color }}
                />
                <span
                  className="text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {l.label}
                </span>
              </div>
            ))}
          </div>

          {/* Status ao vivo da barbearia */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <span
                className="rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  background: "var(--status-success)",
                  animation: "tqe-pulse-green 1.5s ease-in-out infinite",
                }}
              />
              <span
                className="text-[11px] font-semibold"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Status ao vivo
              </span>
            </div>

            <div className="px-4 py-3 space-y-2.5">
              {[
                {
                  label: "Barbeiros ativos",
                  value: "3",
                  color: "var(--status-success)",
                },
                {
                  label: "Próximo horário",
                  value: "10:30",
                  color: "var(--text-primary)",
                },
                {
                  label: "Aguardando",
                  value: "2",
                  color: "var(--status-warning)",
                },
                {
                  label: "Tempo médio hoje",
                  value: "38min",
                  color: "var(--status-info)",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between"
                >
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {stat.label}
                  </span>
                  <span
                    className="text-[12px] font-semibold tabular-nums"
                    style={{
                      color: stat.color,
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Inline Calendar icon for empty state */
function CalendarIcon({ size }: { size: number }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
