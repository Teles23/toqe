"use client";

import React from "react";
import { Network, RefreshCw } from "lucide-react";
import { RequireRole } from "@/shared/components/RequireRole";
import { Perfil } from "@/shared/config/roles";
import { useRedeOverview } from "@/features/rede/hooks/use-rede-overview";
import { UnidadeCard } from "@/features/rede/components/UnidadeCard";
import { RedeTotaisBar } from "@/features/rede/components/RedeTotaisBar";

function RedeSkeleton(): React.JSX.Element {
  return (
    <div className="max-w-7xl mx-auto space-y-5 p-1">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div
            className="h-7 w-36 rounded-lg animate-pulse"
            style={{ background: "var(--bg-hover)" }}
          />
          <div
            className="h-4 w-52 rounded animate-pulse"
            style={{ background: "var(--bg-hover)" }}
          />
        </div>
      </div>

      {/* KPI bar skeleton */}
      <div
        className="h-28 rounded-xl animate-pulse"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      />

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-52 rounded-xl animate-pulse"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RedeEmptyState(): React.JSX.Element {
  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 text-center gap-4">
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: 56,
          height: 56,
          background: "var(--bg-hover)",
          border: "1px solid var(--border-default)",
        }}
      >
        <Network size={24} style={{ color: "var(--text-muted)" }} />
      </div>
      <div>
        <p
          className="text-[15px] font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Nenhuma unidade encontrada
        </p>
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Você ainda não é dono de nenhuma barbearia.
        </p>
      </div>
    </div>
  );
}

function RedeContent(): React.JSX.Element {
  const { data, isPending, isError, error, refetch } = useRedeOverview();

  if (isPending) {
    return <RedeSkeleton />;
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex flex-col items-center text-center gap-4 py-20">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 48,
            height: 48,
            background: "rgba(255,77,79,0.08)",
            border: "1px solid rgba(255,77,79,0.2)",
          }}
        >
          <RefreshCw size={20} style={{ color: "var(--status-error)" }} />
        </div>
        <div>
          <p
            className="text-[14px] font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Não foi possível carregar o dashboard da rede
          </p>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            {error instanceof Error ? error.message : "Erro desconhecido"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold"
          style={{ background: "var(--primary)", color: "#0D0D0D" }}
        >
          <RefreshCw size={13} strokeWidth={2.5} />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (data.unidades.length === 0) {
    return <RedeEmptyState />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1
            className="font-bold text-[22px] leading-tight"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.02em",
            }}
          >
            Minha Rede
          </h1>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            {data.unidades.length}{" "}
            {data.unidades.length === 1 ? "barbearia" : "barbearias"} ·
            consolidado de hoje
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--bg-hover)";
            (e.currentTarget as HTMLElement).style.color =
              "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--bg-card)";
            (e.currentTarget as HTMLElement).style.color =
              "var(--text-secondary)";
          }}
        >
          <RefreshCw size={12} strokeWidth={2} />
          Atualizar
        </button>
      </div>

      {/* KPI Bar */}
      <RedeTotaisBar totais={data.totais} qtdUnidades={data.unidades.length} />

      {/* Unidades Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.unidades.map((unidade) => (
          <UnidadeCard key={unidade.barCodigo} unidade={unidade} />
        ))}
      </div>
    </div>
  );
}

export default function RedePage(): React.JSX.Element {
  return (
    <RequireRole roles={[Perfil.DONO]}>
      <RedeContent />
    </RequireRole>
  );
}
