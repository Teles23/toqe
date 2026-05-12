/* eslint-disable no-restricted-syntax */
"use client";

import React from "react";
import { motion } from "framer-motion";
import type { BarbeiroStatus } from "../types/dashboard.types";

interface BarbeiroLiveProps {
  b: BarbeiroStatus;
}

/** Card de status ao vivo de um único barbeiro (usado em LiveStatusCard). */
export function BarbeiroLive({ b }: BarbeiroLiveProps): React.JSX.Element {
  const stateColor =
    b.estado === "active" ? "var(--status-success)" : "var(--text-muted)";

  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl relative overflow-hidden"
      style={{
        background:
          b.estado === "active" ? "rgba(29,185,84,0.04)" : "transparent",
        border: `1px solid ${b.estado === "active" ? "rgba(29,185,84,0.15)" : "var(--border-subtle)"}`,
        transition: "all 200ms",
      }}
    >
      {b.estado === "active" && (
        <div
          className="absolute left-0 top-2 bottom-2 rounded-r"
          style={{
            width: 2,
            background: "var(--status-success)",
            animation: "tqe-sidebar-pulse 2s ease-in-out infinite",
          }}
        />
      )}

      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-xs relative"
        style={{
          width: 32,
          height: 32,
          background: `${stateColor}18`,
          color: stateColor,
          border: `1px solid ${stateColor}30`,
          fontFamily: "var(--font-heading)",
        }}
      >
        {b.initial}
        <span
          className="absolute bottom-0 right-0 rounded-full"
          style={{
            width: 8,
            height: 8,
            background: stateColor,
            border: "2px solid var(--bg-card)",
            animation:
              b.estado === "active"
                ? "tqe-pulse-green 2s ease-in-out infinite"
                : "none",
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <span
          className="block font-medium text-[13px]"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
          }}
        >
          {b.nome}
        </span>
        {b.estado === "active" && b.cliente ? (
          <>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {b.cliente} · {b.servico}
            </span>
            <div
              className="mt-1.5 rounded-full overflow-hidden"
              style={{
                height: 2,
                background: "var(--border-default)",
                width: "100%",
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--status-success)" }}
                initial={{ width: 0 }}
                animate={{ width: `${b.pct}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </>
        ) : (
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Disponível
          </span>
        )}
      </div>

      <span
        className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0"
        style={{ color: stateColor }}
      >
        {b.estado === "active" ? "Ativo" : "Livre"}
      </span>
    </div>
  );
}
