/* eslint-disable no-restricted-syntax */
"use client";

import { motion } from "framer-motion";
import { X, Scissors, DollarSign, Clock, Edit2, Trash2 } from "lucide-react";
import { CATEGORIA_CONFIG } from "../constants/servico.constants";
import type { ServicoAPI } from "../types/servico.types";

interface ServicoDetalheProps {
  s: ServicoAPI;
  onClose: () => void;
  onEdit: () => void;
}

export function ServicoDetalhe({ s, onClose, onEdit }: ServicoDetalheProps) {
  const categoria =
    (s as unknown as { categoria?: string }).categoria ?? "corte";
  const cfg =
    CATEGORIA_CONFIG[categoria as keyof typeof CATEGORIA_CONFIG] ??
    CATEGORIA_CONFIG.corte;

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
          Detalhes do serviço
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
          className="px-4 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div
            className="flex items-center justify-center rounded-xl mb-3"
            style={{
              width: 48,
              height: 48,
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.color}30`,
            }}
          >
            <Scissors size={20} strokeWidth={1.8} />
          </div>
          <span
            className="block font-bold text-[15px] mb-1"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            {s.nome}
          </span>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded"
              style={{
                background: s.ativo
                  ? "rgba(29,185,84,0.1)"
                  : "rgba(255,255,255,0.04)",
                color: s.ativo ? "var(--status-success)" : "var(--text-muted)",
              }}
            >
              {s.ativo ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>

        <div
          className="grid grid-cols-2 divide-x"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {[
            {
              label: "Preço",
              value: `R$ ${Number(s.precoBase ?? 0).toFixed(0)}`,
              icon: DollarSign,
            },
            {
              label: "Duração",
              value: `${s.duracaoBase ?? 0}min`,
              icon: Clock,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <Icon
                  size={14}
                  style={{ color: "var(--text-muted)", flexShrink: 0 }}
                />
                <div>
                  <span
                    className="block text-[10px] uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="font-bold text-[14px]"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="flex gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold"
          style={{ background: "var(--primary)", color: "#0D0D0D" }}
        >
          <Edit2 size={13} /> Editar
        </button>
        <button
          className="px-3 flex items-center justify-center rounded-lg"
          style={{
            background: "rgba(255,77,79,0.08)",
            border: "1px solid rgba(255,77,79,0.2)",
            color: "var(--status-error)",
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}
