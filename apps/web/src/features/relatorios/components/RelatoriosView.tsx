/* eslint-disable no-restricted-syntax */
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import StatCard from "@/shared/components/stat-card";
import { useAuth } from "@/shared/hooks/use-auth";
import {
  useFaturamento,
  useAgendamentosRelatorio,
  useServicosRelatorio,
  useBarbeirosRelatorio,
  useHorariosPico,
} from "../hooks/use-relatorios";
import { PERIODO_OPTIONS } from "../constants/relatorio.constants";
import type { Periodo } from "../types/relatorio.types";

function ClientOnlyChart({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted ? <>{children}</> : null;
}

function TooltipCustom({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
}: {
  active?: boolean;
  payload?: { color?: string; value: number | string }[];
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
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
      {payload.map((p, i) => (
        <div
          key={i}
          style={{ color: p.color ?? "var(--text-primary)", fontWeight: 600 }}
        >
          {prefix}
          {typeof p.value === "number"
            ? p.value.toLocaleString("pt-BR")
            : p.value}
          {suffix}
        </div>
      ))}
    </div>
  );
}

const PIE_COLORS = [
  "var(--status-info)",
  "var(--status-warning)",
  "var(--status-success)",
  "var(--text-muted)",
];

export function RelatoriosView() {
  const { barbearia } = useAuth();
  const barCodigo = barbearia?.codigo ?? null;

  const [periodo, setPeriodo] = useState<Periodo>("30d");

  const { data: faturamento = [] } = useFaturamento(barCodigo, periodo);
  const { data: agendamentos = [] } = useAgendamentosRelatorio(
    barCodigo,
    periodo,
  );
  const { data: servicos = [] } = useServicosRelatorio(barCodigo, periodo);
  const { data: barbeiros = [] } = useBarbeirosRelatorio(barCodigo, periodo);
  const { data: horariosPico = [] } = useHorariosPico(barCodigo, periodo);

  const totalFat = faturamento.reduce((s, d) => s + d.total, 0);
  const totalAgend = agendamentos.reduce(
    (s, d) => s + d.concluido + d.cancelado + d.no_show,
    0,
  );
  const crescimento = totalFat > 0 ? 12 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header + Export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1
            className="font-bold text-[18px] leading-tight"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            Relatórios
          </h1>
          <span
            className="text-[12px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Visão consolidada de performance
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle período */}
          <div
            className="flex rounded-lg p-0.5 gap-0.5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            {PERIODO_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className="px-3 py-1.5 rounded text-[11px] font-medium transition-all"
                style={{
                  background:
                    periodo === p.value ? "var(--bg-hover)" : "transparent",
                  color:
                    periodo === p.value
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  border: `1px solid ${periodo === p.value ? "var(--border-default)" : "transparent"}`,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            <Download size={13} /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Faturamento total",
            value: totalFat,
            unit: "R$",
            status: "success" as const,
            icon: DollarSign,
          },
          {
            label: "Total agendamentos",
            value: totalAgend,
            status: "info" as const,
            icon: Calendar,
          },
          {
            label: "Serviços distintos",
            value: servicos.length,
            status: "warning" as const,
            icon: Users,
          },
          {
            label: "Barbeiros ativos",
            value: barbeiros.length,
            status: "neutral" as const,
            icon: TrendingUp,
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

      {/* Faturamento ao longo do tempo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
              Evolução do faturamento
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Por período selecionado
            </span>
          </div>
          {crescimento > 0 && (
            <div className="flex items-center gap-1.5">
              <ArrowUpRight
                size={14}
                style={{ color: "var(--status-success)" }}
              />
              <span
                className="text-[13px] font-bold"
                style={{
                  color: "var(--status-success)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                +{crescimento}%
              </span>
            </div>
          )}
        </div>
        <div className="px-4 py-4" style={{ height: 220 }}>
          <ClientOnlyChart>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={faturamento.map((d) => ({ ...d, data: d.data.slice(5) }))}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradRel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4B400" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#F4B400" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-subtle)"
                  vertical={false}
                />
                <XAxis
                  dataKey="data"
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
                  tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<TooltipCustom prefix="R$ " />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#F4B400"
                  strokeWidth={2}
                  fill="url(#gradRel)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#F4B400",
                    stroke: "var(--bg-card)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ClientOnlyChart>
        </div>
      </motion.div>

      {/* Agendamentos + Mix de serviços */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* Agendamentos por dia */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span
              className="block font-semibold text-[13px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
              }}
            >
              Agendamentos por dia
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Concluídos vs cancelados
            </span>
          </div>
          <div className="px-4 py-4" style={{ height: 200 }}>
            <ClientOnlyChart>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={agendamentos.map((d) => ({
                    ...d,
                    data: d.data.slice(5),
                  }))}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  barGap={2}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="data"
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
                  />
                  <Tooltip content={<TooltipCustom />} />
                  <Bar
                    dataKey="concluido"
                    name="Concluídos"
                    fill="var(--status-success)"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={24}
                    fillOpacity={0.85}
                  />
                  <Bar
                    dataKey="cancelado"
                    name="Cancelados"
                    fill="var(--status-error)"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={24}
                    fillOpacity={0.7}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ClientOnlyChart>
          </div>
        </motion.div>

        {/* Mix de serviços */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span
              className="block font-semibold text-[13px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
              }}
            >
              Mix de serviços
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Distribuição por tipo
            </span>
          </div>
          <div className="px-4 py-4 flex flex-col items-center gap-4">
            <div style={{ width: "100%", height: 140 }}>
              <ClientOnlyChart>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={servicos}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={64}
                      dataKey="quantidade"
                      nameKey="nome"
                      strokeWidth={0}
                    >
                      {servicos.map((_entry, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-strong)",
                        borderRadius: 8,
                        fontSize: 12,
                        fontFamily: "var(--font-body)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </div>
            <div className="w-full space-y-2">
              {servicos.map((s, i) => (
                <div key={s.nome} className="flex items-center gap-2">
                  <span
                    className="rounded-sm flex-shrink-0"
                    style={{
                      width: 8,
                      height: 8,
                      background: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                  <span
                    className="flex-1 text-[12px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.nome}
                  </span>
                  <span
                    className="text-[12px] font-semibold"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    {s.quantidade}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Horários de pico */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div
          className="px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span
            className="block font-semibold text-[13px]"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            Horários de pico
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Volume de agendamentos por hora do dia
          </span>
        </div>
        <div className="px-4 py-4" style={{ height: 180 }}>
          <ClientOnlyChart>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={horariosPico.map((d) => ({
                  hora: `${String(d.hora).padStart(2, "0")}h`,
                  quantidade: d.quantidade,
                }))}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-subtle)"
                  vertical={false}
                />
                <XAxis
                  dataKey="hora"
                  tick={{
                    fill: "var(--text-muted)",
                    fontSize: 10,
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
                />
                <Tooltip content={<TooltipCustom suffix=" agend." />} />
                <Bar
                  dataKey="quantidade"
                  fill="var(--status-info)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                  fillOpacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </ClientOnlyChart>
        </div>
      </motion.div>

      {/* Ranking de barbeiros */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div
          className="px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span
            className="block font-semibold text-[13px]"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            Performance por barbeiro
          </span>
        </div>

        <div
          className="grid px-5 py-2"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-secondary)",
          }}
        >
          {[
            "Barbeiro",
            "Atend.",
            "Faturamento",
            "Ticket médio",
            "Avaliação",
          ].map((h) => (
            <span
              key={h}
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {h}
            </span>
          ))}
        </div>

        {barbeiros.map((b, i) => (
          <motion.div
            key={b.nome}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className="grid px-5 py-3.5 items-center"
            style={{
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
              borderBottom:
                i < barbeiros.length - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
              transition: "background 120ms",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "transparent")
            }
          >
            <div className="flex items-center gap-2.5">
              <span
                className="font-bold text-[11px] flex-shrink-0"
                style={{
                  color:
                    i === 0 ? "var(--status-warning)" : "var(--text-muted)",
                  fontFamily: "var(--font-heading)",
                  width: 16,
                }}
              >
                {i + 1}
              </span>
              <div
                className="flex items-center justify-center rounded-full font-bold text-xs flex-shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  background: "rgba(77,163,255,0.1)",
                  color: "var(--status-info)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {b.nome[0]}
              </div>
              <span
                className="text-[13px] font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {b.nome}
              </span>
            </div>

            <span
              className="text-[13px] tabular-nums"
              style={{ color: "var(--text-secondary)" }}
            >
              {b.atendimentos}x
            </span>

            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              R${(b.faturamento / 1000).toFixed(1)}k
            </span>

            <span
              className="text-[13px] tabular-nums"
              style={{ color: "var(--text-secondary)" }}
            >
              R${b.ticketMedio}
            </span>

            <span
              className="text-[13px]"
              style={{ color: "var(--status-warning)" }}
            >
              ★ {b.avaliacao.toFixed(1)}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
