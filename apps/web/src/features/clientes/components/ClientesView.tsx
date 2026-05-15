"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Scissors, Star, TrendingUp, Users } from "lucide-react";
import StatCard from "@/shared/components/stat-card";
import { useAuth } from "@/shared/hooks/use-auth";
import { useClientes } from "../hooks/use-clientes";
import { ClienteCard } from "./ClienteCard";
import { ClienteDetalhe } from "./ClienteDetalhe";
import { ClienteModal } from "./ClienteModal";
import type { Cliente, ClienteStatus } from "../types/cliente.types";
import { STATUS_CONFIG, type SortKey } from "../constants/cliente.constants";
import { LoadingSpinner } from "@/shared/components/loading-spinner";

export function ClientesView() {
  const { barbearia } = useAuth();
  const { data: clientes, isLoading } = useClientes(barbearia?.codigo ?? null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | ClienteStatus>(
    "todos",
  );
  const [sortBy, setSortBy] = useState<SortKey>("visitas");
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = clientes
    .filter((c) => {
      if (filterStatus !== "todos" && c.status !== filterStatus) return false;
      if (search && !c.nome.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "nome") return a.nome.localeCompare(b.nome);
      if (sortBy === "visitas") return b.totalVisitas - a.totalVisitas;
      return b.totalGasto - a.totalGasto;
    });

  const totalAtivos = clientes.filter((c) => c.status === "ativo").length;
  const totalNovos = clientes.filter((c) => c.status === "novo").length;
  const totalGasto = clientes.reduce((s, c) => s + c.totalGasto, 0);
  const mediaTicket =
    clientes.length > 0 ? Math.round(totalGasto / clientes.length) : 0;

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-5">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total de clientes",
            value: clientes.length,
            status: "info" as const,
            icon: Users,
          },
          {
            label: "Clientes ativos",
            value: totalAtivos,
            status: "success" as const,
            icon: TrendingUp,
          },
          {
            label: "Novos este mês",
            value: totalNovos,
            status: "warning" as const,
            icon: Star,
          },
          {
            label: "Ticket médio",
            value: mediaTicket,
            unit: "R$",
            status: "neutral" as const,
            icon: Scissors,
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

      {/* Conteúdo principal */}
      <div
        className="flex flex-1 min-h-0 rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border-default)" }}
      >
        {/* Lista */}
        <div
          className="flex flex-col flex-1 min-w-0 overflow-hidden"
          style={{ background: "var(--bg-card)" }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0 flex-wrap"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            {/* Search */}
            <div className="relative flex items-center flex-1 min-w-[160px]">
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
                placeholder="Buscar cliente..."
                style={{
                  width: "100%",
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
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--status-info)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border-default)")
                }
              />
            </div>

            {/* Filtros de status */}
            <div className="flex gap-1">
              {(["todos", "ativo", "inativo", "novo"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-all"
                  style={{
                    background:
                      filterStatus === s ? "var(--bg-hover)" : "transparent",
                    border: `1px solid ${filterStatus === s ? "var(--border-strong)" : "transparent"}`,
                    color:
                      filterStatus === s
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {s === "todos" ? "Todos" : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              style={{
                height: 32,
                paddingLeft: 10,
                paddingRight: 28,
                fontSize: 11,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                borderRadius: 6,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-body)",
                outline: "none",
                appearance: "none",
              }}
            >
              <option value="visitas">Mais visitas</option>
              <option value="gasto">Maior gasto</option>
              <option value="nome">Nome A–Z</option>
            </select>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-lg text-[12px] font-semibold ml-auto"
              style={{
                height: 32,
                background: "var(--primary)",
                color: "#0D0D0D",
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> Novo cliente
            </button>
          </div>

          {/* Header da tabela */}
          <div
            className="flex items-center px-4 py-2 flex-shrink-0"
            style={{
              background: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            {[
              "Cliente",
              "Última visita",
              "Visitas",
              "Total gasto",
              "Serviço fav.",
              "",
            ].map((h, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  color: "var(--text-muted)",
                  flex: i === 0 ? 2 : i === 5 ? 0 : 1,
                  width: i === 5 ? 32 : undefined,
                  textAlign: i > 1 ? "right" : "left",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Lista de clientes */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <ClienteCard
                    key={c.codigo}
                    cliente={c}
                    index={i}
                    isSelected={selected?.codigo === c.codigo}
                    onClick={() =>
                      setSelected(selected?.codigo === c.codigo ? null : c)
                    }
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              {filtered.length} de {clientes.length} clientes
            </span>
          </div>
        </div>

        {/* Painel de detalhe */}
        <AnimatePresence>
          {selected && (
            <ClienteDetalhe
              cliente={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {modalOpen && <ClienteModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
