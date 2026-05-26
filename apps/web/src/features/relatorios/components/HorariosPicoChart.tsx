"use client";

import React from "react";
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
import type { HorarioPicoItem } from "../types/relatorio.types";

interface HorariosPicoChartProps {
  data: HorarioPicoItem[];
}

export function HorariosPicoChart({ data }: HorariosPicoChartProps) {
  const chartData = data.map((d) => ({
    hora: `${String(d.hora).padStart(2, "0")}h`,
    quantidade: d.quantidade,
  }));

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
          Horários de pico
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Volume de agendamentos por hora do dia
        </span>
      </div>
      <div
        className="overflow-x-auto"
        style={
          {
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties
        }
      >
        <div style={{ minWidth: 420, height: 180 }} className="px-4 py-4">
          <ClientOnlyChart>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
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
                <Tooltip content={<ChartTooltip suffix=" agend." />} />
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
      </div>
    </div>
  );
}
