"use client";

import { motion } from "framer-motion";
import { Scissors, DollarSign, Clock } from "lucide-react";
import { CATEGORIA_CONFIG } from "../constants/servico.constants";
import type { ServicoAPI } from "../types/servico.types";

interface ServicoCardProps {
  s: ServicoAPI;
  index: number;
  selected: boolean;
  onClick: () => void;
}

export function ServicoCard({ s, index, selected, onClick }: ServicoCardProps) {
  const categoria =
    (s as unknown as { categoria?: string }).categoria ?? "corte";
  const cfg =
    CATEGORIA_CONFIG[categoria as keyof typeof CATEGORIA_CONFIG] ??
    CATEGORIA_CONFIG.corte;

  return (
    <motion.div
      key={s.codigo}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="rounded-xl p-4 cursor-pointer relative overflow-hidden"
      style={{
        background: selected ? `${cfg.color}06` : "var(--bg-secondary)",
        border: `1px solid ${selected ? cfg.color + "40" : "var(--border-default)"}`,
        transition: "all 160ms",
        opacity: s.ativo ? 1 : 0.55,
      }}
    >
      <div
        className="absolute top-0 left-4 right-4 rounded-b"
        style={{ height: 2, background: cfg.color, opacity: 0.5 }}
      />

      <div className="flex items-start justify-between mb-3 mt-1">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 34,
            height: 34,
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.color}25`,
          }}
        >
          <Scissors size={15} strokeWidth={1.8} />
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          {!s.ativo && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "var(--text-muted)",
              }}
            >
              Inativo
            </span>
          )}
        </div>
      </div>

      <span
        className="block font-semibold text-[13px] mb-0.5"
        style={{
          fontFamily: "var(--font-heading)",
          color: "var(--text-primary)",
        }}
      >
        {s.nome}
      </span>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <DollarSign size={11} style={{ color: "var(--text-muted)" }} />
            <span
              className="text-[13px] font-bold"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              R${Number(s.precoBase ?? 0).toFixed(0)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={11} style={{ color: "var(--text-muted)" }} />
            <span
              className="text-[12px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {s.duracaoBase ?? 0}min
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
