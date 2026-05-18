"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Scissors,
  Search,
  TrendingUp,
  DollarSign,
  Star,
} from "lucide-react";
import StatCard from "@/shared/components/stat-card";
import { useAuth } from "@/shared/hooks/use-auth";
import { useServicos, useServicoMutations } from "../hooks/use-servicos";
import { ServicoCard } from "./ServicoCard";
import { ServicoDetalhe } from "./ServicoDetalhe";
import { ServicoModal } from "./ServicoModal";
import type { ServicoAPI } from "../types/servico.types";
import { LoadingSpinner } from "@/shared/components/loading-spinner";

export function ServicosView() {
  const { barbearia } = useAuth();
  const barCodigo = barbearia?.codigo ?? null;
  const { data: servicos = [], isLoading } = useServicos(barCodigo);
  const { remove } = useServicoMutations(barCodigo);

  const [selected, setSelected] = useState<ServicoAPI | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ServicoAPI | undefined>();
  const [search, setSearch] = useState("");
  const [filterAtivo, setFilterAtivo] = useState<"todos" | "ativo" | "inativo">(
    "todos",
  );

  const filtered = servicos.filter((s) => {
    if (filterAtivo === "ativo" && !s.ativo) return false;
    if (filterAtivo === "inativo" && s.ativo) return false;
    if (search && !s.nome.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const totalAtivos = servicos.filter((s) => s.ativo).length;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 h-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Serviços ativos",
            value: totalAtivos,
            status: "info" as const,
            icon: Scissors,
          },
          {
            label: "Pedidos este mês",
            value: 0,
            status: "success" as const,
            icon: TrendingUp,
          },
          {
            label: "Receita do mês",
            value: 0,
            unit: "R$",
            status: "warning" as const,
            icon: DollarSign,
          },
          {
            label: "Ticket médio",
            value: 0,
            unit: "R$",
            status: "neutral" as const,
            icon: Star,
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
        className="flex flex-1 min-h-0 rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border-default)" }}
      >
        <div
          className="flex flex-col flex-1 min-w-0 overflow-hidden"
          style={{ background: "var(--bg-card)" }}
        >
          <div
            className="flex flex-col gap-2 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2">
              <div className="relative flex items-center flex-1 min-w-0">
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: 9,
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar serviço..."
                  style={{
                    paddingLeft: 28,
                    paddingRight: 12,
                    height: 32,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "var(--font-body)",
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>

              <button
                onClick={() => {
                  setEditTarget(undefined);
                  setModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 rounded-lg text-[12px] font-semibold flex-shrink-0"
                style={{
                  height: 32,
                  background: "var(--primary)",
                  color: "#0D0D0D",
                }}
              >
                <Plus size={13} strokeWidth={2.5} />
                <span className="hidden sm:inline">Novo serviço</span>
              </button>
            </div>

            <div
              className="flex gap-1 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {(
                [
                  { key: "todos", label: "Todos" },
                  { key: "ativo", label: "Ativos" },
                  { key: "inativo", label: "Inativos" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterAtivo(f.key)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium transition-all flex-shrink-0 whitespace-nowrap"
                  style={{
                    background:
                      filterAtivo === f.key ? "var(--bg-hover)" : "transparent",
                    border: `1px solid ${filterAtivo === f.key ? "var(--border-strong)" : "transparent"}`,
                    color:
                      filterAtivo === f.key
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <AnimatePresence>
                  {filtered.map((s, i) => (
                    <ServicoCard
                      key={s.codigo}
                      s={s}
                      index={i}
                      selected={selected?.codigo === s.codigo}
                      onClick={() =>
                        setSelected(selected?.codigo === s.codigo ? null : s)
                      }
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div
            className="px-4 py-2.5 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              {filtered.length} de {servicos.length} serviços
            </span>
          </div>
        </div>

        {/* Desktop side panel — hidden on mobile */}
        <AnimatePresence>
          {selected && (
            <div className="hidden md:flex">
              <ServicoDetalhe
                s={selected}
                onClose={() => setSelected(null)}
                onEdit={() => {
                  setEditTarget(selected);
                  setModalOpen(true);
                }}
                onDelete={() => {
                  remove.mutate(selected.codigo, {
                    onSuccess: () => setSelected(null),
                  });
                }}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile bottom-sheet */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="mobile-servico-detalhe"
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
              <ServicoDetalhe
                s={selected}
                onClose={() => setSelected(null)}
                onEdit={() => {
                  setEditTarget(selected);
                  setModalOpen(true);
                }}
                onDelete={() => {
                  remove.mutate(selected.codigo, {
                    onSuccess: () => setSelected(null),
                  });
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <ServicoModal
            servico={editTarget}
            onClose={() => {
              setModalOpen(false);
              setEditTarget(undefined);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
