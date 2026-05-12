"use client";

import React from "react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  DollarSign,
  Star,
  Scissors,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import StatCard from "@/shared/components/stat-card";
import { useRouter } from "next/navigation";

/* ── Dados de exemplo ── */
const FATURAMENTO_SEMANA = [
  { dia: "Seg", valor: 420 },
  { dia: "Ter", valor: 580 },
  { dia: "Qua", valor: 390 },
  { dia: "Qui", valor: 710 },
  { dia: "Sex", valor: 890 },
  { dia: "Sáb", valor: 1240 },
  { dia: "Dom", valor: 0 },
];

const SERVICOS_POPULARES = [
  { nome: "Corte", quantidade: 48, receita: 1440, pct: 100 },
  { nome: "Corte + Barba", quantidade: 32, receita: 1760, pct: 67 },
  { nome: "Barba", quantidade: 21, receita: 630, pct: 44 },
  { nome: "Sobrancelha", quantidade: 15, receita: 300, pct: 31 },
  { nome: "Pigmentação", quantidade: 8, receita: 720, pct: 17 },
];

const ATIVIDADE_RECENTE = [
  {
    tipo: "confirmado",
    texto: "Pedro Santos confirmou 09:00",
    tempo: "2min",
    cor: "var(--status-success)",
  },
  {
    tipo: "novo",
    texto: "Novo agendamento — Rafael 14:00",
    tempo: "8min",
    cor: "var(--status-info)",
  },
  {
    tipo: "atrasado",
    texto: "João Silva atrasado — 08:30",
    tempo: "12min",
    cor: "var(--status-error)",
  },
  {
    tipo: "encaixe",
    texto: "Horário encaixado — Carlos 13:00",
    tempo: "18min",
    cor: "var(--status-warning)",
  },
  {
    tipo: "concluido",
    texto: "Diego Mendes — Corte concluído",
    tempo: "34min",
    cor: "var(--status-success)",
  },
  {
    tipo: "avaliacao",
    texto: "Marco Oliveira deixou 5 estrelas",
    tempo: "1h",
    cor: "var(--status-warning)",
  },
];

const BARBEIROS_STATUS = [
  {
    nome: "Carlos",
    initial: "C",
    estado: "active" as const,
    cliente: "João Silva",
    servico: "Corte",
    pct: 68,
  },
  {
    nome: "Lucas",
    initial: "L",
    estado: "idle" as const,
    cliente: null,
    servico: null,
    pct: 0,
  },
  {
    nome: "Felipe",
    initial: "F",
    estado: "active" as const,
    cliente: "Ana Costa",
    servico: "Sobrancelha",
    pct: 45,
  },
];

/* ── Tooltip customizado ── */
function CustomTooltip({
  active,
  payload,
  label,
}: any): React.JSX.Element | null {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-strong)",
        boxShadow: "var(--shadow-md)",
        fontSize: 12,
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ color: "var(--text-secondary)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: "var(--status-success)", fontWeight: 600 }}>
        R$ {payload[0]?.value?.toLocaleString("pt-BR")}
      </div>
    </div>
  );
}

/* ── Componente: Barbeiro ao vivo ── */
function BarbeiroLive({
  b,
}: {
  b: (typeof BARBEIROS_STATUS)[0];
}): React.JSX.Element {
  const stateColor =
    b.estado === "active" ? "var(--status-success)" : "var(--text-muted)";

  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl relative overflow-hidden"
      style={{
        background:
          b.estado === "active" ? "rgba(29,185,84,0.04)" : "transparent",
        border: `1px solid ${b.estado === "active" ? "rgba(29,185,84,0.15)" : "var(--border-subtle)"}`,
        transition: "all 200ms",
      }}
    >
      {/* Barra lateral */}
      {b.estado === "active" && (
        <div
          className="absolute left-0 top-2 bottom-2 rounded-r"
          style={{
            width: 2,
            background: "var(--status-success)",
            animation: "tqe-sidebar-pulse 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Avatar */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-xs relative"
        style={{
          width: 32,
          height: 32,
          background: `${stateColor}18`,
          color: stateColor,
          border: `1px solid ${stateColor}30`,
          fontFamily: "var(--font-heading)",
        }}
      >
        {b.initial}
        <span
          className="absolute bottom-0 right-0 rounded-full"
          style={{
            width: 8,
            height: 8,
            background: stateColor,
            border: "2px solid var(--bg-card)",
            animation:
              b.estado === "active"
                ? "tqe-pulse-green 2s ease-in-out infinite"
                : "none",
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span
          className="block font-medium text-[13px]"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
          }}
        >
          {b.nome}
        </span>
        {b.estado === "active" && b.cliente ? (
          <>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {b.cliente} · {b.servico}
            </span>
            {/* Progress bar */}
            <div
              className="mt-1.5 rounded-full overflow-hidden"
              style={{
                height: 2,
                background: "var(--border-default)",
                width: "100%",
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--status-success)" }}
                initial={{ width: 0 }}
                animate={{ width: `${b.pct}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </>
        ) : (
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Disponível
          </span>
        )}
      </div>

      {/* Estado */}
      <span
        className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0"
        style={{ color: stateColor }}
      >
        {b.estado === "active" ? "Ativo" : "Livre"}
      </span>
    </div>
  );
}

function ClientOnlyChart({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}

/* ── Página principal ── */
export default function Dashboard(): React.JSX.Element {
  const router = useRouter();
  const [periodo, setPeriodo] = useState<"semana" | "mes">("semana");

  const totalFaturamento = FATURAMENTO_SEMANA.reduce((s, d) => s + d.valor, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* ── Métricas principais ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Faturamento hoje",
            value: 890,
            unit: "R$",
            status: "success" as const,
            icon: DollarSign,
            trend: { value: 12, label: "vs ontem" },
          },
          {
            label: "Agendamentos",
            value: 14,
            status: "info" as const,
            icon: Calendar,
            subtitle: "9 concluídos · 3 ativos",
          },
          {
            label: "Ticket médio",
            value: 63,
            unit: "R$",
            status: "warning" as const,
            icon: TrendingUp,
            trend: { value: 5, label: "vs semana" },
          },
          {
            label: "Avaliação média",
            value: "4.8",
            unit: "★",
            status: "success" as const,
            icon: Star,
            subtitle: "Baseado em 38 avaliações",
            animate: false,
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.07,
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* ── Status ao vivo ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.22 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
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
            <span
              className="font-semibold text-[13px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
              }}
            >
              Status ao vivo
            </span>
          </div>
          <button
            onClick={() => router.push("/agenda")}
            className="flex items-center gap-1 text-[12px] transition-colors"
            style={{ color: "var(--status-info)" }}
          >
            Ver agenda <ChevronRight size={13} />
          </button>
        </div>

        {/* Métricas ao vivo em linha */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 divide-x"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {[
            {
              label: "Barbeiros ativos",
              value: "3",
              color: "var(--status-success)",
            },
            {
              label: "Próximo horário",
              value: "10:30",
              color: "var(--text-primary)",
            },
            { label: "Aguardando", value: "2", color: "var(--status-warning)" },
            {
              label: "Tempo médio",
              value: "38min",
              color: "var(--status-info)",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-5 py-3 flex flex-col gap-0.5"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span
                className="font-bold text-[18px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: stat.color,
                  letterSpacing: "-0.03em",
                }}
              >
                {stat.value}
              </span>
              <span
                className="text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Barbeiros */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {BARBEIROS_STATUS.map((b) => (
            <BarbeiroLive key={b.nome} b={b} />
          ))}
        </div>
      </motion.div>

      {/* ── Gráfico + Atividade ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Gráfico de faturamento */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.22 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div>
              <span
                className="block font-semibold text-[13px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--text-primary)",
                }}
              >
                Faturamento
              </span>
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                Total da semana · R$ {totalFaturamento.toLocaleString("pt-BR")}
              </span>
            </div>

            {/* Toggle período */}
            <div
              className="flex rounded-lg p-0.5 gap-0.5"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              {(["semana", "mes"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className="px-3 py-1 rounded text-[11px] font-medium transition-all capitalize"
                  style={{
                    background:
                      periodo === p ? "var(--bg-card)" : "transparent",
                    color:
                      periodo === p
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    border: `1px solid ${periodo === p ? "var(--border-default)" : "transparent"}`,
                  }}
                >
                  {p === "semana" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-4" style={{ height: 200 }}>
            <ClientOnlyChart>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={FATURAMENTO_SEMANA}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1DB954" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1DB954" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dia"
                    tick={{
                      fill: "var(--text-muted)",
                      fontSize: 11,
                      fontFamily: "var(--font-body)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: "var(--text-muted)",
                      fontSize: 11,
                      fontFamily: "var(--font-body)",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#1DB954"
                    strokeWidth={2}
                    fill="url(#gradFat)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#1DB954",
                      stroke: "var(--bg-card)",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ClientOnlyChart>
          </div>
        </motion.div>

        {/* Feed de atividade */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.42, duration: 0.22 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span
              className="font-semibold text-[13px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
              }}
            >
              Atividade recente
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded font-semibold"
              style={{
                background: "rgba(77,163,255,0.1)",
                color: "var(--status-info)",
              }}
            >
              Ao vivo
            </span>
          </div>

          <div className="py-1">
            {ATIVIDADE_RECENTE.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                className="flex items-start gap-3 px-4 py-2.5 cursor-pointer"
                style={{ transition: "background 120ms" }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span
                  className="flex-shrink-0 rounded-full mt-1.5"
                  style={{ width: 6, height: 6, background: a.cor }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className="block text-[12px]"
                    style={{ color: "var(--text-primary)", lineHeight: 1.4 }}
                  >
                    {a.texto}
                  </span>
                </div>
                <span
                  className="text-[10px] flex-shrink-0 mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {a.tempo}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Serviços populares ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.22 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span
            className="font-semibold text-[13px]"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            Serviços mais pedidos
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Esta semana
          </span>
        </div>

        <div className="px-5 py-4 space-y-3">
          {SERVICOS_POPULARES.map((s, i) => (
            <motion.div
              key={s.nome}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.52 + i * 0.05 }}
              className="flex items-center gap-4"
            >
              {/* Rank */}
              <span
                className="flex-shrink-0 font-bold text-[12px] w-4 text-right"
                style={{
                  fontFamily: "var(--font-heading)",
                  color:
                    i === 0 ? "var(--status-warning)" : "var(--text-muted)",
                }}
              >
                {i + 1}
              </span>

              {/* Nome */}
              <span
                className="flex-shrink-0 text-[13px] font-medium"
                style={{ color: "var(--text-primary)", width: 120 }}
              >
                {s.nome}
              </span>

              {/* Barra */}
              <div
                className="flex-1 rounded-full overflow-hidden"
                style={{ height: 3, background: "var(--border-default)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      i === 0
                        ? "var(--status-success)"
                        : i === 1
                          ? "var(--status-info)"
                          : "var(--text-muted)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{
                    delay: 0.6 + i * 0.05,
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </div>

              {/* Qtd */}
              <span
                className="flex-shrink-0 text-[12px] tabular-nums w-8 text-right"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.quantidade}x
              </span>

              {/* Receita */}
              <span
                className="flex-shrink-0 text-[12px] font-semibold tabular-nums w-16 text-right"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                R${s.receita}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Ações rápidas ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.58, duration: 0.22 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          {
            label: "Novo agendamento",
            icon: Calendar,
            href: "/agenda",
            color: "var(--primary)",
          },
          {
            label: "Cadastrar cliente",
            icon: Users,
            href: "/clientes",
            color: "var(--status-info)",
          },
          {
            label: "Ver relatório",
            icon: BarChart3,
            href: "/relatorios",
            color: "var(--status-success)",
          },
          {
            label: "Configurações",
            icon: Scissors,
            href: "/configuracoes",
            color: "var(--text-secondary)",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(action.href)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                transition: "border-color 160ms, box-shadow 160ms",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--border-strong)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "var(--shadow-sm)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--border-default)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-lg"
                style={{
                  width: 32,
                  height: 32,
                  background: `${action.color}15`,
                  color: action.color,
                }}
              >
                <Icon size={15} strokeWidth={1.8} />
              </div>
              <span
                className="text-[12px] font-medium"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {action.label}
              </span>
              <ArrowUpRight
                size={12}
                className="ml-auto flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
              />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
