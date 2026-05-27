"use client";

import React from "react";
import {
  Building2,
  TrendingUp,
  Calendar,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import type { RedeTotais } from "../types/rede.types";

interface RedeTotaisBarProps {
  totais: RedeTotais;
  qtdUnidades: number;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

interface KpiItem {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  borderColor: string;
}

export function RedeTotaisBar({
  totais,
  qtdUnidades,
}: RedeTotaisBarProps): React.JSX.Element {
  const items: KpiItem[] = [
    {
      label: "Unidades",
      value: String(qtdUnidades),
      icon: Building2,
      color: "var(--text-primary)",
      glow: "rgba(240,240,240,0.06)",
      borderColor: "rgba(240,240,240,0.1)",
    },
    {
      label: "Fat. hoje (rede)",
      value: formatBRL(totais.faturamentoHoje),
      icon: TrendingUp,
      color: "var(--status-success)",
      glow: "rgba(29,185,84,0.08)",
      borderColor: "rgba(29,185,84,0.15)",
    },
    {
      label: "Fat. mês (rede)",
      value: formatBRL(totais.faturamentoMes),
      icon: DollarSign,
      color: "var(--status-success)",
      glow: "rgba(29,185,84,0.06)",
      borderColor: "rgba(29,185,84,0.12)",
    },
    {
      label: "Agend. hoje",
      value: String(totais.agendamentosHoje),
      icon: Calendar,
      color: "var(--status-info)",
      glow: "rgba(77,163,255,0.08)",
      borderColor: "rgba(77,163,255,0.15)",
    },
    {
      label: "Concluídos",
      value: String(totais.concluidos),
      icon: CheckCircle2,
      color: "var(--primary)",
      glow: "rgba(244,180,0,0.08)",
      borderColor: "rgba(244,180,0,0.15)",
    },
  ];

  const taxaConclusao =
    totais.agendamentosHoje > 0
      ? Math.round((totais.concluidos / totais.agendamentosHoje) * 100)
      : 0;

  return (
    <div
      className="rounded-xl overflow-hidden border"
      // eslint-disable-next-line no-restricted-syntax
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        // eslint-disable-next-line no-restricted-syntax
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="rounded-full"
            // eslint-disable-next-line no-restricted-syntax
            style={{
              width: 6,
              height: 6,
              background: "var(--status-success)",
              animation: "tqe-pulse-green 1.5s ease-in-out infinite",
            }}
          />
          <span
            className="text-[12px] font-semibold uppercase tracking-wider"
            // eslint-disable-next-line no-restricted-syntax
            style={{ color: "var(--text-secondary)" }}
          >
            Consolidado de hoje
          </span>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-[11px] font-medium"
          // eslint-disable-next-line no-restricted-syntax
          style={{
            background: "rgba(244,180,0,0.1)",
            color: "var(--primary)",
          }}
        >
          {taxaConclusao}% de conclusão
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex flex-col gap-2 px-5 py-4 relative"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                borderRight:
                  idx < items.length - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
                borderBottom:
                  idx < 2 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              {/* Background glow — dynamic per color */}
              <div
                className="absolute inset-0 pointer-events-none"
                // eslint-disable-next-line no-restricted-syntax
                style={{
                  background: `radial-gradient(ellipse 80% 60% at 20% 50%, ${item.glow} 0%, transparent 70%)`,
                }}
              />

              {/* Icon + label row */}
              <div className="relative flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  // eslint-disable-next-line no-restricted-syntax
                  style={{
                    width: 28,
                    height: 28,
                    background: item.glow,
                    border: `1px solid ${item.borderColor}`,
                  }}
                >
                  <Icon size={13} color={item.color} strokeWidth={2} />
                </div>
                <span
                  className="text-[11px] font-medium uppercase tracking-wide leading-tight"
                  // eslint-disable-next-line no-restricted-syntax
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.label}
                </span>
              </div>

              {/* Value */}
              <p
                className="relative font-bold tracking-tight leading-none"
                // eslint-disable-next-line no-restricted-syntax
                style={{
                  color: item.color,
                  fontSize: "clamp(1rem, 2vw, 1.25rem)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
