"use client";

import { motion } from "framer-motion";
import { X, Clock, Phone, Calendar } from "lucide-react";
import { ESTADO_CONFIG } from "../constants/barbeiro.constants";
import type { Barbeiro } from "../types/barbeiro.types";

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function BarbeiroDetalhe({
  b,
  onClose,
}: {
  b: Barbeiro;
  onClose: () => void;
}) {
  const cfg = ESTADO_CONFIG[b.estado];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col overflow-hidden flex-shrink-0"
      style={{
        width: 300,
        background: "var(--bg-card)",
        borderLeft: "1px solid var(--border-default)",
        height: "100%",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-[12px] font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          Perfil do barbeiro
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-5 text-center"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="relative inline-block mb-3">
            <div
              className="flex items-center justify-center rounded-full font-bold text-xl"
              style={{
                width: 56,
                height: 56,
                background: `${cfg.color}15`,
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
                fontFamily: "var(--font-heading)",
              }}
            >
              {b.initial}
            </div>
            <span
              className="absolute bottom-0.5 right-0.5 rounded-full"
              style={{
                width: 11,
                height: 11,
                background: cfg.color,
                border: "2px solid var(--bg-card)",
                animation:
                  b.estado === "active"
                    ? "tqe-pulse-green 2s ease-in-out infinite"
                    : "none",
              }}
            />
          </div>
          <span
            className="block font-bold text-[15px] mb-0.5"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            {b.nome}
          </span>
          {b.especialidade && (
            <span
              className="block text-[11px] mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {b.especialidade}
            </span>
          )}
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: `${cfg.color}12`,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
            }}
          >
            <span
              className="rounded-full"
              style={{
                width: 5,
                height: 5,
                background: cfg.color,
                animation:
                  b.estado === "active"
                    ? "tqe-pulse-green 1.5s ease-in-out infinite"
                    : "none",
              }}
            />
            {cfg.label}
          </span>
        </div>

        <div
          className="grid grid-cols-2 gap-2 px-4 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {[
            { label: "Hoje", value: `${b.atendimentosHoje}`, suffix: "atend." },
            {
              label: "Este mês",
              value: `${b.atendimentosMes}`,
              suffix: "atend.",
            },
            {
              label: "Fat. mensal",
              value: `R$${(b.faturamentoMes / 1000).toFixed(1)}k`,
              suffix: "",
            },
            {
              label: "Ticket médio",
              value: `R$${Math.round(b.ticketMedio)}`,
              suffix: "",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg px-3 py-2.5"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span
                className="block text-[10px] uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {m.label}
              </span>
              <span
                className="font-bold text-[15px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                }}
              >
                {m.value}
                {m.suffix && (
                  <span
                    className="text-[11px] ml-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {m.suffix}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span
            className="block text-[10px] uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Escala
          </span>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={12} style={{ color: "var(--text-muted)" }} />
            <span
              className="text-[12px]"
              style={{ color: "var(--text-primary)" }}
            >
              Entrada às {b.horarioEntrada}
            </span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {DIAS_SEMANA.map((d) => (
              <span
                key={d}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  background: b.diasSemana.includes(d)
                    ? "rgba(29,185,84,0.1)"
                    : "var(--bg-hover)",
                  color: b.diasSemana.includes(d)
                    ? "var(--status-success)"
                    : "var(--text-muted)",
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {b.telefone && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Phone size={12} style={{ color: "var(--text-muted)" }} />
              <span
                className="text-[12px]"
                style={{ color: "var(--text-primary)" }}
              >
                {b.telefone}
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        className="flex gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <button
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold"
          style={{ background: "var(--primary)", color: "#0D0D0D" }}
        >
          <Calendar size={13} /> Ver agenda
        </button>
        <button
          className="px-3 flex items-center justify-center rounded-lg text-[12px]"
          style={{
            background: "transparent",
            border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)",
          }}
        >
          Editar
        </button>
      </div>
    </motion.div>
  );
}
