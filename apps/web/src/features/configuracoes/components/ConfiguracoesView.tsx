"use client";

import { useState } from "react";
import type { SecaoId } from "../types/configuracao.types";
import { SecaoApiKeys } from "./SecaoApiKeys";

// Placeholder components for other sections — to be filled in as sprints progress
function SecaoPlaceholder({ nome }: { nome: string }) {
  return (
    <div className="p-6">
      <h2 className="text-[15px] font-bold mb-1">{nome}</h2>
      <p className="text-[12px] text-[var(--text-secondary)]">
        Seção em desenvolvimento.
      </p>
    </div>
  );
}

const SECOES: { id: SecaoId; label: string }[] = [
  { id: "barbearia", label: "Barbearia" },
  { id: "horarios", label: "Horários" },
  { id: "notificacoes", label: "Notificações" },
  { id: "qrcode", label: "QR Code" },
  { id: "plano", label: "Plano & Fatura" },
  { id: "seguranca", label: "Segurança" },
  { id: "api-keys", label: "ApiKeys" },
];

interface Props {
  barCodigo: number | null;
  slug: string | null;
}

export function ConfiguracoesView({ barCodigo }: Props) {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoId>("barbearia");

  const conteudo: Record<SecaoId, React.ReactNode> = {
    barbearia: <SecaoPlaceholder nome="Barbearia" />,
    horarios: <SecaoPlaceholder nome="Horários" />,
    notificacoes: <SecaoPlaceholder nome="Notificações" />,
    qrcode: <SecaoPlaceholder nome="QR Code" />,
    plano: <SecaoPlaceholder nome="Plano & Faturamento" />,
    seguranca: <SecaoPlaceholder nome="Segurança" />,
    "api-keys": <SecaoApiKeys barCodigo={barCodigo} />,
  };

  return (
    <div
      className="max-w-5xl mx-auto md:flex rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--border-default)",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      <div
        className="py-4 md:w-[200px] md:flex-shrink-0"
        style={{
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <span
          className="block px-4 pb-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Configurações
        </span>

        {SECOES.map((s) => {
          const ativa = secaoAtiva === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSecaoAtiva(s.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 relative"
              style={{
                background: ativa ? "var(--bg-card)" : "transparent",
                borderLeft: `2px solid ${ativa ? "var(--primary)" : "transparent"}`,
                color: ativa ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <span className="text-[13px] font-medium flex-1 text-left">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-card)" }}>
        <div className="p-6">{conteudo[secaoAtiva]}</div>
      </div>
    </div>
  );
}
