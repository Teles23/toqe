"use client";

import React from "react";
import { RequireRole } from "@/shared/components/RequireRole";
import { Perfil } from "@/shared/config/roles";
import { useRedeOverview } from "@/features/rede/hooks/use-rede-overview";
import { UnidadeCard } from "@/features/rede/components/UnidadeCard";
import { RedeTotaisBar } from "@/features/rede/components/RedeTotaisBar";

function RedeContent(): React.JSX.Element {
  const { data, isPending, isError, error, refetch } = useRedeOverview();

  if (isPending) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <div
          className="h-24 rounded-xl animate-pulse"
          style={{ background: "var(--surface-2)" }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl animate-pulse"
              style={{ background: "var(--surface-1)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center space-y-4">
        <p
          className="text-[14px]"
          style={{ color: "var(--status-error)" }}
        >
          Não foi possível carregar o dashboard da rede
          {error instanceof Error ? `: ${error.message}` : ""}.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg text-[13px] font-medium"
          style={{ background: "var(--primary)", color: "#0D0D0D" }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (data.unidades.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <p
          className="text-[14px]"
          style={{ color: "var(--text-muted)" }}
        >
          Você não é dono de nenhuma barbearia ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[22px] font-bold"
            style={{ color: "var(--text-primary)" }}
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
      </div>

      <RedeTotaisBar
        totais={data.totais}
        qtdUnidades={data.unidades.length}
      />

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
