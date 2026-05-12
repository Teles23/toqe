/* eslint-disable no-restricted-syntax */
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ClientOnlyChart, ChartTooltip } from "@/shared/components/chart-utils";
import type { AgendamentosItem } from "../types/relatorio.types";

interface AgendamentosChartProps {
  data: AgendamentosItem[];
}

export function AgendamentosChart({ data }: AgendamentosChartProps) {
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
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Concluídos vs cancelados
        </span>
      </div>
      <div className="px-4 py-4" style={{ height: 200 }}>
        <ClientOnlyChart>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
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
              <Tooltip content={<ChartTooltip />} />
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
    </div>
  );
}
