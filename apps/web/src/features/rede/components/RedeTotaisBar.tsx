"use client";

import React from "react";
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

export function RedeTotaisBar({
  totais,
  qtdUnidades,
}: RedeTotaisBarProps): React.JSX.Element {
  const items = [
    {
      label: "Unidades",
      value: String(qtdUnidades),
      color: "var(--text-primary)",
    },
    {
      label: "Faturamento hoje (rede)",
      value: formatBRL(totais.faturamentoHoje),
      color: "var(--status-success)",
    },
    {
      label: "Faturamento mês (rede)",
      value: formatBRL(totais.faturamentoMes),
      color: "var(--status-success)",
    },
    {
      label: "Agendamentos hoje",
      value: String(totais.agendamentosHoje),
      color: "var(--text-primary)",
    },
    {
      label: "Concluídos",
      value: String(totais.concluidos),
      color: "var(--status-info)",
    },
  ];

  return (
    <div
      className="rounded-xl p-5 grid grid-cols-2 sm:grid-cols-5 gap-4 border"
      // eslint-disable-next-line no-restricted-syntax
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--primary)",
      }}
    >
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <p
            className="text-[11px] uppercase tracking-wide"
            // eslint-disable-next-line no-restricted-syntax
            style={{ color: "var(--text-muted)" }}
          >
            {item.label}
          </p>
          <p
            className="text-[20px] font-bold mt-1"
            // eslint-disable-next-line no-restricted-syntax
            style={{ color: item.color }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
