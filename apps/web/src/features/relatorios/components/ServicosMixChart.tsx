/* eslint-disable no-restricted-syntax */
"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ClientOnlyChart } from "@/shared/components/chart-utils";
import type { ServicoItem } from "../types/relatorio.types";

const PIE_COLORS = [
  "var(--status-info)",
  "var(--status-warning)",
  "var(--status-success)",
  "var(--text-muted)",
];

interface ServicosMixChartProps {
  data: ServicoItem[];
}

export function ServicosMixChart({ data }: ServicosMixChartProps) {
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
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={64}
                  dataKey="quantidade"
                  nameKey="nome"
                  strokeWidth={0}
                >
                  {data.map((_entry, i) => (
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
          {data.map((s, i) => (
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
    </div>
  );
}
