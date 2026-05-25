"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { SECOES } from "../constants/configuracao.constants";
import type { SecaoId } from "../types/configuracao.types";
import { SecaoBarbearia } from "./SecaoBarbearia";
import { SecaoHorarios } from "./SecaoHorarios";
import { SecaoNotificacoes } from "./SecaoNotificacoes";
import { SecaoPlano } from "./SecaoPlano";
import { SecaoQrCode } from "./SecaoQrCode";
import { SecaoSeguranca } from "./SecaoSeguranca";
import { SecaoApiKeys } from "./SecaoApiKeys";

interface Props {
  barCodigo: number | null;
  slug: string | null;
}

export function ConfiguracoesView({ barCodigo, slug }: Props) {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoId>("barbearia");
  const [mobileShowContent, setMobileShowContent] = useState(false);

  const conteudo: Record<SecaoId, React.ReactNode> = {
    barbearia: <SecaoBarbearia barCodigo={barCodigo} />,
    horarios: <SecaoHorarios barCodigo={barCodigo} />,
    notificacoes: <SecaoNotificacoes barCodigo={barCodigo} />,
    qrcode: slug ? (
      <SecaoQrCode slug={slug} />
    ) : (
      <div className="text-[13px] text-[var(--text-muted)]">
        Configuração indisponível.
      </div>
    ),
    plano: <SecaoPlano barCodigo={barCodigo} />,
    seguranca: <SecaoSeguranca />,
    "api-keys": <SecaoApiKeys barCodigo={barCodigo} />,
  };

  const secaoLabel = SECOES.find((s) => s.id === secaoAtiva)?.label ?? "";

  function handleSelectSecao(id: SecaoId) {
    setSecaoAtiva(id);
    setMobileShowContent(true);
  }

  return (
    <div
      className="max-w-5xl mx-auto md:flex rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--border-default)",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      {/* Sidebar nav — full-width on mobile, 200px sidebar on desktop */}
      <div
        className={`py-4 md:w-[200px] md:flex-shrink-0 ${mobileShowContent ? "hidden md:block" : "block"}`}
        style={{
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
              onClick={() => handleSelectSecao(s.id)}
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
              <span className="text-[13px] font-medium flex-1 text-left">
                {s.label}
              </span>
              <ChevronRight
                size={14}
                className="md:hidden"
                style={{ color: "var(--text-muted)" }}
              />
            </button>
          );
        })}
      </div>

      {/* Content panel — full-width on mobile when shown */}
      <div
        className={`flex-1 overflow-y-auto ${mobileShowContent ? "block" : "hidden md:block"}`}
        style={{ background: "var(--bg-card)" }}
      >
        {/* Mobile back button */}
        <button
          onClick={() => setMobileShowContent(false)}
          className="md:hidden flex items-center gap-2 px-4 pt-4 pb-2 text-[13px] font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={15} />
          {secaoLabel}
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={secaoAtiva}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="p-6 pt-4 md:pt-6"
          >
            {conteudo[secaoAtiva]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
