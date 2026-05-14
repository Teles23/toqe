/* eslint-disable no-restricted-syntax */
"use client";

import { motion } from "framer-motion";
import type { BarbeiroItem } from "../types/relatorio.types";
import { formatBRL } from "@/shared/lib/utils";

interface BarbeirosRankingProps {
  data: BarbeiroItem[];
}

export function BarbeirosRanking({ data }: BarbeirosRankingProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div
        className="px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="block font-semibold text-[13px]"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          Performance por barbeiro
        </span>
      </div>

      {/* Header tabela */}
      <div
        className="grid px-5 py-2"
        style={{
          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)",
        }}
      >
        {["Barbeiro", "Atend.", "Faturamento", "Ticket médio", "Avaliação"].map(
          (h) => (
            <span
              key={h}
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {h}
            </span>
          ),
        )}
      </div>

      {data.map((b, i) => (
        <motion.div
          key={b.nome}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="grid px-5 py-3.5 items-center"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            borderBottom:
              i < data.length - 1 ? "1px solid var(--border-subtle)" : "none",
            transition: "background 120ms",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "transparent")
          }
        >
          <div className="flex items-center gap-2.5">
            <span
              className="font-bold text-[11px] flex-shrink-0"
              style={{
                color: i === 0 ? "var(--status-warning)" : "var(--text-muted)",
                fontFamily: "var(--font-heading)",
                width: 16,
              }}
            >
              {i + 1}
            </span>
            <div
              className="flex items-center justify-center rounded-full font-bold text-xs flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                background: "rgba(77,163,255,0.1)",
                color: "var(--status-info)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {b.nome[0]}
            </div>
            <span
              className="text-[13px] font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {b.nome}
            </span>
          </div>

          <span
            className="text-[13px] tabular-nums"
            style={{ color: "var(--text-secondary)" }}
          >
            {b.atendimentos}x
          </span>

          <span
            className="text-[13px] font-semibold tabular-nums"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {formatBRL(b.faturamento / 1000)}k
          </span>

          <span
            className="text-[13px] tabular-nums"
            style={{ color: "var(--text-secondary)" }}
          >
            {formatBRL(b.ticketMedio)}
          </span>

          <span
            className="text-[13px]"
            style={{ color: "var(--status-warning)" }}
          >
            ★ {b.avaliacao.toFixed(1)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
