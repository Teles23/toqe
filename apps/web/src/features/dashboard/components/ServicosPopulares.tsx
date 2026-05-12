/* eslint-disable no-restricted-syntax */
"use client";

import React from "react";
import { motion } from "framer-motion";
import type { ServicoPopular } from "../types/dashboard.types";

interface ServicosPopularesProps {
  servicos: ServicoPopular[];
}

/** Lista ranqueada de serviços mais pedidos com barra de proporção. */
export function ServicosPopulares({
  servicos,
}: ServicosPopularesProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.22 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="font-semibold text-[13px]"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          Serviços mais pedidos
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Esta semana
        </span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {servicos.map((s, i) => (
          <motion.div
            key={s.nome}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.52 + i * 0.05 }}
            className="flex items-center gap-4"
          >
            <span
              className="flex-shrink-0 font-bold text-[12px] w-4 text-right"
              style={{
                fontFamily: "var(--font-heading)",
                color: i === 0 ? "var(--status-warning)" : "var(--text-muted)",
              }}
            >
              {i + 1}
            </span>

            <span
              className="flex-shrink-0 text-[13px] font-medium"
              style={{ color: "var(--text-primary)", width: 120 }}
            >
              {s.nome}
            </span>

            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ height: 3, background: "var(--border-default)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    i === 0
                      ? "var(--status-success)"
                      : i === 1
                        ? "var(--status-info)"
                        : "var(--text-muted)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{
                  delay: 0.6 + i * 0.05,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>

            <span
              className="flex-shrink-0 text-[12px] tabular-nums w-8 text-right"
              style={{ color: "var(--text-secondary)" }}
            >
              {s.quantidade}x
            </span>

            <span
              className="flex-shrink-0 text-[12px] font-semibold tabular-nums w-16 text-right"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              R${s.receita}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
