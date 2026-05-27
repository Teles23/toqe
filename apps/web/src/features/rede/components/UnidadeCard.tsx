"use client";

import React from "react";
import {
  Building2,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Users,
  ArrowRight,
} from "lucide-react";
import type { UnidadeResumo } from "../types/rede.types";

interface UnidadeCardProps {
  unidade: UnidadeResumo;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function UnidadeCard({ unidade }: UnidadeCardProps): React.JSX.Element {
  const taxaConclusao =
    unidade.agendamentosHoje > 0
      ? Math.round((unidade.concluidos / unidade.agendamentosHoje) * 100)
      : 0;

  const taxaColor =
    taxaConclusao >= 75
      ? "var(--status-success)"
      : taxaConclusao >= 40
        ? "var(--status-warning)"
        : "var(--status-error)";

  const metrics = [
    {
      label: "Fat. hoje",
      value: formatBRL(unidade.faturamentoHoje),
      icon: TrendingUp,
      color: "var(--status-success)",
    },
    {
      label: "Fat. mês",
      value: formatBRL(unidade.faturamentoMes),
      icon: Calendar,
      color: "var(--text-primary)",
    },
    {
      label: "Agend. hoje",
      value: String(unidade.agendamentosHoje),
      icon: Users,
      color: "var(--status-info)",
    },
    {
      label: "Concluídos",
      value: String(unidade.concluidos),
      icon: CheckCircle2,
      color: "var(--primary)",
    },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden"
      // eslint-disable-next-line no-restricted-syntax
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        transition: "border-color 200ms, box-shadow 200ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--border-strong)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--border-default)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between px-4 py-3"
        // eslint-disable-next-line no-restricted-syntax
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            // eslint-disable-next-line no-restricted-syntax
            style={{
              width: 32,
              height: 32,
              background: "rgba(244,180,0,0.08)",
              border: "1px solid rgba(244,180,0,0.15)",
            }}
          >
            <Building2 size={15} color="var(--primary)" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3
              className="font-semibold text-[14px] truncate leading-tight"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {unidade.nome}
            </h3>
            <span
              className="text-[11px]"
              // eslint-disable-next-line no-restricted-syntax
              style={{ color: "var(--text-muted)" }}
            >
              unidade da rede
            </span>
          </div>
        </div>

        {/* Taxa de conclusão */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
          <span
            className="text-[11px] font-bold"
            // eslint-disable-next-line no-restricted-syntax
            style={{ color: taxaColor }}
          >
            {taxaConclusao}%
          </span>
          {/* Progress bar */}
          <div
            className="rounded-full overflow-hidden"
            // eslint-disable-next-line no-restricted-syntax
            style={{
              width: 48,
              height: 3,
              background: "var(--border-strong)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                width: `${taxaConclusao}%`,
                background: taxaColor,
              }}
            />
          </div>
          <span
            className="text-[9px] uppercase tracking-wide"
            // eslint-disable-next-line no-restricted-syntax
            style={{ color: "var(--text-muted)" }}
          >
            conclusão
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="flex flex-col gap-1 px-4 py-3"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                borderRight:
                  idx % 2 === 0 ? "1px solid var(--border-subtle)" : "none",
                borderBottom:
                  idx < 2 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={11} color={m.color} strokeWidth={2} />
                <span
                  className="text-[10px] uppercase tracking-wide font-medium"
                  // eslint-disable-next-line no-restricted-syntax
                  style={{ color: "var(--text-muted)" }}
                >
                  {m.label}
                </span>
              </div>
              <p
                className="font-bold text-[15px] tracking-tight leading-none"
                // eslint-disable-next-line no-restricted-syntax
                style={{
                  color: m.color,
                  fontFamily: "var(--font-heading)",
                }}
              >
                {m.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-end px-4 py-2"
        // eslint-disable-next-line no-restricted-syntax
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <button
          className="flex items-center gap-1 text-[11px] font-medium transition-colors"
          // eslint-disable-next-line no-restricted-syntax
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
          type="button"
        >
          Ver detalhes
          <ArrowRight size={11} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
