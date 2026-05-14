/* eslint-disable no-restricted-syntax */
"use client";

import { Clock, Calendar, Phone } from "lucide-react";
import { DetailPanel } from "@/shared/components/detail-panel";
import { DetailMetricGrid } from "@/shared/components/detail-metric-grid";
import { ESTADO_CONFIG } from "../constants/barbeiro.constants";
import type { Barbeiro } from "../types/barbeiro.types";
import { DIAS_SEMANA_CURTO } from "@/shared/lib/constants";
import { formatBRL } from "@/shared/lib/utils";

const DIAS_SEMANA = DIAS_SEMANA_CURTO;

export function BarbeiroDetalhe({
  b,
  onClose,
}: {
  b: Barbeiro;
  onClose: () => void;
}) {
  const cfg = ESTADO_CONFIG[b.estado];

  const metrics = [
    { label: "Hoje", value: `${b.atendimentosHoje}`, suffix: "atend." },
    { label: "Este mês", value: `${b.atendimentosMes}`, suffix: "atend." },
    {
      label: "Fat. mensal",
      value: `${formatBRL(b.faturamentoMes / 1000)}k`,
    },
    { label: "Ticket médio", value: formatBRL(Math.round(b.ticketMedio)) },
  ];

  const footer = (
    <>
      <button
        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold"
        style={{ background: "var(--primary)", color: "#0D0D0D" }}
      >
        <Calendar size={13} /> Ver agenda
      </button>
      <button
        className="px-3 flex items-center justify-center rounded-lg text-[12px]"
        style={{
          background: "transparent",
          border: "1px solid var(--border-strong)",
          color: "var(--text-secondary)",
        }}
      >
        Editar
      </button>
    </>
  );

  return (
    <DetailPanel
      title="Perfil do barbeiro"
      width={300}
      onClose={onClose}
      footer={footer}
    >
      {/* Avatar + status */}
      <div
        className="px-4 py-5 text-center"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="relative inline-block mb-3">
          <div
            className="flex items-center justify-center rounded-full font-bold text-xl"
            style={{
              width: 56,
              height: 56,
              background: `${cfg.color}15`,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              fontFamily: "var(--font-heading)",
            }}
          >
            {b.initial}
          </div>
          <span
            className="absolute bottom-0.5 right-0.5 rounded-full"
            style={{
              width: 11,
              height: 11,
              background: cfg.color,
              border: "2px solid var(--bg-card)",
              animation:
                b.estado === "active"
                  ? "tqe-pulse-green 2s ease-in-out infinite"
                  : "none",
            }}
          />
        </div>
        <span
          className="block font-bold text-[15px] mb-0.5"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          {b.nome}
        </span>
        {b.especialidade && (
          <span
            className="block text-[11px] mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {b.especialidade}
          </span>
        )}
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: `${cfg.color}12`,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
          }}
        >
          <span
            className="rounded-full"
            style={{
              width: 5,
              height: 5,
              background: cfg.color,
              animation:
                b.estado === "active"
                  ? "tqe-pulse-green 1.5s ease-in-out infinite"
                  : "none",
            }}
          />
          {cfg.label}
        </span>
      </div>

      <DetailMetricGrid metrics={metrics} />

      {/* Escala */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="block text-[10px] uppercase tracking-wider mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          Escala
        </span>
        <div className="flex items-center gap-2 mb-2">
          <Clock size={12} style={{ color: "var(--text-muted)" }} />
          <span
            className="text-[12px]"
            style={{ color: "var(--text-primary)" }}
          >
            Entrada às {b.horarioEntrada}
          </span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {DIAS_SEMANA.map((d) => (
            <span
              key={d}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                background: b.diasSemana.includes(d)
                  ? "rgba(29,185,84,0.1)"
                  : "var(--bg-hover)",
                color: b.diasSemana.includes(d)
                  ? "var(--status-success)"
                  : "var(--text-muted)",
              }}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Contato */}
      {b.telefone && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Phone size={12} style={{ color: "var(--text-muted)" }} />
            <span
              className="text-[12px]"
              style={{ color: "var(--text-primary)" }}
            >
              {b.telefone}
            </span>
          </div>
        </div>
      )}
    </DetailPanel>
  );
}
