"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { CATEGORIA_CONFIG } from "../constants/servico.constants";
import type { Categoria, ServicoAPI } from "../types/servico.types";

interface ServicoModalProps {
  servico?: ServicoAPI;
  onClose: () => void;
}

export function ServicoModal({ servico, onClose }: ServicoModalProps) {
  const [nome, setNome] = useState(servico?.nome ?? "");
  const [preco, setPreco] = useState(Number(servico?.precoBase ?? 30));
  const [duracao, setDuracao] = useState(servico?.duracaoBase ?? 30);
  const [cat, setCat] = useState<Categoria>("corte");
  const [desc, setDesc] = useState("");

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-strong)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span
              className="font-bold text-[15px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
              }}
            >
              {servico ? "Editar serviço" : "Novo serviço"}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="tqe-label">Nome do serviço</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Corte Clássico"
                className="tqe-input"
              />
            </div>

            <div>
              <label className="tqe-label">Categoria</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(
                  Object.entries(CATEGORIA_CONFIG) as [
                    Categoria,
                    (typeof CATEGORIA_CONFIG)[Categoria],
                  ][]
                ).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setCat(key)}
                    className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: cat === key ? cfg.bg : "var(--bg-secondary)",
                      color: cat === key ? cfg.color : "var(--text-muted)",
                      border: `1px solid ${cat === key ? cfg.color + "40" : "var(--border-default)"}`,
                    }}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="tqe-label">Preço (R$)</label>
                <input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(Number(e.target.value))}
                  className="tqe-input"
                  min={0}
                />
              </div>
              <div>
                <label className="tqe-label">Duração (min)</label>
                <input
                  type="number"
                  value={duracao}
                  onChange={(e) => setDuracao(Number(e.target.value))}
                  className="tqe-input"
                  min={5}
                  step={5}
                />
              </div>
            </div>

            <div>
              <label className="tqe-label">Descrição</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descreva o serviço..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
            </div>
          </div>

          <div
            className="flex gap-2 px-5 py-4"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium"
              style={{
                background: "transparent",
                border: "1px solid var(--border-strong)",
                color: "var(--text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              className="flex-1 py-2 rounded-lg text-[13px] font-semibold"
              style={{ background: "var(--primary)", color: "#0D0D0D" }}
            >
              {servico ? "Salvar alterações" : "Criar serviço"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
