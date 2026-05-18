"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Scissors, ArrowLeft, LayoutDashboard } from "lucide-react";

export default function NotFound(): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[var(--bg-base)]">
      {/* Grade decorativa */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          opacity: 0.35,
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Glow âmbar central */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 500,
          height: 300,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(ellipse, rgba(244,180,0,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Conteúdo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-[440px]"
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center rounded-xl mb-8 w-12 h-12 bg-[var(--primary)]"
          style={{ boxShadow: "0 0 24px rgba(244,180,0,0.25)" }}
        >
          <Scissors size={20} color="#0D0D0D" strokeWidth={2.5} />
        </div>

        {/* 404 */}
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-bold leading-none mb-4 font-heading text-[6rem] tracking-[-0.05em] text-[var(--primary)]"
          style={{ textShadow: "0 0 40px rgba(244,180,0,0.2)" }}
        >
          404
        </motion.span>

        <h1 className="font-bold mb-3 font-heading text-[1.4rem] tracking-[-0.02em] text-[var(--text-primary)]">
          Página não encontrada
        </h1>

        <p className="mb-8 leading-relaxed text-sm text-[var(--text-secondary)]">
          A rota que você acessou não existe ou foi movida. Volte para o
          dashboard e continue de onde parou.
        </p>

        {/* Ações */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-5 rounded-xl font-semibold text-[13px] h-10 bg-[var(--primary)] text-[#0D0D0D]"
            style={{ boxShadow: "0 0 16px rgba(244,180,0,0.2)" }}
          >
            <LayoutDashboard size={14} strokeWidth={2.2} />
            Ir para o Dashboard
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 rounded-xl text-[13px] font-medium h-10 border border-[var(--border-strong)] text-[var(--text-secondary)]"
          >
            <ArrowLeft size={14} />
            Voltar
          </motion.button>
        </div>

        {/* Rodapé */}
        <span className="mt-12 text-[11px] text-[var(--text-muted)]">
          Toqe — Urban Flow System
        </span>
      </motion.div>
    </div>
  );
}
