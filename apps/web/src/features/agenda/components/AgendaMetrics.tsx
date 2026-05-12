/* eslint-disable no-restricted-syntax */
"use client";

import { motion } from "framer-motion";
import type { Slot } from "../types/agenda.types";

interface AgendaMetricsProps {
  slots: Slot[];
}

export function AgendaMetrics({ slots }: AgendaMetricsProps) {
  const total = slots.filter(
    (s) => !["blocked", "available"].includes(s.status),
  ).length;
  const ativos = slots.filter((s) => s.status === "active").length;
  const pendentes = slots.filter((s) => s.status === "pending").length;
  const livres = slots.filter((s) => s.status === "available").length;

  const metrics = [
    { label: "Agendamentos", value: total, color: "var(--status-info)" },
    { label: "Em atendimento", value: ativos, color: "var(--status-success)" },
    { label: "Pendentes", value: pendentes, color: "var(--status-warning)" },
    { label: "Livres", value: livres, color: "var(--text-secondary)" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metrics.map((m, i) => (
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
  );
}
