"use client";

import React from "react";
import { motion } from "framer-motion";
import { Scissors } from "lucide-react";

/**
 * Painel esquerdo das telas de autenticação (login/onboarding).
 *
 * Conteúdo puramente decorativo: logo + headline + mockup de status ao
 * vivo da operação. Sem lógica de negócio; movido para a feature `auth`
 * para que o `page.tsx` da rota seja apenas composição.
 *
 * Os estilos inline com `var(--*)` aqui serão migrados para Tailwind
 * tokens no sub-PR 3d (consolidação de design tokens).
 */
export function AuthBrandingPanel(): React.JSX.Element {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden w-[45%] bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]">
      {/* Grade decorativa */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.4,
          maskImage:
            "radial-gradient(ellipse 80% 80% at 30% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Glow âmbar */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400,
          height: 400,
          left: "-10%",
          top: "30%",
          background:
            "radial-gradient(ellipse, rgba(244,180,0,0.07) 0%, transparent 65%)",
        }}
      />

      {/* Logo */}
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
        <blockquote className="font-bold mb-6 font-heading text-[1.75rem] tracking-[-0.03em] leading-[1.25] text-[var(--text-primary)]">
          &ldquo;A operação da barbearia em tempo real, no seu controle.&rdquo;
        </blockquote>

        <BrandingLiveStatusMock />
      </motion.div>

      {/* Rodapé do painel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 flex items-center gap-2"
      >
        <span className="text-[12px] text-[var(--text-muted)]">
          © 2025 Toqe · Urban Flow System
        </span>
      </motion.div>
    </div>
  );
}

// ─── Mockup de "status ao vivo" — extraído para reduzir o tamanho do componente principal.
function BrandingLiveStatusMock(): React.JSX.Element {
  const metrics = [
    { label: "Barbeiros ativos", value: "3", color: "var(--status-success)" },
    { label: "Próximo horário", value: "10:30", color: "var(--text-primary)" },
  ];

  const barbeiros = [
    {
      n: "Carlos",
      estado: "active" as const,
      cliente: "João · Corte",
      pct: 68,
    },
    { n: "Lucas", estado: "idle" as const, cliente: null, pct: 0 },
    {
      n: "Felipe",
      estado: "active" as const,
      cliente: "Ana · Sobrancelha",
      pct: 40,
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-lg)] max-w-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: "var(--status-success)",
              animation: "tqe-pulse-green 1.5s ease-in-out infinite",
            }}
          />
          <span className="text-[12px] font-semibold text-[var(--text-primary)]">
            Status ao vivo
          </span>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded font-semibold"
          style={{
            background: "rgba(29,185,84,0.1)",
            color: "var(--status-success)",
          }}
        >
          Aberta
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 divide-x border-b border-[var(--border-subtle)] divide-[var(--border-subtle)]">
        {metrics.map((s) => (
          <div key={s.label} className="px-4 py-3">
            <span
              className="block font-bold text-[16px] font-heading tracking-[-0.03em]"
              style={{ color: s.color }} /* CSS var dinâmico — não migrar */
            >
              {s.value}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Barbeiros */}
      <div className="p-3 space-y-2">
        {barbeiros.map((b) => {
          const color =
            b.estado === "active"
              ? "var(--status-success)"
              : "var(--text-muted)";
          return (
            <div
              key={b.n}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg relative overflow-hidden"
              style={{
                background:
                  b.estado === "active"
                    ? "rgba(29,185,84,0.04)"
                    : "var(--bg-secondary)",
                border: `1px solid ${b.estado === "active" ? "rgba(29,185,84,0.15)" : "var(--border-subtle)"}`,
              }}
            >
              {b.estado === "active" && (
                <div
                  className="absolute left-0 top-1.5 bottom-1.5 rounded-r"
                  style={{
                    width: 2,
                    background: color,
                    animation: "tqe-sidebar-pulse 2s ease-in-out infinite",
                  }}
                />
              )}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-[10px] font-heading"
                style={{
                  width: 24,
                  height: 24,
                  background: `${color}18` /* CSS var dinâmico — não migrar */,
                  color /* CSS var dinâmico — não migrar */,
                }}
              >
                {b.n[0]}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[11px] font-medium text-[var(--text-primary)]">
                  {b.n}
                </span>
                {b.cliente ? (
                  <>
                    <span className="block text-[10px] text-[var(--text-secondary)]">
                      {b.cliente}
                    </span>
                    <div className="mt-1 rounded-full overflow-hidden h-0.5 bg-[var(--border-default)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${b.pct}%`,
                          background: color,
                        }} /* CSS var dinâmico — não migrar */
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Disponível
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
