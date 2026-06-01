"use client";

import React, { useState, useEffect } from "react";
import { Toggle } from "@/shared/components/toggle";
import { DIAS_SEMANA_CURTO } from "@/shared/lib/constants";
import { useConfiguracaoHorarios } from "../hooks/use-configuracao";
import type { HorarioDia } from "../types/configuracao.types";

interface Props {
  barCodigo: number | null;
}

export function SecaoHorarios({ barCodigo }: Props) {
  const { data, update } = useConfiguracaoHorarios(barCodigo);
  const [horarios, setHorarios] = useState<HorarioDia[]>(data ?? []);

  useEffect(() => {
    if (data) setHorarios(data);
  }, [data]);

  function toggleDia(idx: number) {
    setHorarios((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, aberto: !h.aberto } : h)),
    );
  }

  function setHora(
    idx: number,
    campo: "abertura" | "fechamento",
    valor: string,
  ) {
    setHorarios((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, [campo]: valor } : h)),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-[15px] font-bold mb-1"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          Horários de funcionamento
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Configure os dias e horários que a barbearia funciona.
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border-default)" }}
      >
        {horarios.map((h, i) => (
          <div
            key={h.diaSemana}
            className="flex items-center gap-4 px-4 py-3"
            style={{
              borderBottom:
                i < horarios.length - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
              background: h.aberto ? "transparent" : "rgba(255,255,255,0.01)",
              opacity: h.aberto ? 1 : 0.5,
              transition: "opacity 200ms",
            }}
          >
            <Toggle checked={h.aberto} onChange={() => toggleDia(i)} />

            <span
              className="text-[13px] font-medium flex-shrink-0"
              style={{ width: 80, color: "var(--text-primary)" }}
            >
              {DIAS_SEMANA_CURTO[h.diaSemana]}
            </span>

            {h.aberto ? (
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <input
                  type="time"
                  value={h.abertura}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHora(i, "abertura", e.target.value)
                  }
                  style={{
                    height: 30,
                    padding: "0 8px",
                    minWidth: 110,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "var(--font-body)",
                    outline: "none",
                  }}
                />
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  até
                </span>
                <input
                  type="time"
                  value={h.fechamento}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHora(i, "fechamento", e.target.value)
                  }
                  style={{
                    height: 30,
                    padding: "0 8px",
                    minWidth: 110,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "var(--font-body)",
                    outline: "none",
                  }}
                />
              </div>
            ) : (
              <span
                className="text-[12px] flex-1"
                style={{ color: "var(--text-muted)" }}
              >
                Fechado
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => update.mutate(horarios)}
        disabled={update.isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[13px]"
        style={{
          background: "var(--primary)",
          color: "#0D0D0D",
          opacity: update.isPending ? 0.7 : 1,
        }}
      >
        {update.isPending ? "Salvando…" : "Salvar horários"}
      </button>
    </div>
  );
}
