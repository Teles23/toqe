"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Scissors, DollarSign, Clock, Edit2, Trash2 } from "lucide-react";
import { getCategoria } from "../constants/servico.constants";
import type { ServicoAPI } from "../types/servico.types";
import { formatBRL } from "@/shared/lib/utils";

interface ServicoDetalheProps {
  s: ServicoAPI;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ServicoDetalhe({
  s,
  onClose,
  onEdit,
  onDelete,
}: ServicoDetalheProps) {
  const [confirmando, setConfirmando] = useState(false);
  const categoria = (s as unknown as { categoria?: string }).categoria;
  const cfg = getCategoria(categoria);

  const handleConfirmarExclusao = () => {
    setConfirmando(false);
    onDelete();
  };

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
      <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0 border-b border-[var(--border-subtle)]">
        <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
          Detalhes do serviço
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[var(--text-muted)]"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 border-b border-[var(--border-subtle)]">
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
          <span className="block font-bold text-[15px] mb-1 font-heading text-[var(--text-primary)]">
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

        <div className="grid grid-cols-2 divide-x border-b border-[var(--border-subtle)] divide-[var(--border-subtle)]">
          {[
            {
              label: "Preço",
              value: formatBRL(Number(s.precoBase ?? 0)),
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
              >
                <Icon
                  size={14}
                  className="text-[var(--text-muted)] flex-shrink-0"
                />
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {item.label}
                  </span>
                  <span className="font-bold text-[14px] font-heading text-[var(--text-primary)]">
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {confirmando && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="px-4 py-3 border-t border-[var(--border-subtle)]"
            style={{ background: "rgba(255,77,79,0.06)" }}
          >
            <p className="text-[12px] font-semibold text-[var(--status-error)] mb-1">
              Excluir "{s.nome}"?
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmando(false)}
                className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarExclusao}
                className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold bg-[var(--status-error)] text-white"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 px-4 py-3 flex-shrink-0 border-t border-[var(--border-subtle)]">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold bg-[var(--primary)] text-[#0D0D0D]"
        >
          <Edit2 size={13} /> Editar
        </button>
        <button
          type="button"
          aria-label="Excluir serviço"
          onClick={() => setConfirmando(true)}
          className="px-3 flex items-center justify-center rounded-lg bg-[rgba(255,77,79,0.08)] border border-[rgba(255,77,79,0.2)] text-[var(--status-error)]"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}
