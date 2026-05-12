"use client";

import { motion } from "framer-motion";
import { BarbeiroCard } from "./BarbeiroCard";
import type { Barbeiro, Slot } from "../types/agenda.types";

const LEGEND = [
  { color: "var(--status-success)", label: "Atendendo" },
  { color: "var(--status-info)", label: "Confirmado" },
  { color: "var(--status-warning)", label: "Pendente" },
  { color: "var(--status-error)", label: "Atrasado" },
  { color: "var(--text-muted)", label: "Bloqueado / Livre" },
];

interface BarbeiroPanelProps {
  barbeiros: Barbeiro[];
  slots: Slot[];
}

export function BarbeiroPanel({ barbeiros, slots }: BarbeiroPanelProps) {
  const ativos = barbeiros.filter((b) => b.state === "active").length;
  const pendentes = slots.filter((s) => s.status === "pending").length;
  const proxHorario = slots.find((s) => s.status === "confirmed")?.time ?? "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Barbeiros
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {ativos} ativos
        </span>
      </div>

      <div className="space-y-2">
        {barbeiros.map((b, i) => (
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
        {LEGEND.map((l) => (
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
              value: String(ativos),
              color: "var(--status-success)",
            },
            {
              label: "Próximo horário",
              value: proxHorario,
              color: "var(--text-primary)",
            },
            {
              label: "Aguardando",
              value: String(pendentes),
              color: "var(--status-warning)",
            },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span
                className="text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {stat.label}
              </span>
              <span
                className="text-[12px] font-semibold tabular-nums"
                style={{ color: stat.color, fontFamily: "var(--font-heading)" }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
