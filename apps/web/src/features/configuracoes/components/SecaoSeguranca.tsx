/* eslint-disable no-restricted-syntax */
"use client";

import React, { useState } from "react";
import { Smartphone } from "lucide-react";
import { Toggle } from "@/shared/components/toggle";
import { ConfigRow } from "@/shared/components/config-row";
import type { SessaoAtiva } from "../types/configuracao.types";

const SESSOES_MOCK: SessaoAtiva[] = [
  { dispositivo: "Chrome · Salvador, BA", ultimo: "Agora", atual: true },
  { dispositivo: "Safari · iPhone 15", ultimo: "1h atrás", atual: false },
  { dispositivo: "Firefox · São Paulo, SP", ultimo: "3 dias", atual: false },
];

export function SecaoSeguranca() {
  const [senha, setSenha] = useState({ atual: "", nova: "", confirma: "" });
  const [twoFa, setTwoFa] = useState(false);

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
          Segurança
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Gerencie sua senha e as sessões ativas.
        </p>
      </div>

      <div
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
            Alterar senha
          </span>
        </div>
        <div className="px-4 py-4 space-y-3">
          {[
            { label: "Senha atual", key: "atual" as const },
            { label: "Nova senha", key: "nova" as const },
            { label: "Confirmar nova senha", key: "confirma" as const },
          ].map((f) => (
            <div key={f.key}>
              <label className="tqe-label">{f.label}</label>
              <input
                type="password"
                value={senha[f.key]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSenha((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                className="tqe-input"
                placeholder="••••••••"
              />
            </div>
          ))}
          <button
            className="px-4 py-2 rounded-lg text-[12px] font-semibold mt-1"
            style={{ background: "var(--primary)", color: "#0D0D0D" }}
          >
            Alterar senha
          </button>
        </div>
      </div>

      <div
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
            Autenticação
          </span>
        </div>
        <div className="px-4 py-3">
          <ConfigRow
            label="Autenticação de dois fatores"
            desc={
              twoFa
                ? "Ativado — via app autenticador"
                : "Adiciona uma camada extra de segurança"
            }
            noBorder
          >
            <Toggle checked={twoFa} onChange={setTwoFa} />
          </ConfigRow>
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border-default)" }}
      >
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-secondary)",
          }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Sessões ativas
          </span>
          <button
            className="text-[11px] font-medium"
            style={{ color: "var(--status-error)" }}
          >
            Encerrar todas
          </button>
        </div>
        {SESSOES_MOCK.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 gap-3"
            style={{
              borderBottom:
                i < SESSOES_MOCK.length - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  background: s.atual
                    ? "rgba(29,185,84,0.1)"
                    : "var(--bg-hover)",
                  color: s.atual
                    ? "var(--status-success)"
                    : "var(--text-muted)",
                }}
              >
                <Smartphone size={14} />
              </div>
              <div>
                <span
                  className="block text-[12px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.dispositivo}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.atual ? "Esta sessão" : s.ultimo}
                </span>
              </div>
            </div>
            {!s.atual && (
              <button
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                style={{
                  background: "rgba(255,77,79,0.08)",
                  color: "var(--status-error)",
                  border: "1px solid rgba(255,77,79,0.15)",
                }}
              >
                Encerrar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
