"use client";

import { ArrowUpRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ClientOnlyChart, ChartTooltip } from "@/shared/components/chart-utils";
import type { FaturamentoItem } from "../types/relatorio.types";

interface FaturamentoChartProps {
  data: FaturamentoItem[];
}

export function FaturamentoChart({ data }: FaturamentoChartProps) {
  const chartData = data.map((d) => ({ ...d, data: d.data.slice(5) }));

  return (
    <div
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
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Por período selecionado
          </span>
        </div>
        {data.length > 0 && (
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
              período atual
            </span>
          </div>
        )}
      </div>
      <div className="px-4 py-4" style={{ height: 220 }}>
        <ClientOnlyChart>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip content={<ChartTooltip prefix="R$ " />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#F4B400"
                strokeWidth={2}
                fill="url(#gradFat)"
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
    </div>
  );
}
