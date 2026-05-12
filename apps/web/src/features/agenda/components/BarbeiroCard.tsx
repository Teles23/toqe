"use client";

import { motion } from "framer-motion";
import type { Barbeiro } from "../types/agenda.types";

const STATE_COLOR = {
  active: "var(--status-success)",
  idle: "var(--text-muted)",
  late: "var(--status-error)",
};

const STATE_BG = {
  active: "rgba(29,185,84,0.08)",
  idle: "transparent",
  late: "rgba(255,77,79,0.08)",
};

const STATE_BORDER = {
  active: "rgba(29,185,84,0.2)",
  idle: "var(--border-default)",
  late: "rgba(255,77,79,0.2)",
};

const STATE_LABEL = { active: "Ativo", idle: "Livre", late: "Atrasado" };

export function BarbeiroCard({ b }: { b: Barbeiro }) {
  const color = STATE_COLOR[b.state];
  const bg = STATE_BG[b.state];
  const border = STATE_BORDER[b.state];

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: bg !== "transparent" ? bg : "var(--bg-card)",
        border: `1px solid ${border}`,
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
      <div
        className="absolute left-0 top-3 bottom-3 rounded-r"
        style={{
          width: 2,
          background: color,
          animation:
            b.state === "active"
              ? "tqe-sidebar-pulse 2s ease-in-out infinite"
              : b.state === "late"
                ? "tqe-sidebar-pulse-red 1.5s ease-in-out infinite"
                : "none",
        }}
      />

      <div className="flex items-center gap-3 pl-2">
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm relative"
          style={{
            width: 36,
            height: 36,
            background: `${color}18`,
            color,
            border: `1px solid ${color}30`,
            fontFamily: "var(--font-heading)",
          }}
        >
          {b.initial}
          <span
            className="absolute bottom-0 right-0 rounded-full"
            style={{
              width: 9,
              height: 9,
              background: color,
              border: "2px solid var(--bg-card)",
              animation:
                b.state !== "idle"
                  ? "tqe-pulse-green 2s ease-in-out infinite"
                  : "none",
            }}
          />
        </div>

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

        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color }}
        >
          {STATE_LABEL[b.state]}
        </span>
      </div>
    </motion.div>
  );
}
