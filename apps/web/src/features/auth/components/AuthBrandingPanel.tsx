"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * Painel direito das telas de autenticação (login/onboarding).
 *
 * Conteúdo decorativo: depoimento (merchandising) + mini-card ilustrativo
 * de agenda do dia. Sem logo (já aparece na coluna esquerda).
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

      {/* Espaçador superior — mantém o conteúdo verticalmente centralizado */}
      <div className="relative z-10" />

      {/* Conteúdo central — depoimento + agenda */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <blockquote
          className="font-heading font-semibold mb-7 text-[var(--text-primary)]"
          style={{
            fontSize: "1.75rem",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            maxWidth: 480,
          }}
        >
          “Saí de 3 cadernos e 2 apps diferentes pro{" "}
          <span
            style={{
              background:
                "linear-gradient(transparent 75%, rgba(244,180,0,0.25) 75%)",
              padding: "0 2px",
              color: "var(--primary)",
            }}
          >
            Toqe
          </span>
          . Em uma semana, o caixa fechou sozinho pela primeira vez em 12 anos.”
        </blockquote>

        <div className="flex items-center gap-3 mb-9">
          <div
            className="flex items-center justify-center rounded-full border font-heading font-bold text-[16px] text-[var(--primary)]"
            style={{
              width: 42,
              height: 42,
              background:
                "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)",
              borderColor: "var(--border-default)",
            }}
            aria-hidden="true"
          >
            M
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">
              Marcus Andrade
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Dono · Barbearia Urban · Salvador, BA
            </div>
          </div>
        </div>

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
// Conteúdo de merchandising: nomes e horários representativos do produto.

interface DemoSlot {
  hora: string;
  cliente: string;
  barbeiro: string;
  estado: "concluido" | "atual" | "agendado";
}

const DEMO_SLOTS: readonly DemoSlot[] = [
  {
    hora: "09:00",
    cliente: "João Silva",
    barbeiro: "Carlos",
    estado: "concluido",
  },
  {
    hora: "09:30",
    cliente: "Pedro Santos",
    barbeiro: "Carlos",
    estado: "atual",
  },
  {
    hora: "10:00",
    cliente: "Rafael Lima",
    barbeiro: "Felipe",
    estado: "agendado",
  },
  {
    hora: "10:30",
    cliente: "Bruno Alves",
    barbeiro: "Lucas",
    estado: "agendado",
  },
];

function statusColor(estado: DemoSlot["estado"]): string {
  if (estado === "concluido") return "var(--status-success)";
  if (estado === "atual") return "var(--primary)";
  return "var(--status-info)";
}

function DemoAgendaCard(): React.JSX.Element {
  return (
    <div
      className="rounded-2xl overflow-hidden border max-w-[400px]"
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
          Agenda — Quarta, 06 mai
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
      <div className="p-3 space-y-1">
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
                {slot.cliente}
                {isAtual && (
                  <span className="ml-1.5 text-[var(--text-muted)]">
                    · agora
                  </span>
                )}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {slot.barbeiro}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
