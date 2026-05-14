/* eslint-disable no-restricted-syntax */
"use client";

import { useState, useEffect } from "react";
import { Toggle } from "@/shared/components/toggle";
import { GRUPOS_NOTIFICACAO } from "../constants/configuracao.constants";
import { useConfiguracaoNotificacoes } from "../hooks/use-configuracao";
import type { NotificacaoConfig } from "../types/configuracao.types";

interface Props {
  barCodigo: number | null;
}

export function SecaoNotificacoes({ barCodigo }: Props) {
  const { data, update } = useConfiguracaoNotificacoes(barCodigo);
  const [configs, setConfigs] = useState<NotificacaoConfig>(
    data ?? {
      novoAgendamento: true,
      cancelamento: true,
      lembreteCliente: true,
      lembreteInternos: false,
      relatorioDiario: true,
      clienteNovo: true,
      avaliacaoRecebida: false,
      pagamentoRecebido: true,
    },
  );

  useEffect(() => {
    if (data) setConfigs(data);
  }, [data]);

  function toggle(key: keyof NotificacaoConfig) {
    const next = { ...configs, [key]: !configs[key] };
    setConfigs(next);
    update.mutate({ [key]: next[key] });
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
          Notificações
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Controle quais eventos geram alertas para você e sua equipe.
        </p>
      </div>

      {GRUPOS_NOTIFICACAO.map((grupo) => (
        <div
          key={grupo.titulo}
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border-default)" }}
        >
          <div
            className="px-4 py-2.5"
            style={{
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-secondary)",
            }}
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {grupo.titulo}
            </span>
          </div>
          {grupo.items.map((item, i) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-4 py-3.5 gap-4"
              style={{
                borderBottom:
                  i < grupo.items.length - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
              }}
            >
              <div>
                <span
                  className="block text-[13px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.label}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.desc}
                </span>
              </div>
              <Toggle
                checked={configs[item.key]}
                onChange={() => toggle(item.key)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
