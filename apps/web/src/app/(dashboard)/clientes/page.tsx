"use client";

import React from "react";
import StatCard from "@/shared/components/stat-card";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronRight,
  MessageCircle,
  Phone,
  Plus,
  Scissors,
  Search,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";

/* ── Tipos ── */
interface Cliente {
  id: number;
  nome: string;
  initial: string;
  telefone: string;
  ultimaVisita: string;
  totalVisitas: number;
  totalGasto: number;
  ticketMedio: number;
  avaliacao: number;
  servicoFav: string;
  status: "ativo" | "inativo" | "novo";
  tags: string[];
}

/* ── Dados ── */
const CLIENTES: Cliente[] = [
  {
    id: 1,
    nome: "João Silva",
    initial: "J",
    telefone: "(71) 99999-0001",
    ultimaVisita: "Hoje",
    totalVisitas: 48,
    totalGasto: 1440,
    ticketMedio: 30,
    avaliacao: 5.0,
    servicoFav: "Corte",
    status: "ativo",
    tags: ["VIP", "Pontual"],
  },
  {
    id: 2,
    nome: "Pedro Santos",
    initial: "P",
    telefone: "(71) 99999-0002",
    ultimaVisita: "Ontem",
    totalVisitas: 32,
    totalGasto: 2560,
    ticketMedio: 80,
    avaliacao: 4.8,
    servicoFav: "Corte + Barba",
    status: "ativo",
    tags: ["VIP"],
  },
  {
    id: 3,
    nome: "Marco Oliveira",
    initial: "M",
    telefone: "(71) 99999-0003",
    ultimaVisita: "3 dias",
    totalVisitas: 21,
    totalGasto: 840,
    ticketMedio: 40,
    avaliacao: 4.5,
    servicoFav: "Barba",
    status: "ativo",
    tags: [],
  },
  {
    id: 4,
    nome: "Rafael Souza",
    initial: "R",
    telefone: "(71) 99999-0004",
    ultimaVisita: "1 semana",
    totalVisitas: 15,
    totalGasto: 1200,
    ticketMedio: 80,
    avaliacao: 5.0,
    servicoFav: "Corte + Barba",
    status: "ativo",
    tags: ["Pontual"],
  },
  {
    id: 5,
    nome: "Diego Mendes",
    initial: "D",
    telefone: "(71) 99999-0005",
    ultimaVisita: "2 semanas",
    totalVisitas: 8,
    totalGasto: 240,
    ticketMedio: 30,
    avaliacao: 4.2,
    servicoFav: "Corte",
    status: "ativo",
    tags: [],
  },
  {
    id: 6,
    nome: "Bruno Lima",
    initial: "B",
    telefone: "(71) 99999-0006",
    ultimaVisita: "1 mês",
    totalVisitas: 3,
    totalGasto: 90,
    ticketMedio: 30,
    avaliacao: 4.0,
    servicoFav: "Corte",
    status: "inativo",
    tags: [],
  },
  {
    id: 7,
    nome: "Ana Costa",
    initial: "A",
    telefone: "(71) 99999-0007",
    ultimaVisita: "Hoje",
    totalVisitas: 12,
    totalGasto: 360,
    ticketMedio: 30,
    avaliacao: 5.0,
    servicoFav: "Sobrancelha",
    status: "ativo",
    tags: ["Pontual"],
  },
  {
    id: 8,
    nome: "Carlos Ferreira",
    initial: "C",
    telefone: "(71) 99999-0008",
    ultimaVisita: "Hoje",
    totalVisitas: 1,
    totalGasto: 30,
    ticketMedio: 30,
    avaliacao: 0,
    servicoFav: "Corte",
    status: "novo",
    tags: ["Novo"],
  },
  {
    id: 9,
    nome: "Lucas Rocha",
    initial: "L",
    telefone: "(71) 99999-0009",
    ultimaVisita: "5 dias",
    totalVisitas: 22,
    totalGasto: 1760,
    ticketMedio: 80,
    avaliacao: 4.9,
    servicoFav: "Corte + Barba",
    status: "ativo",
    tags: ["VIP"],
  },
  {
    id: 10,
    nome: "Felipe Torres",
    initial: "F",
    telefone: "(71) 99999-0010",
    ultimaVisita: "3 semanas",
    totalVisitas: 5,
    totalGasto: 150,
    ticketMedio: 30,
    avaliacao: 3.8,
    servicoFav: "Corte",
    status: "inativo",
    tags: [],
  },
];

const HISTORICO_MOCK = [
  {
    data: "06/05",
    servico: "Corte",
    valor: 30,
    barbeiro: "Carlos",
    avaliacao: 5,
  },
  {
    data: "22/04",
    servico: "Corte + Barba",
    valor: 80,
    barbeiro: "Lucas",
    avaliacao: 5,
  },
  {
    data: "08/04",
    servico: "Corte",
    valor: 30,
    barbeiro: "Carlos",
    avaliacao: 5,
  },
  {
    data: "25/03",
    servico: "Barba",
    valor: 40,
    barbeiro: "Felipe",
    avaliacao: 4,
  },
  {
    data: "11/03",
    servico: "Corte",
    valor: 30,
    barbeiro: "Carlos",
    avaliacao: 5,
  },
];

const STATUS_CONFIG = {
  ativo: {
    label: "Ativo",
    color: "var(--status-success)",
    bg: "rgba(29,185,84,0.1)",
  },
  inativo: {
    label: "Inativo",
    color: "var(--text-muted)",
    bg: "rgba(255,255,255,0.04)",
  },
  novo: {
    label: "Novo",
    color: "var(--status-info)",
    bg: "rgba(77,163,255,0.1)",
  },
};

/* ── Ícone Users2 ── */
function Users2(props: {
  size?: number;
  strokeWidth?: number;
}): React.JSX.Element {
  return (
    <svg
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth ?? 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* ── Painel lateral de detalhes ── */
function ClienteDetalhe({
  cliente,
  onClose,
}: {
  cliente: Cliente;
  onClose: () => void;
}): React.JSX.Element {
  const statusCfg = STATUS_CONFIG[cliente.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderLeft: "1px solid var(--border-default)",
        width: 320,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-[12px] font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          Perfil do cliente
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + nome */}
        <div
          className="px-4 py-5 text-center"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div
            className="mx-auto flex items-center justify-center rounded-full font-bold text-xl mb-3"
            style={{
              width: 56,
              height: 56,
              background: "rgba(77,163,255,0.1)",
              color: "var(--status-info)",
              border: "1px solid rgba(77,163,255,0.2)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {cliente.initial}
          </div>
          <span
            className="block font-bold text-[15px] mb-1"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            {cliente.nome}
          </span>
          <div className="flex items-center justify-center gap-2">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
            {cliente.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] font-medium px-2 py-0.5 rounded"
                style={{
                  background: "rgba(244,180,0,0.1)",
                  color: "var(--status-warning)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Métricas */}
        <div
          className="grid grid-cols-2 gap-2 px-4 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {[
            { label: "Visitas", value: `${cliente.totalVisitas}`, suffix: "x" },
            {
              label: "Total gasto",
              value: `R$${cliente.totalGasto}`,
              suffix: "",
            },
            {
              label: "Ticket médio",
              value: `R$${cliente.ticketMedio}`,
              suffix: "",
            },
            {
              label: "Avaliação",
              value: cliente.avaliacao > 0 ? cliente.avaliacao.toFixed(1) : "—",
              suffix: cliente.avaliacao > 0 ? "★" : "",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg px-3 py-2.5"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span
                className="block text-[10px] uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {m.label}
              </span>
              <span
                className="font-bold text-[15px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                }}
              >
                {m.value}
                {m.suffix && (
                  <span
                    className="text-[11px] ml-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {m.suffix}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Serviço favorito */}
        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span
            className="block text-[10px] uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Serviço favorito
          </span>
          <div className="flex items-center gap-2">
            <Scissors size={13} style={{ color: "var(--status-warning)" }} />
            <span
              className="text-[13px]"
              style={{ color: "var(--text-primary)" }}
            >
              {cliente.servicoFav}
            </span>
          </div>
        </div>

        {/* Contato */}
        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span
            className="block text-[10px] uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Contato
          </span>
          <div className="flex items-center gap-2">
            <Phone size={13} style={{ color: "var(--text-muted)" }} />
            <span
              className="text-[13px]"
              style={{ color: "var(--text-primary)" }}
            >
              {cliente.telefone}
            </span>
          </div>
        </div>

        {/* Histórico */}
        <div className="px-4 py-3">
          <span
            className="block text-[10px] uppercase tracking-wider mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Histórico de visitas
          </span>
          <div className="space-y-2">
            {HISTORICO_MOCK.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 px-3 rounded-lg"
                style={{ background: "var(--bg-secondary)" }}
              >
                <span
                  className="text-[11px] tabular-nums flex-shrink-0"
                  style={{ color: "var(--text-muted)", width: 38 }}
                >
                  {h.data}
                </span>
                <div className="flex-1 min-w-0">
                  <span
                    className="block text-[12px]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {h.servico}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h.barbeiro}
                  </span>
                </div>
                <span
                  className="text-[11px] font-semibold flex-shrink-0"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  R${h.valor}
                </span>
                <span
                  className="text-[11px] flex-shrink-0"
                  style={{ color: "var(--status-warning)" }}
                >
                  {"★".repeat(h.avaliacao)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div
        className="flex gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <button
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold"
          style={{ background: "var(--primary)", color: "#0D0D0D" }}
        >
          <Calendar size={13} /> Agendar
        </button>
        <button
          className="flex items-center justify-center gap-1.5 px-3 rounded-lg py-2 text-[12px]"
          style={{
            background: "transparent",
            border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)",
          }}
        >
          <MessageCircle size={13} />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Página principal ── */
export default function Clientes(): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "todos" | "ativo" | "inativo" | "novo"
  >("todos");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [sortBy, setSortBy] = useState<"nome" | "visitas" | "gasto">("visitas");

  const filtered = CLIENTES.filter((c) => {
    if (filterStatus !== "todos" && c.status !== filterStatus) return false;
    if (search && !c.nome.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "nome") return a.nome.localeCompare(b.nome);
    if (sortBy === "visitas") return b.totalVisitas - a.totalVisitas;
    if (sortBy === "gasto") return b.totalGasto - a.totalGasto;
    return 0;
  });

  const totalAtivos = CLIENTES.filter((c) => c.status === "ativo").length;
  const totalNovos = CLIENTES.filter((c) => c.status === "novo").length;
  const totalGasto = CLIENTES.reduce((s, c) => s + c.totalGasto, 0);
  const mediaTicket = Math.round(totalGasto / CLIENTES.length);

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-5">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total de clientes",
            value: CLIENTES.length,
            status: "info" as const,
            icon: Users2,
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
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
                onFocus={(e: React.FocusEvent<HTMLInputElement>) =>
                  (e.target.style.borderColor = "var(--status-info)")
                }
                onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
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
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSortBy(e.target.value as "nome" | "visitas" | "gasto")
              }
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

            {/* Novo cliente */}
            <button
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

          {/* Lista de clientes */}
          <div className="flex-1 overflow-y-auto">
            {/* Header da tabela */}
            <div
              className="flex items-center px-4 py-2 sticky top-0"
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

            <AnimatePresence>
              {filtered.map((c, i) => {
                const statusCfg = STATUS_CONFIG[c.status];
                const isSelected = selectedCliente?.id === c.id;

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedCliente(isSelected ? null : c)}
                    className="flex items-center px-4 py-3 cursor-pointer"
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      background: isSelected
                        ? "rgba(77,163,255,0.04)"
                        : "transparent",
                      borderLeft: `2px solid ${isSelected ? "var(--status-info)" : "transparent"}`,
                      transition: "background 120ms, border-color 120ms",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--bg-hover)";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                    }}
                  >
                    {/* Nome + avatar */}
                    <div className="flex items-center gap-3 flex-[2] min-w-0">
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-xs"
                        style={{
                          width: 30,
                          height: 30,
                          background: `${statusCfg.color}15`,
                          color: statusCfg.color,
                          fontFamily: "var(--font-heading)",
                        }}
                      >
                        {c.initial}
                      </div>
                      <div className="min-w-0">
                        <span
                          className="block text-[13px] font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {c.nome}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{
                              background: statusCfg.bg,
                              color: statusCfg.color,
                            }}
                          >
                            {statusCfg.label}
                          </span>
                          {c.tags
                            .filter((t) => t === "VIP")
                            .map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                style={{
                                  background: "rgba(244,180,0,0.1)",
                                  color: "var(--status-warning)",
                                }}
                              >
                                {t}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>

                    <span
                      className="flex-1 text-[12px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {c.ultimaVisita}
                    </span>
                    <span
                      className="flex-1 text-[12px] text-right tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {c.totalVisitas}x
                    </span>
                    <span
                      className="flex-1 text-[12px] text-right font-semibold tabular-nums"
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      R${c.totalGasto}
                    </span>
                    <span
                      className="flex-1 text-[12px] text-right"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {c.servicoFav}
                    </span>
                    <div style={{ width: 32, textAlign: "right" }}>
                      <ChevronRight
                        size={13}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
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
              {filtered.length} de {CLIENTES.length} clientes
            </span>
          </div>
        </div>

        {/* Painel de detalhe */}
        <AnimatePresence>
          {selectedCliente && (
            <ClienteDetalhe
              cliente={selectedCliente}
              onClose={() => setSelectedCliente(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
