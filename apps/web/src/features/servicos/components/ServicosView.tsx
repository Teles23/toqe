/* eslint-disable no-restricted-syntax */
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
import { useServicos } from "../hooks/use-servicos";
import { ServicoCard } from "./ServicoCard";
import { ServicoDetalhe } from "./ServicoDetalhe";
import { ServicoModal } from "./ServicoModal";
import { CATEGORIA_CONFIG } from "../constants/servico.constants";
import type { Categoria, ServicoAPI } from "../types/servico.types";
import { LoadingSpinner } from "@/shared/components/loading-spinner";

export function ServicosView() {
  const { barbearia } = useAuth();
  const { data: servicos = [], isLoading } = useServicos(
    barbearia?.codigo ?? null,
  );

  const [selected, setSelected] = useState<ServicoAPI | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ServicoAPI | undefined>();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"todos" | Categoria>("todos");

  const filtered = servicos.filter((s) => {
    if (filterCat !== "todos") {
      const cat = (s as unknown as { categoria?: string }).categoria;
      if (cat !== filterCat) return false;
    }
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
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0 flex-wrap"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div
              className="relative flex items-center"
              style={{ minWidth: 160 }}
            >
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

            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setFilterCat("todos")}
                className="px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                style={{
                  background:
                    filterCat === "todos" ? "var(--bg-hover)" : "transparent",
                  border: `1px solid ${filterCat === "todos" ? "var(--border-strong)" : "transparent"}`,
                  color:
                    filterCat === "todos"
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                }}
              >
                Todos
              </button>
              {(
                Object.entries(CATEGORIA_CONFIG) as [
                  Categoria,
                  (typeof CATEGORIA_CONFIG)[Categoria],
                ][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFilterCat(key)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                  style={{
                    background: filterCat === key ? cfg.bg : "transparent",
                    border: `1px solid ${filterCat === key ? cfg.color + "40" : "transparent"}`,
                    color: filterCat === key ? cfg.color : "var(--text-muted)",
                  }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <button
              onClick={() => {
                setEditTarget(undefined);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 rounded-lg text-[12px] font-semibold"
              style={{
                height: 32,
                background: "var(--primary)",
                color: "#0D0D0D",
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> Novo serviço
            </button>
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

        <AnimatePresence>
          {selected && (
            <ServicoDetalhe
              s={selected}
              onClose={() => setSelected(null)}
              onEdit={() => {
                setEditTarget(selected);
                setModalOpen(true);
              }}
            />
          )}
        </AnimatePresence>
      </div>

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
