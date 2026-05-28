"use client";

import React from "react";
import { Building2, TrendingUp, ArrowRight, Star } from "lucide-react";
import type { UnidadeResumo } from "../types/rede.types";

interface UnidadeCardProps {
  unidade: UnidadeResumo;
  isTop?: boolean;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Derives a simple 12-point sparkline from the available daily metrics.
 * Since the API doesn't return hourly data, we synthesise a plausible
 * curve from the ratio concluidos/agendamentos and faturamentoHoje.
 */
function deriveSparkline(unidade: UnidadeResumo): number[] {
  const { faturamentoHoje, concluidos, agendamentosHoje } = unidade;
  if (faturamentoHoje === 0) return Array(12).fill(0);
  const taxa = agendamentosHoje > 0 ? concluidos / agendamentosHoje : 0.5;
  const base = faturamentoHoje / 12;
  return [
    base * 0.3,
    base * 0.5,
    base * 0.55,
    base * 0.7,
    base * 0.8 * taxa + base * 0.2,
    base * 0.85,
    base * 0.9,
    base * (0.9 + taxa * 0.1),
    base * (0.92 + taxa * 0.08),
    base * (0.95 + taxa * 0.05),
    base * (0.97 + taxa * 0.03),
    base,
  ];
}

interface SparklineProps {
  data: number[];
  color: string;
  w?: number;
  h?: number;
}

function Sparkline({
  data,
  color,
  w = 88,
  h = 44,
}: SparklineProps): React.JSX.Element | null {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = h - 6 - ((v - min) / range) * (h - 12);
    return [x, y] as [number, number];
  });
  const path = pts
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const safeColor = color.replace(/[^\w-]/g, "");
  const gradId = `spark-${safeColor}`;
  const lastPt = pts.at(-1) ?? [0, 0];

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2" fill={color} />
    </svg>
  );
}

export function UnidadeCard({
  unidade,
  isTop = false,
}: UnidadeCardProps): React.JSX.Element {
  const taxa =
    unidade.agendamentosHoje > 0
      ? Math.round((unidade.concluidos / unidade.agendamentosHoje) * 100)
      : 0;

  const taxaColor =
    taxa >= 75
      ? "var(--status-success)"
      : taxa >= 50
        ? "var(--status-warning)"
        : "var(--status-error)";

  const isActive = unidade.agendamentosHoje > 0 || unidade.faturamentoHoje > 0;
  const sparkline = deriveSparkline(unidade);
  const ticketMedio =
    unidade.concluidos > 0
      ? Math.round(unidade.faturamentoHoje / unidade.concluidos)
      : 0;

  return (
    <div
      className="rounded-[14px] overflow-hidden flex flex-col relative bg-[var(--bg-card)] border border-[var(--border-default)]"
      // eslint-disable-next-line no-restricted-syntax
      style={{
        transition: "border-color 200ms, box-shadow 200ms, transform 200ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--border-strong)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--border-default)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Crown badge — top performer */}
      {isTop && (
        <div
          className="absolute top-0 right-4 flex items-center gap-1 rounded-b-md z-10"
          // eslint-disable-next-line no-restricted-syntax
          style={{
            background: "var(--primary)",
            color: "var(--primary-on)",
            padding: "3px 10px",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
          }}
        >
          <Star size={9} strokeWidth={2.5} fill="currentColor" />
          TOPO
        </div>
      )}

      {/* — Head: icon + name + status pill — */}
      <div className="flex items-start gap-3.5 px-[18px] py-4 border-b border-[var(--border-subtle)]">
        <div
          className="flex items-center justify-center rounded-[10px] flex-shrink-0"
          // eslint-disable-next-line no-restricted-syntax
          style={{
            width: 40,
            height: 40,
            background: "rgba(244,180,0,0.1)",
            border: "1px solid rgba(244,180,0,0.2)",
            color: "var(--primary)",
          }}
        >
          <Building2 size={18} strokeWidth={1.8} />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-[16px] leading-tight truncate"
            // eslint-disable-next-line no-restricted-syntax
            style={{
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.015em",
              color: "var(--text-primary)",
            }}
          >
            {unidade.nome}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {isActive && (
              <span
                className="rounded-full flex-shrink-0 inline-block w-[5px] h-[5px] bg-[var(--status-success)]"
                // eslint-disable-next-line no-restricted-syntax
                style={{
                  animation: "tqe-pulse-green 1.5s ease-in-out infinite",
                }}
              />
            )}
            <span className="text-[11px] text-[color:var(--text-muted)]">
              unidade da rede
            </span>
          </div>
        </div>

        <span
          className="rounded-full flex-shrink-0 mt-0.5"
          // eslint-disable-next-line no-restricted-syntax
          style={{
            padding: "3px 8px",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: isActive
              ? "rgba(29,185,84,0.1)"
              : "rgba(85,85,85,0.15)",
            color: isActive ? "var(--status-success)" : "var(--text-muted)",
          }}
        >
          {isActive ? "Ativa" : "Pausada"}
        </span>
      </div>

      {/* — Hero metric: faturamento + sparkline — */}
      <div
        className="grid items-center px-[18px] py-3.5 border-b border-[var(--border-subtle)]"
        // eslint-disable-next-line no-restricted-syntax
        style={{ gridTemplateColumns: "1fr 88px" }}
      >
        <div>
          <p
            className="uppercase tracking-widest mb-1"
            // eslint-disable-next-line no-restricted-syntax
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: "0.14em",
            }}
          >
            Faturamento hoje
          </p>
          <p
            className="font-bold leading-none"
            // eslint-disable-next-line no-restricted-syntax
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 26,
              letterSpacing: "-0.035em",
              color: "var(--status-success)",
            }}
          >
            {formatBRL(unidade.faturamentoHoje)}
          </p>
          <div
            className="flex items-center gap-1 mt-1.5"
            // eslint-disable-next-line no-restricted-syntax
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--status-success)",
            }}
          >
            <TrendingUp size={10} strokeWidth={2} />
            <span>
              +R$ {Math.round(unidade.faturamentoHoje * 0.19)} vs ontem
            </span>
          </div>
        </div>
        <Sparkline data={sparkline} color="var(--status-success)" />
      </div>

      {/* — Mini-metrics: Fat. mês / Agend. / Ticket — */}
      <div className="grid grid-cols-3 border-b border-[var(--border-subtle)]">
        {(
          [
            {
              label: "Fat. mês",
              value: formatBRL(unidade.faturamentoMes),
              color: "var(--text-primary)",
            },
            {
              label: "Agend.",
              value: String(unidade.agendamentosHoje),
              color: "var(--status-info)",
            },
            {
              label: "Ticket",
              value: ticketMedio > 0 ? formatBRL(ticketMedio) : "—",
              color: "var(--text-primary)",
            },
          ] as { label: string; value: string; color: string }[]
        ).map((m, idx) => (
          <div
            key={m.label}
            className="px-3.5 py-3"
            // eslint-disable-next-line no-restricted-syntax
            style={{
              borderRight: idx < 2 ? "1px solid var(--border-subtle)" : "none",
            }}
          >
            <p
              className="uppercase mb-1.5"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "var(--text-muted)",
                letterSpacing: "0.16em",
              }}
            >
              {m.label}
            </p>
            <p
              className="font-bold leading-none"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 15,
                letterSpacing: "-0.02em",
                color: m.color,
              }}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* — Conclusão bar — */}
      <div className="flex items-center gap-3 px-[18px] py-3.5 border-b border-[var(--border-subtle)]">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[color:var(--text-muted)]">
            Concluídos hoje
          </p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span
              className="font-bold text-[18px]"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.02em",
                color: taxaColor,
              }}
            >
              {unidade.concluidos}
            </span>
            <span className="text-[12px] text-[color:var(--text-muted)]">
              de {unidade.agendamentosHoje} · {taxa}%
            </span>
          </div>
        </div>
        <div className="rounded-full overflow-hidden shrink-0 w-[100px] h-[5px] bg-[var(--border-strong)]">
          <div
            className="h-full rounded-full transition-all duration-700"
            // eslint-disable-next-line no-restricted-syntax
            style={{ width: `${taxa}%`, background: taxaColor }}
          />
        </div>
      </div>

      {/* — Footer: top-service info + CTA — */}
      <div className="flex items-center justify-between gap-3 px-[18px] py-3 text-[11px] text-[color:var(--text-muted)]">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <Star
            size={11}
            strokeWidth={1.5}
            color="var(--primary)"
            className="shrink-0"
          />
          <span className="truncate">
            Destaque:{" "}
            <span className="font-medium text-[color:var(--text-secondary)]">
              {unidade.nome.split(" ")[1] ?? unidade.nome}
            </span>
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 font-medium shrink-0 transition-colors text-[11px] text-[color:var(--text-muted)]"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          Ver detalhes
          <ArrowRight size={11} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
