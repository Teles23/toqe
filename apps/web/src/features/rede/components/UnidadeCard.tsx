"use client";

import React from "react";
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

  return (
    <div
      className="rounded-xl p-5 space-y-4 border"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between">
        <h3
          className="font-semibold text-[15px] truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {unidade.nome}
        </h3>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
          style={{
            background: "var(--primary-subtle)",
            color: "var(--primary)",
          }}
        >
          {taxaConclusao}% conclusão
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p
            className="text-[11px] uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Faturamento hoje
          </p>
          <p
            className="text-[18px] font-bold mt-0.5"
            style={{ color: "var(--status-success)" }}
          >
            {formatBRL(unidade.faturamentoHoje)}
          </p>
        </div>
        <div>
          <p
            className="text-[11px] uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Faturamento mês
          </p>
          <p
            className="text-[18px] font-bold mt-0.5"
            style={{ color: "var(--text-primary)" }}
          >
            {formatBRL(unidade.faturamentoMes)}
          </p>
        </div>
        <div>
          <p
            className="text-[11px] uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Agendamentos hoje
          </p>
          <p
            className="text-[18px] font-bold mt-0.5"
            style={{ color: "var(--text-primary)" }}
          >
            {unidade.agendamentosHoje}
          </p>
        </div>
        <div>
          <p
            className="text-[11px] uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Concluídos
          </p>
          <p
            className="text-[18px] font-bold mt-0.5"
            style={{ color: "var(--status-info)" }}
          >
            {unidade.concluidos}
          </p>
        </div>
      </div>
    </div>
  );
}
