"use client";

import React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Download, Calendar,
  DollarSign, Users,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import StatCard from "@/components/stat-card";

/* ── Dados ── */
const FAT_MENSAL = [
  { mes: "Nov", valor: 8200 },
  { mes: "Dez", valor: 11400 },
  { mes: "Jan", valor: 9600 },
  { mes: "Fev", valor: 10200 },
  { mes: "Mar", valor: 12800 },
  { mes: "Abr", valor: 14100 },
  { mes: "Mai", valor: 11240 },
];

const AGEND_SEMANA = [
  { dia: "Seg", concluidos: 12, cancelados: 1 },
  { dia: "Ter", concluidos: 15, cancelados: 2 },
  { dia: "Qua", concluidos: 10, cancelados: 0 },
  { dia: "Qui", concluidos: 18, cancelados: 1 },
  { dia: "Sex", concluidos: 22, cancelados: 3 },
  { dia: "Sáb", concluidos: 28, cancelados: 2 },
  { dia: "Dom", concluidos: 0,  cancelados: 0 },
];

const SERVICOS_PIZZA = [
  { nome: "Corte",         valor: 40, color: "var(--status-info)"    },
  { nome: "Corte+Barba",   valor: 28, color: "var(--status-warning)" },
  { nome: "Barba",         valor: 18, color: "var(--status-success)" },
  { nome: "Outros",        valor: 14, color: "var(--text-muted)"     },
];

const BARBEIROS_RANK = [
  { nome: "Lucas",   fat: 7840, atend: 98,  ticket: 80, aval: 4.8 },
  { nome: "Carlos",  fat: 5600, atend: 112, ticket: 50, aval: 4.9 },
  { nome: "Felipe",  fat: 3440, atend: 86,  ticket: 40, aval: 4.7 },
  { nome: "Rodrigo", fat: 2220, atend: 37,  ticket: 60, aval: 4.6 },
];

const HORARIOS_PICO = [
  { hora: "08h", agend: 4 },
  { hora: "09h", agend: 8 },
  { hora: "10h", agend: 12 },
  { hora: "11h", agend: 9 },
  { hora: "12h", agend: 3 },
  { hora: "13h", agend: 5 },
  { hora: "14h", agend: 14 },
  { hora: "15h", agend: 16 },
  { hora: "16h", agend: 18 },
  { hora: "17h", agend: 11 },
  { hora: "18h", agend: 6 },
];

function ClientOnlyChart({ children }: { children: React.ReactNode }): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}

/* ── Tooltip customizado ── */
function TooltipCustom({ active, payload, label, prefix = "", suffix = "" }: any): React.JSX.Element | null {
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
      <div style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || "var(--text-primary)", fontWeight: 600 }}>
          {prefix}{typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}{suffix}
        </div>
      ))}
    </div>
  );
}

/* ── Página ── */
export default function Relatorios(): React.JSX.Element {
  const [periodo, setPeriodo] = useState<"semana" | "mes" | "ano">("mes");

  const totalFat     = FAT_MENSAL.reduce((s, d) => s + d.valor, 0);
  const fatAnterior  = totalFat * 0.88;
  const crescimento  = Math.round(((totalFat - fatAnterior) / fatAnterior) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Header + Export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1
            className="font-bold text-[18px] leading-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
          >
            Relatórios
          </h1>
          <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
            Visão consolidada de performance
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle período */}
          <div
            className="flex rounded-lg p-0.5 gap-0.5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
          >
            {(["semana", "mes", "ano"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className="px-3 py-1.5 rounded text-[11px] font-medium transition-all capitalize"
                style={{
                  background: periodo === p ? "var(--bg-hover)" : "transparent",
                  color: periodo === p ? "var(--text-primary)" : "var(--text-muted)",
                  border: `1px solid ${periodo === p ? "var(--border-default)" : "transparent"}`,
                }}
              >
                {p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Ano"}
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
            label: "Faturamento total", value: totalFat, unit: "R$",
            status: "success" as const, icon: DollarSign,
            trend: { value: crescimento, label: "vs período ant." },
          },
          {
            label: "Total agendamentos", value: 333,
            status: "info"    as const, icon: Calendar,
            trend: { value: 8, label: "vs período ant." },
          },
          {
            label: "Novos clientes",    value: 28,
            status: "warning" as const, icon: Users,
            trend: { value: 14, label: "vs período ant." },
          },
          {
            label: "Taxa de retorno",   value: 68, unit: "%",
            status: "neutral" as const, icon: TrendingUp,
            animate: false,
            trend: { value: 3, label: "vs período ant." },
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
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <span
              className="block font-semibold text-[13px]"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
            >
              Evolução do faturamento
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Últimos 7 meses
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight size={14} style={{ color: "var(--status-success)" }} />
            <span className="text-[13px] font-bold" style={{ color: "var(--status-success)", fontFamily: "var(--font-heading)" }}>
              +{crescimento}%
            </span>
          </div>
        </div>
        <div className="px-4 py-4" style={{ height: 220 }}>
          <ClientOnlyChart>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={FAT_MENSAL} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F4B400" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#F4B400" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<TooltipCustom prefix="R$ " />} />
              <Area type="monotone" dataKey="valor" stroke="#F4B400" strokeWidth={2} fill="url(#gradRel)"
                dot={false} activeDot={{ r: 4, fill: "#F4B400", stroke: "var(--bg-card)", strokeWidth: 2 }} />
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
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
        >
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="block font-semibold text-[13px]" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              Agendamentos por dia
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Concluídos vs cancelados
            </span>
          </div>
          <div className="px-4 py-4" style={{ height: 200 }}>
            <ClientOnlyChart>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={AGEND_SEMANA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipCustom />} />
                <Bar dataKey="concluidos" name="Concluídos" fill="var(--status-success)" radius={[3,3,0,0]} maxBarSize={24} fillOpacity={0.85} />
                <Bar dataKey="cancelados"  name="Cancelados"  fill="var(--status-error)"   radius={[3,3,0,0]} maxBarSize={24} fillOpacity={0.7} />
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
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
        >
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="block font-semibold text-[13px]" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              Mix de serviços
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Distribuição por tipo
            </span>
          </div>
          <div className="px-4 py-4 flex flex-col items-center gap-4">
            <div style={{ width: "100%", height: 140 }}>
              <ClientOnlyChart>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie
                    data={SERVICOS_PIZZA}
                    cx="50%" cy="50%"
                    innerRadius={40} outerRadius={64}
                    dataKey="valor"
                    strokeWidth={0}
                  >
                    {SERVICOS_PIZZA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-body)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </div>
            <div className="w-full space-y-2">
              {SERVICOS_PIZZA.map(s => (
                <div key={s.nome} className="flex items-center gap-2">
                  <span className="rounded-sm flex-shrink-0" style={{ width: 8, height: 8, background: s.color }} />
                  <span className="flex-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>{s.nome}</span>
                  <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                    {s.valor}%
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
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
      >
        <div
          className="px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span className="block font-semibold text-[13px]" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
            Horários de pico
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Volume de agendamentos por hora do dia
          </span>
        </div>
        <div className="px-4 py-4" style={{ height: 180 }}>
          <ClientOnlyChart>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HORARIOS_PICO} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="hora" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipCustom suffix=" agend." />} />
              <Bar dataKey="agend" fill="var(--status-info)" radius={[3,3,0,0]} maxBarSize={28} fillOpacity={0.8} />
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
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
      >
        <div
          className="px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span className="block font-semibold text-[13px]" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
            Performance por barbeiro
          </span>
        </div>

        {/* Header tabela */}
        <div
          className="grid px-5 py-2"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}
        >
          {["Barbeiro", "Atend.", "Faturamento", "Ticket médio", "Avaliação"].map(h => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {h}
            </span>
          ))}
        </div>

        {BARBEIROS_RANK.map((b, i) => (
          <motion.div
            key={b.nome}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className="grid px-5 py-3.5 items-center"
            style={{
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
              borderBottom: i < BARBEIROS_RANK.length - 1 ? "1px solid var(--border-subtle)" : "none",
              transition: "background 120ms",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = "transparent")}
          >
            {/* Nome */}
            <div className="flex items-center gap-2.5">
              <span
                className="font-bold text-[11px] flex-shrink-0"
                style={{
                  color: i === 0 ? "var(--status-warning)" : "var(--text-muted)",
                  fontFamily: "var(--font-heading)",
                  width: 16,
                }}
              >
                {i + 1}
              </span>
              <div
                className="flex items-center justify-center rounded-full font-bold text-xs flex-shrink-0"
                style={{
                  width: 28, height: 28,
                  background: "rgba(77,163,255,0.1)",
                  color: "var(--status-info)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {b.nome[0]}
              </div>
              <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{b.nome}</span>
            </div>

            {/* Atendimentos */}
            <span className="text-[13px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {b.atend}x
            </span>

            {/* Faturamento */}
            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              R${(b.fat / 1000).toFixed(1)}k
            </span>

            {/* Ticket */}
            <span className="text-[13px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
              R${b.ticket}
            </span>

            {/* Avaliação */}
            <span className="text-[13px]" style={{ color: "var(--status-warning)" }}>
              ★ {b.aval}
            </span>
          </motion.div>
        ))}
      </motion.div>

    </div>
  );
}
