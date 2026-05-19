"use client";

import React from "react";
import { motion } from "framer-motion";
import { Scissors } from "lucide-react";

/**
 * Painel direito das telas de autenticação (login/onboarding).
 *
 * Conteúdo puramente decorativo: logo + headline editorial + mini-card
 * ilustrativo de agenda. Não contém dados reais nem nomes de
 * barbearias/clientes inventados — apenas rótulos demonstrativos.
 *
 * Sem lógica de negócio. A página raiz orquestra a composição.
 */
export function AuthBrandingPanel(): React.JSX.Element {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden w-[50%] border-l border-[var(--border-subtle)]"
      style={{
        background:
          "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 60%, var(--bg-base) 100%)",
      }}
    >
      {/* Glow âmbar canto superior */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          width: 480,
          height: 480,
          top: -100,
          right: -100,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(244,180,0,0.18) 0%, transparent 60%)",
        }}
      />

      {/* Glow azul canto inferior */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          width: 500,
          height: 500,
          bottom: -200,
          left: -100,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(77,163,255,0.08) 0%, transparent 60%)",
        }}
      />

      {/* Grade decorativa sutil */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.25,
          maskImage:
            "radial-gradient(ellipse 80% 80% at 70% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Logo no topo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 flex items-center gap-3"
      >
        <div
          className="flex items-center justify-center rounded-xl bg-[var(--primary)]"
          style={{
            width: 38,
            height: 38,
            boxShadow: "0 0 20px rgba(244,180,0,0.3)",
          }}
        >
          <Scissors size={17} color="#0D0D0D" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-[20px] font-heading tracking-[-0.03em] text-[var(--text-primary)]">
          Toqe
        </span>
      </motion.div>

      {/* Conteúdo central */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <h2
          className="font-heading font-semibold mb-2 text-[var(--text-primary)]"
          style={{
            fontSize: "2rem",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            maxWidth: 460,
          }}
        >
          A operação da sua barbearia,{" "}
          <span className="text-[var(--primary)]">no ritmo certo</span>.
        </h2>
        <p
          className="text-[14px] mb-8 text-[var(--text-secondary)]"
          style={{ maxWidth: 460, lineHeight: 1.5 }}
        >
          Agenda, equipe, caixa e clientes num só lugar — sem caderno, sem
          planilha, sem retrabalho.
        </p>

        <DemoAgendaCard />
      </motion.div>

      {/* Rodapé do painel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 flex items-center gap-2"
      >
        <span className="text-[12px] text-[var(--text-muted)]">
          © {new Date().getFullYear()} Toqe
        </span>
      </motion.div>
    </div>
  );
}

// ─── Mini-card ilustrativo de agenda ─────────────────────────────────────────
// Dados demonstrativos: sem nomes reais, sem barbearias inventadas.
// Serve apenas para sugerir o que o produto faz visualmente.

interface DemoSlot {
  hora: string;
  servico: string;
  estado: "concluido" | "atual" | "agendado";
}

const DEMO_SLOTS: readonly DemoSlot[] = [
  { hora: "09:00", servico: "Corte", estado: "concluido" },
  { hora: "09:30", servico: "Corte + Barba", estado: "atual" },
  { hora: "10:00", servico: "Corte", estado: "agendado" },
  { hora: "10:30", servico: "Barba", estado: "agendado" },
];

function statusColor(estado: DemoSlot["estado"]): string {
  if (estado === "concluido") return "var(--status-success)";
  if (estado === "atual") return "var(--primary)";
  return "var(--status-info)";
}

function DemoAgendaCard(): React.JSX.Element {
  return (
    <div
      className="rounded-2xl overflow-hidden border max-w-[360px]"
      style={{
        background: "rgba(19,19,19,0.7)",
        borderColor: "var(--border-default)",
        backdropFilter: "blur(12px)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
          Agenda do dia
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] text-[var(--status-success)]">
          <span
            className="rounded-full"
            style={{
              width: 5,
              height: 5,
              background: "var(--status-success)",
              animation: "tqe-pulse-green 1.6s ease-in-out infinite",
            }}
          />
          AO VIVO
        </span>
      </div>

      {/* Linhas */}
      <div className="p-3 space-y-1.5">
        {DEMO_SLOTS.map((slot) => {
          const isAtual = slot.estado === "atual";
          const cor = statusColor(slot.estado);
          return (
            <div
              key={slot.hora}
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{
                background: isAtual ? "rgba(244,180,0,0.06)" : "transparent",
                border: isAtual
                  ? "1px solid rgba(244,180,0,0.15)"
                  : "1px solid transparent",
              }}
            >
              <span
                className="text-[11px] font-semibold font-mono w-[42px]"
                style={{ color: "var(--primary)" }}
              >
                {slot.hora}
              </span>
              <span
                className="rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: cor,
                  flexShrink: 0,
                }}
              />
              <span className="flex-1 text-[12px] text-[var(--text-primary)]">
                {slot.servico}
                {isAtual && (
                  <span className="ml-1.5 text-[var(--text-muted)]">
                    · agora
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
