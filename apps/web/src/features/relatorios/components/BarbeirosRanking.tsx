"use client";

import { motion } from "framer-motion";
import type { BarbeiroItem } from "../types/relatorio.types";
import { formatBRL } from "@/shared/lib/utils";

interface BarbeirosRankingProps {
  data: BarbeiroItem[];
}

export function BarbeirosRanking({ data }: BarbeirosRankingProps) {
  return (
    <div className="rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-default)]">
      <div className="px-5 py-3.5 border-b border-[var(--border-subtle)]">
        <span className="block font-semibold text-[13px] font-heading text-[var(--text-primary)]">
          Performance por barbeiro
        </span>
      </div>

      {/* Desktop table header */}
      <div
        className="hidden md:grid px-5 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}
      >
        {["Barbeiro", "Atend.", "Faturamento", "Ticket médio", "Avaliação"].map(
          (h) => (
            <span
              key={h}
              className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
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
          className="transition-colors duration-[120ms]"
          style={{
            borderBottom:
              i < data.length - 1 ? "1px solid var(--border-subtle)" : "none",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "transparent")
          }
        >
          {/* Mobile card */}
          <div className="flex items-center gap-3 px-4 py-3 md:hidden">
            <span
              className="font-bold text-[11px] flex-shrink-0 w-4 text-center font-heading"
              style={{
                color:
                  i === 0
                    ? "var(--status-warning)"
                    : "var(--text-muted)" /* CSS var dinâmico — não migrar */,
              }}
            >
              {i + 1}
            </span>
            <div className="flex items-center justify-center rounded-full font-bold text-xs flex-shrink-0 w-8 h-8 bg-[rgba(77,163,255,0.1)] text-[var(--status-info)] font-heading">
              {b.nome[0]}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[13px] font-medium truncate text-[var(--text-primary)]">
                {b.nome}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {b.atendimentos}x
                </span>
                <span className="text-[11px] text-[var(--status-warning)]">
                  ★ {b.avaliacao.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)] font-heading">
                {formatBRL(b.faturamento / 1000)}k
              </span>
              <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                {formatBRL(b.ticketMedio)} ticket
              </span>
            </div>
          </div>

          {/* Desktop table row */}
          <div
            className="hidden md:grid px-5 py-3.5 items-center"
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="font-bold text-[11px] flex-shrink-0 font-heading"
                style={{
                  color:
                    i === 0
                      ? "var(--status-warning)"
                      : "var(--text-muted)" /* CSS var dinâmico — não migrar */,
                  width: 16,
                }}
              >
                {i + 1}
              </span>
              <div className="flex items-center justify-center rounded-full font-bold text-xs flex-shrink-0 w-7 h-7 bg-[rgba(77,163,255,0.1)] text-[var(--status-info)] font-heading">
                {b.nome[0]}
              </div>
              <span className="text-[13px] font-medium text-[var(--text-primary)]">
                {b.nome}
              </span>
            </div>
            <span className="text-[13px] tabular-nums text-[var(--text-secondary)]">
              {b.atendimentos}x
            </span>
            <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)] font-heading">
              {formatBRL(b.faturamento / 1000)}k
            </span>
            <span className="text-[13px] tabular-nums text-[var(--text-secondary)]">
              {formatBRL(b.ticketMedio)}
            </span>
            <span className="text-[13px] text-[var(--status-warning)]">
              ★ {b.avaliacao.toFixed(1)}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
