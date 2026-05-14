/* eslint-disable no-restricted-syntax */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SECOES } from "../constants/configuracao.constants";
import type { SecaoId } from "../types/configuracao.types";
import { SecaoBarbearia } from "./SecaoBarbearia";
import { SecaoHorarios } from "./SecaoHorarios";
import { SecaoNotificacoes } from "./SecaoNotificacoes";
import { SecaoPlano } from "./SecaoPlano";
import { SecaoSeguranca } from "./SecaoSeguranca";

interface Props {
  barCodigo: number | null;
}

export function ConfiguracoesView({ barCodigo }: Props) {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoId>("barbearia");

  const conteudo: Record<SecaoId, React.ReactNode> = {
    barbearia: <SecaoBarbearia barCodigo={barCodigo} />,
    horarios: <SecaoHorarios barCodigo={barCodigo} />,
    notificacoes: <SecaoNotificacoes barCodigo={barCodigo} />,
    plano: <SecaoPlano />,
    seguranca: <SecaoSeguranca />,
  };

  return (
    <div
      className="max-w-5xl mx-auto flex rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--border-default)",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      <div
        className="flex-shrink-0 py-4"
        style={{
          width: 200,
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <span
          className="block px-4 pb-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Configurações
        </span>

        {SECOES.map((s) => {
          const Icon = s.icon;
          const ativa = secaoAtiva === s.id;

          return (
            <button
              key={s.id}
              onClick={() => setSecaoAtiva(s.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 relative"
              style={{
                background: ativa ? "var(--bg-card)" : "transparent",
                borderLeft: `2px solid ${ativa ? "var(--primary)" : "transparent"}`,
                color: ativa ? "var(--text-primary)" : "var(--text-secondary)",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                if (!ativa)
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!ativa)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              <Icon size={15} strokeWidth={ativa ? 2.2 : 1.8} />
              <span className="text-[13px] font-medium">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ background: "var(--bg-card)" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={secaoAtiva}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="p-6"
          >
            {conteudo[secaoAtiva]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
