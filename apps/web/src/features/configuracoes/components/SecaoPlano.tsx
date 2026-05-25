"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Plano } from "../types/configuracao.types";
import {
  useConfiguracaoPlano,
  useCheckout,
} from "../hooks/use-configuracao-plano";

const PLANOS_BASE: Omit<Plano, "atual">[] = [
  {
    id: "basic",
    nome: "Basic",
    preco: 49,
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
    features: [
      "Múltiplas unidades",
      "Barbeiros ilimitados",
      "White-label",
      "API pública",
      "Gerente de conta dedicado",
    ],
  },
];

interface Props {
  barCodigo: number | null;
}

export function SecaoPlano({ barCodigo }: Props) {
  const { data, isLoading: isLoadingPlano } = useConfiguracaoPlano(barCodigo);
  const checkout = useCheckout(barCodigo);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const planoAtual = data?.plano ?? "free";
  const planoStatus = data?.planoStatus ?? null;
  const trialFim = data?.trialFim ?? null;

  const planos: Plano[] = PLANOS_BASE.map((p) => ({
    ...p,
    atual: p.id === planoAtual,
  }));

  const diasRestantesTrial = trialFim
    ? Math.max(
        0,
        Math.ceil(
          (new Date(trialFim).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  async function handleUpgrade(plano: string) {
    if (!barCodigo) return;
    setUpgradingPlan(plano);
    try {
      const result = await checkout.mutateAsync(plano);
      window.open(result.url, "_blank");
    } catch {
      toast.error("Não foi possível gerar o link de pagamento. Tente novamente.");
    } finally {
      setUpgradingPlan(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-bold mb-1 font-heading text-[var(--text-primary)]">
          Plano & Faturamento
        </h2>
        <p className="text-[12px] text-[var(--text-secondary)]">
          Gerencie sua assinatura e dados de pagamento.
        </p>
      </div>

      {/* Trial banner */}
      {planoStatus === "trial" && diasRestantesTrial !== null && (
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: "rgba(244,180,0,0.08)",
            border: "1px solid rgba(244,180,0,0.3)",
          }}
        >
          <AlertTriangle
            size={15}
            style={{ color: "var(--primary)", flexShrink: 0 }}
          />
          <span className="text-[12px] text-[var(--text-primary)]">
            Seu período de trial termina em{" "}
            <strong>
              {diasRestantesTrial === 0
                ? "hoje"
                : `${diasRestantesTrial} dia${diasRestantesTrial !== 1 ? "s" : ""}`}
            </strong>
            . Faça upgrade para continuar usando o Toqe.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {isLoadingPlano
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4 animate-pulse"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  height: 240,
                }}
              />
            ))
          : planos.map((p) => (
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

                <span className="block font-bold text-[16px] mb-0.5 font-heading text-[var(--text-primary)]">
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
                  <span className="text-[11px] text-[var(--text-muted)]">
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
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {!p.atual && (
                  <button
                    onClick={() => void handleUpgrade(p.id)}
                    disabled={upgradingPlan === p.id}
                    className="w-full py-2 rounded-lg text-[12px] font-semibold transition-all border border-[var(--border-strong)] text-[var(--text-secondary)] flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {upgradingPlan === p.id && <Loader2 size={11} className="animate-spin" />}
                    {p.preco > 99 ? "Falar com vendas" : "Fazer upgrade"}
                  </button>
                )}
              </motion.div>
            ))}
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
        <div>
          <span className="block text-[13px] font-medium text-[var(--text-primary)]">
            Próxima fatura
          </span>
          <span className="text-[12px] text-[var(--text-secondary)]">
            {data?.planoValidoAte
              ? `Vence em ${new Date(data.planoValidoAte).toLocaleDateString("pt-BR")}`
              : "—"}
          </span>
        </div>
        <button className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-secondary)]">
          Gerenciar
        </button>
      </div>
    </div>
  );
}
