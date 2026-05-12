"use client";

import { motion } from "framer-motion";
import { ESTADO_CONFIG } from "../constants/barbeiro.constants";
import type { Barbeiro } from "../types/barbeiro.types";

interface BarbeiroCardProps {
  b: Barbeiro;
  selected: boolean;
  onClick: () => void;
}

export function BarbeiroCard({ b, selected, onClick }: BarbeiroCardProps) {
  const cfg = ESTADO_CONFIG[b.estado];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="relative rounded-xl overflow-hidden cursor-pointer p-4"
      style={{
        background: selected ? `${cfg.color}06` : "var(--bg-card)",
        border: `1px solid ${selected ? cfg.border : "var(--border-default)"}`,
        boxShadow: selected && cfg.glowBox !== "none" ? cfg.glowBox : "none",
        transition: "all 180ms",
      }}
    >
      <div
        className="absolute left-0 top-3 bottom-3 rounded-r"
        style={{
          width: 2,
          background: cfg.color,
          opacity: b.estado === "off" ? 0.2 : 1,
          animation:
            b.estado === "active"
              ? "tqe-sidebar-pulse 2s ease-in-out infinite"
              : "none",
        }}
      />

      <div className="flex items-start gap-3 pl-2">
        <div className="relative flex-shrink-0">
          <div
            className="flex items-center justify-center rounded-full font-bold text-sm"
            style={{
              width: 40,
              height: 40,
              background: `${cfg.color}15`,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              fontFamily: "var(--font-heading)",
            }}
          >
            {b.initial}
          </div>
          <span
            className="absolute bottom-0 right-0 rounded-full"
            style={{
              width: 10,
              height: 10,
              background: cfg.color,
              border: "2px solid var(--bg-card)",
              animation:
                b.estado === "active"
                  ? "tqe-pulse-green 2s ease-in-out infinite"
                  : "none",
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span
              className="font-semibold text-[13px]"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {b.nome}
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>

          {b.especialidade && (
            <span
              className="block text-[11px] mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {b.especialidade}
            </span>
          )}

          <div className="flex items-center gap-3">
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              {b.atendimentosHoje} hoje
            </span>
            <span style={{ color: "var(--border-default)" }}>·</span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              R${Math.round(b.ticketMedio)} ticket
            </span>
            {b.avaliacao > 0 && (
              <>
                <span style={{ color: "var(--border-default)" }}>·</span>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--status-warning)" }}
                >
                  ★ {b.avaliacao.toFixed(1)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
