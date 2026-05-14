"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FaturamentoPonto } from "../types/dashboard.types";
import { formatBRL } from "@/shared/lib/utils";

type Periodo = "semana" | "mes";

interface FaturamentoChartProps {
  semana: FaturamentoPonto[];
  mes: FaturamentoPonto[];
}

/** Recharts chama com any payload — tipagem mínima local. */
interface TooltipPayloadEntry {
  value?: number;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps): React.JSX.Element | null {
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
        {payload[0]?.value !== undefined
          ? formatBRL(payload[0].value as number)
          : ""}
      </div>
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

/** Card de faturamento com toggle semana/mês. */
export function FaturamentoChart({
  semana,
  mes,
}: FaturamentoChartProps): React.JSX.Element {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const data = periodo === "semana" ? semana : mes;
  const total = data.reduce((s, d) => s + d.valor, 0);

  return (
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
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Total · {formatBRL(total)}
          </span>
        </div>

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
                background: periodo === p ? "var(--bg-card)" : "transparent",
                color:
                  periodo === p ? "var(--text-primary)" : "var(--text-muted)",
                border: `1px solid ${periodo === p ? "var(--border-default)" : "transparent"}`,
              }}
            >
              {p === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4" style={{ minWidth: 0 }}>
        <ClientOnlyChart>
          <ResponsiveContainer width="100%" aspect={2.5}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
  );
}
