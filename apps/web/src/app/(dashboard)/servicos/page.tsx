"use client";

import React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Scissors,
  Clock,
  DollarSign,
  X,
  Search,
  TrendingUp,
  Star,
  Edit2,
  Trash2,
} from "lucide-react";
import StatCard from "@/shared/components/stat-card";

/* ── Tipos ── */
type Categoria = "corte" | "barba" | "combo" | "estetica" | "tratamento";

interface Servico {
  id: number;
  nome: string;
  categoria: Categoria;
  duracao: number;
  preco: number;
  descricao: string;
  ativo: boolean;
  pedidosMes: number;
  receitaMes: number;
  avaliacao: number;
  barbeiros: string[];
}

/* ── Dados ── */
const SERVICOS: Servico[] = [
  {
    id: 1,
    nome: "Corte Clássico",
    categoria: "corte",
    duracao: 30,
    preco: 30,
    ativo: true,
    descricao:
      "Corte tradicional com máquina e tesoura, acabamento com navalha.",
    pedidosMes: 48,
    receitaMes: 1440,
    avaliacao: 4.9,
    barbeiros: ["Carlos", "Lucas", "Felipe"],
  },
  {
    id: 2,
    nome: "Corte + Barba",
    categoria: "combo",
    duracao: 50,
    preco: 80,
    ativo: true,
    descricao: "Combinação completa de corte de cabelo com barba modelada.",
    pedidosMes: 32,
    receitaMes: 2560,
    avaliacao: 4.8,
    barbeiros: ["Carlos", "Lucas"],
  },
  {
    id: 3,
    nome: "Barba Completa",
    categoria: "barba",
    duracao: 30,
    preco: 40,
    ativo: true,
    descricao: "Modelagem de barba com toalha quente e navalha profissional.",
    pedidosMes: 21,
    receitaMes: 840,
    avaliacao: 4.7,
    barbeiros: ["Carlos", "Felipe"],
  },
  {
    id: 4,
    nome: "Degradê",
    categoria: "corte",
    duracao: 40,
    preco: 45,
    ativo: true,
    descricao: "Corte degradê com transição suave, acabamento preciso.",
    pedidosMes: 18,
    receitaMes: 810,
    avaliacao: 4.9,
    barbeiros: ["Lucas"],
  },
  {
    id: 5,
    nome: "Sobrancelha",
    categoria: "estetica",
    duracao: 15,
    preco: 20,
    ativo: true,
    descricao: "Design e modelagem de sobrancelha masculina.",
    pedidosMes: 15,
    receitaMes: 300,
    avaliacao: 4.6,
    barbeiros: ["Felipe"],
  },
  {
    id: 6,
    nome: "Pigmentação",
    categoria: "tratamento",
    duracao: 60,
    preco: 90,
    ativo: true,
    descricao: "Pigmentação capilar para cobertura de falhas e entradas.",
    pedidosMes: 8,
    receitaMes: 720,
    avaliacao: 4.8,
    barbeiros: ["Lucas"],
  },
  {
    id: 7,
    nome: "Hidratação",
    categoria: "tratamento",
    duracao: 45,
    preco: 60,
    ativo: false,
    descricao: "Tratamento de hidratação profunda para cabelos ressecados.",
    pedidosMes: 0,
    receitaMes: 0,
    avaliacao: 0,
    barbeiros: ["Felipe"],
  },
  {
    id: 8,
    nome: "Corte Infantil",
    categoria: "corte",
    duracao: 25,
    preco: 25,
    ativo: true,
    descricao:
      "Corte especial para crianças até 12 anos, com paciência e cuidado.",
    pedidosMes: 12,
    receitaMes: 300,
    avaliacao: 5.0,
    barbeiros: ["Carlos", "Felipe"],
  },
];

const CATEGORIA_CONFIG: Record<
  Categoria,
  { label: string; color: string; bg: string }
> = {
  corte: {
    label: "Corte",
    color: "var(--status-info)",
    bg: "rgba(77,163,255,0.1)",
  },
  barba: {
    label: "Barba",
    color: "var(--status-success)",
    bg: "rgba(29,185,84,0.1)",
  },
  combo: {
    label: "Combo",
    color: "var(--status-warning)",
    bg: "rgba(244,180,0,0.1)",
  },
  estetica: {
    label: "Estética",
    color: "#C084FC",
    bg: "rgba(192,132,252,0.1)",
  },
  tratamento: {
    label: "Tratamento",
    color: "var(--status-error)",
    bg: "rgba(255,77,79,0.1)",
  },
};

/* ── Modal de novo/editar serviço ── */
function ServicoModal({
  servico,
  onClose,
}: {
  servico?: Servico;
  onClose: () => void;
}): React.JSX.Element {
  const [nome, setNome] = useState(servico?.nome ?? "");
  const [preco, setPreco] = useState(servico?.preco ?? 30);
  const [duracao, setDuracao] = useState(servico?.duracao ?? 30);
  const [cat, setCat] = useState<Categoria>(servico?.categoria ?? "corte");
  const [desc, setDesc] = useState(servico?.descricao ?? "");

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-strong)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span
              className="font-bold text-[15px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
              }}
            >
              {servico ? "Editar serviço" : "Novo serviço"}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            {/* Nome */}
            <div>
              <label className="tqe-label">Nome do serviço</label>
              <input
                value={nome}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNome(e.target.value)
                }
                placeholder="Ex: Corte Clássico"
                className="tqe-input"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="tqe-label">Categoria</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(
                  Object.entries(CATEGORIA_CONFIG) as [
                    Categoria,
                    (typeof CATEGORIA_CONFIG)[Categoria],
                  ][]
                ).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setCat(key)}
                    className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: cat === key ? cfg.bg : "var(--bg-secondary)",
                      color: cat === key ? cfg.color : "var(--text-muted)",
                      border: `1px solid ${cat === key ? cfg.color + "40" : "var(--border-default)"}`,
                    }}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preço + Duração */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="tqe-label">Preço (R$)</label>
                <input
                  type="number"
                  value={preco}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPreco(Number(e.target.value))
                  }
                  className="tqe-input"
                  min={0}
                />
              </div>
              <div>
                <label className="tqe-label">Duração (min)</label>
                <input
                  type="number"
                  value={duracao}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDuracao(Number(e.target.value))
                  }
                  className="tqe-input"
                  min={5}
                  step={5}
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="tqe-label">Descrição</label>
              <textarea
                value={desc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDesc(e.target.value)
                }
                placeholder="Descreva o serviço..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
                onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) =>
                  (e.target.style.borderColor = "var(--status-info)")
                }
                onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) =>
                  (e.target.style.borderColor = "var(--border-default)")
                }
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex gap-2 px-5 py-4"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium"
              style={{
                background: "transparent",
                border: "1px solid var(--border-strong)",
                color: "var(--text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              className="flex-1 py-2 rounded-lg text-[13px] font-semibold"
              style={{ background: "var(--primary)", color: "#0D0D0D" }}
            >
              {servico ? "Salvar alterações" : "Criar serviço"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ── Painel de detalhe ── */
function ServicoDetalhe({
  s,
  onClose,
  onEdit,
}: {
  s: Servico;
  onClose: () => void;
  onEdit: () => void;
}): React.JSX.Element {
  const cfg = CATEGORIA_CONFIG[s.categoria];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col overflow-hidden flex-shrink-0"
      style={{
        width: 300,
        background: "var(--bg-card)",
        borderLeft: "1px solid var(--border-default)",
        height: "100%",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-[12px] font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          Detalhes do serviço
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
        {/* Header */}
        <div
          className="px-4 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {/* Ícone */}
          <div
            className="flex items-center justify-center rounded-xl mb-3"
            style={{
              width: 48,
              height: 48,
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.color}30`,
            }}
          >
            <Scissors size={20} strokeWidth={1.8} />
          </div>

          <span
            className="block font-bold text-[15px] mb-1"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            {s.nome}
          </span>

          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded"
              style={{
                background: s.ativo
                  ? "rgba(29,185,84,0.1)"
                  : "rgba(255,255,255,0.04)",
                color: s.ativo ? "var(--status-success)" : "var(--text-muted)",
              }}
            >
              {s.ativo ? "Ativo" : "Inativo"}
            </span>
          </div>

          <p
            className="text-[12px]"
            style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}
          >
            {s.descricao}
          </p>
        </div>

        {/* Info rápida */}
        <div
          className="grid grid-cols-2 divide-x"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {[
            { label: "Preço", value: `R$ ${s.preco}`, icon: DollarSign },
            { label: "Duração", value: `${s.duracao}min`, icon: Clock },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <Icon
                  size={14}
                  style={{ color: "var(--text-muted)", flexShrink: 0 }}
                />
                <div>
                  <span
                    className="block text-[10px] uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="font-bold text-[14px]"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Métricas do mês */}
        <div
          className="grid grid-cols-2 gap-2 px-4 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {[
            { label: "Pedidos/mês", value: `${s.pedidosMes}x` },
            {
              label: "Receita/mês",
              value: s.receitaMes > 0 ? `R$${s.receitaMes}` : "—",
            },
            {
              label: "Avaliação",
              value: s.avaliacao > 0 ? `${s.avaliacao} ★` : "—",
            },
            { label: "Barbeiros", value: `${s.barbeiros.length}` },
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
                className="font-bold text-[14px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* Barbeiros que executam */}
        <div className="px-4 py-3">
          <span
            className="block text-[10px] uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Barbeiros habilitados
          </span>
          <div className="flex flex-wrap gap-2">
            {s.barbeiros.map((b) => (
              <span
                key={b}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold"
          style={{ background: "var(--primary)", color: "#0D0D0D" }}
        >
          <Edit2 size={13} /> Editar
        </button>
        <button
          className="px-3 flex items-center justify-center rounded-lg"
          style={{
            background: "rgba(255,77,79,0.08)",
            border: "1px solid rgba(255,77,79,0.2)",
            color: "var(--status-error)",
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Página principal ── */
export default function Servicos(): React.JSX.Element {
  const [selected, setSelected] = useState<Servico | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Servico | undefined>();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"todos" | Categoria>("todos");
  const [filterAtivo, setFilterAtivo] = useState<"todos" | "ativo" | "inativo">(
    "todos",
  );

  const filtered = SERVICOS.filter((s) => {
    if (filterCat !== "todos" && s.categoria !== filterCat) return false;
    if (filterAtivo === "ativo" && !s.ativo) return false;
    if (filterAtivo === "inativo" && s.ativo) return false;
    if (search && !s.nome.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const totalAtivos = SERVICOS.filter((s) => s.ativo).length;
  const totalReceita = SERVICOS.reduce((sum, s) => sum + s.receitaMes, 0);
  const totalPedidos = SERVICOS.reduce((sum, s) => sum + s.pedidosMes, 0);
  const ticketMedio =
    totalPedidos > 0 ? Math.round(totalReceita / totalPedidos) : 0;

  function openEdit(s: Servico) {
    setEditTarget(s);
    setModalOpen(true);
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 h-full">
      {/* Métricas */}
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
            value: totalPedidos,
            status: "success" as const,
            icon: TrendingUp,
          },
          {
            label: "Receita do mês",
            value: totalReceita,
            unit: "R$",
            status: "warning" as const,
            icon: DollarSign,
          },
          {
            label: "Ticket médio",
            value: ticketMedio,
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

      {/* Conteúdo */}
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
            {/* Busca */}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
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
                onFocus={(e: React.FocusEvent<HTMLInputElement>) =>
                  (e.target.style.borderColor = "var(--status-info)")
                }
                onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                  (e.target.style.borderColor = "var(--border-default)")
                }
              />
            </div>

            {/* Categorias */}
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

            {/* Toggle ativo/inativo */}
            <div
              className="flex rounded-lg p-0.5 gap-0.5"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              {(["todos", "ativo", "inativo"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterAtivo(f)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium transition-all capitalize"
                  style={{
                    background:
                      filterAtivo === f ? "var(--bg-card)" : "transparent",
                    color:
                      filterAtivo === f
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    border: `1px solid ${filterAtivo === f ? "var(--border-default)" : "transparent"}`,
                  }}
                >
                  {f === "todos"
                    ? "Todos"
                    : f === "ativo"
                      ? "Ativos"
                      : "Inativos"}
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

          {/* Grid de serviços */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence>
                {filtered.map((s, i) => {
                  const cfg = CATEGORIA_CONFIG[s.categoria];
                  const isSelected = selected?.id === s.id;

                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -2 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelected(isSelected ? null : s)}
                      className="rounded-xl p-4 cursor-pointer relative overflow-hidden"
                      style={{
                        background: isSelected
                          ? `${cfg.color}06`
                          : "var(--bg-secondary)",
                        border: `1px solid ${isSelected ? cfg.color + "40" : "var(--border-default)"}`,
                        transition: "all 160ms",
                        opacity: s.ativo ? 1 : 0.55,
                      }}
                    >
                      {/* Linha acento topo */}
                      <div
                        className="absolute top-0 left-4 right-4 rounded-b"
                        style={{
                          height: 2,
                          background: cfg.color,
                          opacity: 0.5,
                        }}
                      />

                      {/* Header */}
                      <div className="flex items-start justify-between mb-3 mt-1">
                        <div
                          className="flex items-center justify-center rounded-lg"
                          style={{
                            width: 34,
                            height: 34,
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.color}25`,
                          }}
                        >
                          <Scissors size={15} strokeWidth={1.8} />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          {!s.ativo && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{
                                background: "rgba(255,255,255,0.04)",
                                color: "var(--text-muted)",
                              }}
                            >
                              Inativo
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nome */}
                      <span
                        className="block font-semibold text-[13px] mb-0.5"
                        style={{
                          fontFamily: "var(--font-heading)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {s.nome}
                      </span>
                      <p
                        className="text-[11px] mb-3 line-clamp-2"
                        style={{
                          color: "var(--text-secondary)",
                          lineHeight: 1.5,
                        }}
                      >
                        {s.descricao}
                      </p>

                      {/* Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <DollarSign
                              size={11}
                              style={{ color: "var(--text-muted)" }}
                            />
                            <span
                              className="text-[13px] font-bold"
                              style={{
                                color: "var(--text-primary)",
                                fontFamily: "var(--font-heading)",
                              }}
                            >
                              R${s.preco}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock
                              size={11}
                              style={{ color: "var(--text-muted)" }}
                            />
                            <span
                              className="text-[12px]"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {s.duracao}min
                            </span>
                          </div>
                        </div>

                        {s.pedidosMes > 0 && (
                          <span
                            className="text-[11px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {s.pedidosMes}x/mês
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2.5 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              {filtered.length} de {SERVICOS.length} serviços
            </span>
          </div>
        </div>

        {/* Painel detalhe */}
        <AnimatePresence>
          {selected && (
            <ServicoDetalhe
              s={selected}
              onClose={() => setSelected(null)}
              onEdit={() => openEdit(selected)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
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
