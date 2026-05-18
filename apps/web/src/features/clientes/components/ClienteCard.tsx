"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Cliente } from "../types/cliente.types";
import { STATUS_CONFIG } from "../constants/cliente.constants";
import { formatBRL } from "@/shared/lib/utils";

interface ClienteCardProps {
  cliente: Cliente;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export function ClienteCard({
  cliente,
  index,
  isSelected,
  onClick,
}: ClienteCardProps) {
  const statusCfg = STATUS_CONFIG[cliente.status];

  const sharedStyle = {
    borderBottom: "1px solid var(--border-subtle)",
    background: isSelected ? "rgba(77,163,255,0.04)" : "transparent",
    borderLeft: `2px solid ${isSelected ? "var(--status-info)" : "transparent"}`,
    transition: "background 120ms, border-color 120ms",
  };

  const avatar = (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-xs"
      style={{
        width: 30,
        height: 30,
        background: `${statusCfg.color}15`,
        color: statusCfg.color,
        fontFamily: "var(--font-heading)",
      }}
    >
      {cliente.initial}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
    >
      {/* Mobile card */}
      <div
        className="flex md:hidden items-center gap-3 px-4 py-3 cursor-pointer"
        style={sharedStyle}
        onMouseEnter={(e) => {
          if (!isSelected)
            (e.currentTarget as HTMLElement).style.background =
              "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (!isSelected)
            (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        {avatar}
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {cliente.nome}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {cliente.ultimaVisita
              ? `Última visita: ${cliente.ultimaVisita}`
              : "Sem visitas"}{" "}
            · {cliente.totalVisitas}x
          </p>
        </div>
        <span
          className="text-[13px] font-semibold flex-shrink-0"
          style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}
        >
          {formatBRL(cliente.totalGasto)}
        </span>
      </div>

      {/* Desktop table row */}
      <div
        className="hidden md:flex items-center px-4 py-3 cursor-pointer"
        style={sharedStyle}
        onMouseEnter={(e) => {
          if (!isSelected)
            (e.currentTarget as HTMLElement).style.background =
              "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (!isSelected)
            (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <div className="flex items-center gap-3 flex-[2] min-w-0">
          {avatar}
          <div className="min-w-0">
            <span
              className="block text-[13px] font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {cliente.nome}
            </span>
            <span
              className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
          </div>
        </div>

        <span
          className="flex-1 text-[12px]"
          style={{ color: "var(--text-secondary)" }}
        >
          {cliente.ultimaVisita ?? "—"}
        </span>

        <span
          className="flex-1 text-[12px] text-right tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {cliente.totalVisitas}x
        </span>

        <span
          className="flex-1 text-[12px] text-right font-semibold tabular-nums"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-heading)",
          }}
        >
          {formatBRL(cliente.totalGasto)}
        </span>

        <span
          className="flex-1 text-[12px] text-right truncate"
          style={{ color: "var(--text-secondary)" }}
        >
          {cliente.servicoFav ?? "—"}
        </span>

        <div style={{ width: 32, textAlign: "right" }}>
          <ChevronRight size={13} style={{ color: "var(--text-muted)" }} />
        </div>
      </div>
    </motion.div>
  );
}
