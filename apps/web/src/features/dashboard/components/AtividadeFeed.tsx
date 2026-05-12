/* eslint-disable no-restricted-syntax */
"use client";

import React from "react";
import { motion } from "framer-motion";
import type { AtividadeItem } from "../types/dashboard.types";

interface AtividadeFeedProps {
  items: AtividadeItem[];
}

/** Sidebar com feed de atividade recente. */
export function AtividadeFeed({
  items,
}: AtividadeFeedProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.42, duration: 0.22 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3.5"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="font-semibold text-[13px]"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          Atividade recente
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded font-semibold"
          style={{
            background: "rgba(77,163,255,0.1)",
            color: "var(--status-info)",
          }}
        >
          Ao vivo
        </span>
      </div>

      <div className="py-1">
        {items.map((a, i) => (
          <motion.div
            key={`${a.tipo}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.05 }}
            className="flex items-start gap-3 px-4 py-2.5 cursor-pointer"
            style={{ transition: "background 120ms" }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span
              className="flex-shrink-0 rounded-full mt-1.5"
              style={{ width: 6, height: 6, background: a.cor }}
            />
            <div className="flex-1 min-w-0">
              <span
                className="block text-[12px]"
                style={{ color: "var(--text-primary)", lineHeight: 1.4 }}
              >
                {a.texto}
              </span>
            </div>
            <span
              className="text-[10px] flex-shrink-0 mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {a.tempo}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
