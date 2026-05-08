"use client";

import React from "react";
import StatCard from "@/components/stat-card";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Calendar,
  Clock,
  Phone,
  Plus,
  Scissors,
  TrendingUp,
  X
} from "lucide-react";
import { useState } from "react";

/* ── Tipos ── */
type BarbeiroEstado = "active" | "idle" | "off";

interface Barbeiro {
  id: number;
  nome: string;
  initial: string;
  telefone: string;
  especialidade: string;
  estado: BarbeiroEstado;
  atendimentosHoje: number;
  atendimentosMes: number;
  faturamentoMes: number;
  ticketMedio: number;
  avaliacao: number;
  clienteAtual?: string;
  servicoAtual?: string;
  progressoAtual?: number;
  horarioEntrada: string;
  diasSemana: string[];
}

/* ── Dados ── */
const BARBEIROS: Barbeiro[] = [
  {
    id: 1, nome: "Carlos Andrade", initial: "C",
    telefone: "(71) 99999-1001", especialidade: "Corte clássico + Barba",
    estado: "active", atendimentosHoje: 6, atendimentosMes: 112,
    faturamentoMes: 5600, ticketMedio: 50, avaliacao: 4.9,
    clienteAtual: "João Silva", servicoAtual: "Corte", progressoAtual: 68,
    horarioEntrada: "08:00", diasSemana: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  },
  {
    id: 2, nome: "Lucas Pereira", initial: "L",
    telefone: "(71) 99999-1002", especialidade: "Degradê + Pigmentação",
    estado: "idle", atendimentosHoje: 4, atendimentosMes: 98,
    faturamentoMes: 7840, ticketMedio: 80, avaliacao: 4.8,
    horarioEntrada: "09:00", diasSemana: ["Ter", "Qua", "Qui", "Sex", "Sáb"],
  },
  {
    id: 3, nome: "Felipe Matos", initial: "F",
    telefone: "(71) 99999-1003", especialidade: "Sobrancelha + Acabamento",
    estado: "active", atendimentosHoje: 5, atendimentosMes: 86,
    faturamentoMes: 3440, ticketMedio: 40, avaliacao: 4.7,
    clienteAtual: "Ana Costa", servicoAtual: "Sobrancelha", progressoAtual: 45,
    horarioEntrada: "08:00", diasSemana: ["Seg", "Qua", "Sex", "Sáb"],
  },
  {
    id: 4, nome: "Rodrigo Costa", initial: "R",
    telefone: "(71) 99999-1004", especialidade: "Afro + Tranças",
    estado: "off", atendimentosHoje: 0, atendimentosMes: 74,
    faturamentoMes: 4440, ticketMedio: 60, avaliacao: 4.6,
    horarioEntrada: "10:00", diasSemana: ["Qui", "Sex", "Sáb", "Dom"],
  },
];

const ESTADO_CONFIG: Record<BarbeiroEstado, { label: string; color: string; bg: string; border: string; glowBox: string }> = {
  active: { label: "Atendendo", color: "var(--status-success)", bg: "rgba(29,185,84,0.05)", border: "rgba(29,185,84,0.2)", glowBox: "0 0 24px rgba(29,185,84,0.1)" },
  idle:   { label: "Disponível", color: "var(--status-info)",    bg: "transparent",           border: "var(--border-default)",    glowBox: "none" },
  off:    { label: "Fora",       color: "var(--text-muted)",     bg: "transparent",           border: "var(--border-subtle)",     glowBox: "none" },
};

/* ── Painel de detalhe do barbeiro ── */
function BarbeiroDetalhe({ b, onClose }: { b: Barbeiro; onClose: () => void }): React.JSX.Element {
  const cfg = ESTADO_CONFIG[b.estado];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col overflow-hidden flex-shrink-0"
      style={{ width: 300, background: "var(--bg-card)", borderLeft: "1px solid var(--border-default)", height: "100%" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>Perfil do barbeiro</span>
        <button onClick={onClose} className="p-1 rounded-lg" style={{ color: "var(--text-muted)" }}><X size={15} /></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + info */}
        <div className="px-4 py-5 text-center" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="relative inline-block mb-3">
            <div className="flex items-center justify-center rounded-full font-bold text-xl"
              style={{ width: 56, height: 56, background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: "var(--font-heading)" }}>
              {b.initial}
            </div>
            <span className="absolute bottom-0.5 right-0.5 rounded-full"
              style={{ width: 11, height: 11, background: cfg.color, border: "2px solid var(--bg-card)",
                animation: b.estado === "active" ? "tqe-pulse-green 2s ease-in-out infinite" : "none" }} />
          </div>
          <span className="block font-bold text-[15px] mb-0.5" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{b.nome}</span>
          <span className="block text-[11px] mb-2" style={{ color: "var(--text-secondary)" }}>{b.especialidade}</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            <span className="rounded-full" style={{ width: 5, height: 5, background: cfg.color,
              animation: b.estado === "active" ? "tqe-pulse-green 1.5s ease-in-out infinite" : "none" }} />
            {cfg.label}
          </span>
        </div>

        {/* Atendimento atual */}
        {b.estado === "active" && b.clienteAtual && (
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(29,185,84,0.03)" }}>
            <span className="block text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--status-success)", opacity: 0.7 }}>Atendimento atual</span>
            <span className="block text-[13px] font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{b.clienteAtual}</span>
            <span className="block text-[11px] mb-2" style={{ color: "var(--text-secondary)" }}>{b.servicoAtual}</span>
            {b.progressoAtual !== undefined && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Progresso</span>
                  <span className="text-[10px] font-semibold" style={{ color: "var(--status-success)" }}>{b.progressoAtual}%</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 3, background: "var(--border-default)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: "var(--status-success)" }}
                    initial={{ width: 0 }} animate={{ width: `${b.progressoAtual}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-2 px-4 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          {[
            { label: "Hoje",        value: `${b.atendimentosHoje}`, suffix: "atend." },
            { label: "Este mês",    value: `${b.atendimentosMes}`, suffix: "atend." },
            { label: "Fat. mensal", value: `R$${(b.faturamentoMes / 1000).toFixed(1)}k`, suffix: "" },
            { label: "Avaliação",   value: b.avaliacao.toFixed(1), suffix: "★" },
          ].map(m => (
            <div key={m.label} className="rounded-lg px-3 py-2.5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
              <span className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{m.label}</span>
              <span className="font-bold text-[15px]" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                {m.value}
                {m.suffix && <span className="text-[11px] ml-0.5" style={{ color: "var(--text-secondary)" }}>{m.suffix}</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Horário */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <span className="block text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Escala</span>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={12} style={{ color: "var(--text-muted)" }} />
            <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>Entrada às {b.horarioEntrada}</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => (
              <span key={d} className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ background: b.diasSemana.includes(d) ? "rgba(29,185,84,0.1)" : "var(--bg-hover)",
                  color: b.diasSemana.includes(d) ? "var(--status-success)" : "var(--text-muted)" }}>
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Contato */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Phone size={12} style={{ color: "var(--text-muted)" }} />
            <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>{b.telefone}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold"
          style={{ background: "var(--primary)", color: "#0D0D0D" }}>
          <Calendar size={13} /> Ver agenda
        </button>
        <button className="px-3 flex items-center justify-center rounded-lg text-[12px]"
          style={{ background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>
          Editar
        </button>
      </div>
    </motion.div>
  );
}

/* ── Card do barbeiro na lista ── */
function BarbeiroCard({ b, selected, onClick }: { b: Barbeiro; selected: boolean; onClick: () => void }): React.JSX.Element {
  const cfg = ESTADO_CONFIG[b.estado];

  return (
    <motion.div whileHover={{ y: -2 }} onClick={onClick}
      className="relative rounded-xl overflow-hidden cursor-pointer p-4"
      style={{
        background: selected ? `${cfg.color}06` : "var(--bg-card)",
        border: `1px solid ${selected ? cfg.border : "var(--border-default)"}`,
        boxShadow: selected && cfg.glowBox !== "none" ? cfg.glowBox : "none",
        transition: "all 180ms",
      }}>
      <div className="absolute left-0 top-3 bottom-3 rounded-r"
        style={{ width: 2, background: cfg.color, opacity: b.estado === "off" ? 0.2 : 1,
          animation: b.estado === "active" ? "tqe-sidebar-pulse 2s ease-in-out infinite" : "none" }} />

      <div className="flex items-start gap-3 pl-2">
        <div className="relative flex-shrink-0">
          <div className="flex items-center justify-center rounded-full font-bold text-sm"
            style={{ width: 40, height: 40, background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: "var(--font-heading)" }}>
            {b.initial}
          </div>
          <span className="absolute bottom-0 right-0 rounded-full"
            style={{ width: 10, height: 10, background: cfg.color, border: "2px solid var(--bg-card)",
              animation: b.estado === "active" ? "tqe-pulse-green 2s ease-in-out infinite" : "none" }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-semibold text-[13px]" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{b.nome}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
          <span className="block text-[11px] mb-2" style={{ color: "var(--text-secondary)" }}>{b.especialidade}</span>

          {b.estado === "active" && b.clienteAtual && (
            <div className="mb-2">
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{b.clienteAtual} · {b.servicoAtual}</span>
              {b.progressoAtual !== undefined && (
                <div className="mt-1 rounded-full overflow-hidden" style={{ height: 2, background: "var(--border-default)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: "var(--status-success)" }}
                    initial={{ width: 0 }} animate={{ width: `${b.progressoAtual}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{b.atendimentosHoje} hoje</span>
            <span style={{ color: "var(--border-default)" }}>·</span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>R${b.ticketMedio} ticket</span>
            <span style={{ color: "var(--border-default)" }}>·</span>
            <span className="text-[11px]" style={{ color: "var(--status-warning)" }}>★ {b.avaliacao}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Página principal ── */
export default function Barbeiros(): React.JSX.Element {
  const [selected, setSelected] = useState<Barbeiro | null>(null);
  const [filterEstado, setFilterEstado] = useState<"todos" | BarbeiroEstado>("todos");

  const filtered = BARBEIROS.filter(b => filterEstado === "todos" || b.estado === filterEstado);

  const ativos      = BARBEIROS.filter(b => b.estado === "active").length;
  const disponiveis = BARBEIROS.filter(b => b.estado === "idle").length;
  const totalFat    = BARBEIROS.reduce((s, b) => s + b.faturamentoMes, 0);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 h-full">

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total de barbeiros", value: BARBEIROS.length, status: "info"    as const, icon: Scissors },
          { label: "Atendendo agora",    value: ativos,           status: "success" as const, icon: TrendingUp },
          { label: "Disponíveis",        value: disponiveis,      status: "warning" as const, icon: Clock },
          { label: "Fat. total mês",     value: totalFat, unit: "R$", status: "neutral" as const, icon: Award },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 min-h-0 gap-0 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-default)" }}>
        {/* Lista */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "var(--bg-card)" }}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="flex gap-1">
              {([
                { key: "todos",  label: "Todos" },
                { key: "active", label: "Atendendo" },
                { key: "idle",   label: "Livre" },
                { key: "off",    label: "Fora" },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setFilterEstado(f.key)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                  style={{
                    background: filterEstado === f.key ? "var(--bg-hover)" : "transparent",
                    border: `1px solid ${filterEstado === f.key ? "var(--border-strong)" : "transparent"}`,
                    color: filterEstado === f.key ? "var(--text-primary)" : "var(--text-muted)",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <button className="flex items-center gap-1.5 px-3 rounded-lg text-[12px] font-semibold"
              style={{ height: 32, background: "var(--primary)", color: "#0D0D0D" }}>
              <Plus size={13} strokeWidth={2.5} /> Novo barbeiro
            </button>
          </div>

          {/* Grid de cards */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence>
                {filtered.map((b, i) => (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
                    <BarbeiroCard b={b} selected={selected?.id === b.id}
                      onClick={() => setSelected(selected?.id === b.id ? null : b)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Painel detalhe */}
        <AnimatePresence>
          {selected && <BarbeiroDetalhe b={selected} onClose={() => setSelected(null)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
