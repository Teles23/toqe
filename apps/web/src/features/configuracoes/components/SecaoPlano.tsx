/* eslint-disable no-restricted-syntax */
"use client";

import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import type { Plano } from "../types/configuracao.types";

const PLANOS: Plano[] = [
  {
    id: "basic",
    nome: "Basic",
    preco: 49,
    atual: false,
    features: [
      "1 barbearia",
      "Até 2 barbeiros",
      "50 agend./mês",
      "Suporte por e-mail",
    ],
  },
  {
    id: "pro",
    nome: "Pro",
    preco: 99,
    atual: true,
    features: [
      "1 barbearia",
      "Até 10 barbeiros",
      "Agendamentos ilimitados",
      "WhatsApp + SMS",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
  {
    id: "enterprise",
    nome: "Enterprise",
    preco: 249,
    atual: false,
    features: [
      "Múltiplas unidades",
      "Barbeiros ilimitados",
      "White-label",
      "API pública",
      "Gerente de conta dedicado",
    ],
  },
];

export function SecaoPlano() {
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
          Plano & Faturamento
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Gerencie sua assinatura e dados de pagamento.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANOS.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ y: -2 }}
            className="rounded-xl p-4 relative overflow-hidden cursor-pointer"
            style={{
              background: p.atual
                ? "rgba(244,180,0,0.04)"
                : "var(--bg-secondary)",
              border: `1px solid ${p.atual ? "rgba(244,180,0,0.3)" : "var(--border-default)"}`,
              boxShadow: p.atual ? "0 0 20px rgba(244,180,0,0.08)" : "none",
              transition: "all 180ms",
            }}
          >
            <div
              className="absolute top-0 left-3 right-3 rounded-b"
              style={{
                height: 2,
                background: p.atual
                  ? "var(--primary)"
                  : "var(--border-default)",
                opacity: p.atual ? 0.8 : 0.3,
              }}
            />

            {p.atual && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-3"
                style={{
                  background: "rgba(244,180,0,0.15)",
                  color: "var(--primary)",
                }}
              >
                <Zap size={9} /> Plano atual
              </span>
            )}

            <span
              className="block font-bold text-[16px] mb-0.5"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
              }}
            >
              {p.nome}
            </span>
            <div className="flex items-baseline gap-1 mb-4">
              <span
                className="font-bold text-[22px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: p.atual ? "var(--primary)" : "var(--text-primary)",
                  letterSpacing: "-0.04em",
                }}
              >
                R${p.preco}
              </span>
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                /mês
              </span>
            </div>

            <ul className="space-y-1.5 mb-4">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check
                    size={11}
                    style={{
                      color: p.atual
                        ? "var(--primary)"
                        : "var(--status-success)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            {!p.atual && (
              <button
                className="w-full py-2 rounded-lg text-[12px] font-semibold transition-all"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-secondary)",
                }}
              >
                {p.preco > 99 ? "Falar com vendas" : "Fazer upgrade"}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div>
          <span
            className="block text-[13px] font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Próxima fatura
          </span>
          <span
            className="text-[12px]"
            style={{ color: "var(--text-secondary)" }}
          >
            R$ 99,00 em 01/06/2025 · Cartão ···· 4242
          </span>
        </div>
        <button
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg"
          style={{
            background: "transparent",
            border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)",
          }}
        >
          Gerenciar
        </button>
      </div>
    </div>
  );
}
