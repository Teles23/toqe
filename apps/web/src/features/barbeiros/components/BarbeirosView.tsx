"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Scissors, TrendingUp, Clock, Award } from "lucide-react";
import StatCard from "@/shared/components/stat-card";
import { useAuth } from "@/shared/hooks/use-auth";
import { useBarbeiros } from "../hooks/use-barbeiros";
import { BarbeiroCard } from "./BarbeiroCard";
import { BarbeiroDetalhe } from "./BarbeiroDetalhe";
import { BarbeiroModal } from "./BarbeiroModal";
import type { Barbeiro, BarbeiroEstado } from "../types/barbeiro.types";
import { LoadingSpinner } from "@/shared/components/loading-spinner";

export function BarbeirosView() {
  const { barbearia } = useAuth();
  const { data: barbeiros, isLoading } = useBarbeiros(
    barbearia?.codigo ?? null,
  );

  const [selected, setSelected] = useState<Barbeiro | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterEstado, setFilterEstado] = useState<"todos" | BarbeiroEstado>(
    "todos",
  );

  const filtered = barbeiros.filter(
    (b) => filterEstado === "todos" || b.estado === filterEstado,
  );

  const ativos = barbeiros.filter((b) => b.estado === "active").length;
  const disponiveis = barbeiros.filter((b) => b.estado === "idle").length;
  const totalFat = barbeiros.reduce((s, b) => s + b.faturamentoMes, 0);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 h-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total de barbeiros",
            value: barbeiros.length,
            status: "info" as const,
            icon: Scissors,
          },
          {
            label: "Atendendo agora",
            value: ativos,
            status: "success" as const,
            icon: TrendingUp,
          },
          {
            label: "Disponíveis",
            value: disponiveis,
            status: "warning" as const,
            icon: Clock,
          },
          {
            label: "Fat. total mês",
            value: totalFat,
            unit: "R$",
            status: "neutral" as const,
            icon: Award,
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      <div
        className="flex flex-1 min-h-0 gap-0 rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border-default)" }}
      >
        <div
          className="flex flex-col flex-1 min-w-0 overflow-hidden"
          style={{ background: "var(--bg-card)" }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div
              className="flex gap-1 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {(
                [
                  { key: "todos", label: "Todos" },
                  { key: "active", label: "Atendendo" },
                  { key: "idle", label: "Livre" },
                  { key: "off", label: "Fora" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterEstado(f.key)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium transition-all flex-shrink-0 whitespace-nowrap"
                  style={{
                    background:
                      filterEstado === f.key
                        ? "var(--bg-hover)"
                        : "transparent",
                    border: `1px solid ${filterEstado === f.key ? "var(--border-strong)" : "transparent"}`,
                    color:
                      filterEstado === f.key
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-lg text-[12px] font-semibold"
              style={{
                height: 32,
                background: "var(--primary)",
                color: "#0D0D0D",
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> Novo barbeiro
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {filtered.map((b, i) => (
                    <motion.div
                      key={b.codigo}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <BarbeiroCard
                        b={b}
                        selected={selected?.codigo === b.codigo}
                        onClick={() =>
                          setSelected(selected?.codigo === b.codigo ? null : b)
                        }
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Desktop side panel — hidden on mobile to avoid squeezing the grid */}
        <AnimatePresence>
          {selected && (
            <div className="hidden md:flex">
              <BarbeiroDetalhe b={selected} onClose={() => setSelected(null)} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile bottom-sheet */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="mobile-detalhe"
            className="fixed inset-0 z-50 flex flex-col justify-end md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="relative z-10 rounded-t-2xl overflow-hidden"
              style={{
                maxHeight: "78vh",
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            >
              <BarbeiroDetalhe b={selected} onClose={() => setSelected(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && <BarbeiroModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
