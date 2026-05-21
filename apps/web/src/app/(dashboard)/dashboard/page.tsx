"use client";

import React from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { RequireRole } from "@/shared/components/RequireRole";
import { Perfil } from "@/shared/config/roles";
import { useDashboardOverview } from "@/features/dashboard/hooks/use-dashboard-overview";
import { MetricsGrid } from "@/features/dashboard/components/MetricsGrid";
import { LiveStatusCard } from "@/features/dashboard/components/LiveStatusCard";
import { FaturamentoChart } from "@/features/dashboard/components/FaturamentoChart";
import { AtividadeFeed } from "@/features/dashboard/components/AtividadeFeed";
import { ServicosPopulares } from "@/features/dashboard/components/ServicosPopulares";
import { AcoesRapidas } from "@/features/dashboard/components/AcoesRapidas";
import { DashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";

/**
 * Página do Dashboard.
 *
 * Composição das seções da feature `dashboard`. Dados via
 * `useDashboardOverview` (TanStack Query). Estados de loading e erro
 * tratados aqui — cada seção recebe apenas os dados que precisa.
 *
 * Antes desta refatoração (sub-PR 3e), este arquivo tinha 824 linhas
 * com 6 seções inline e arrays mockados; agora é um shell de ~60
 * linhas.
 */
function DashboardContent(): React.JSX.Element {
  const { barbearia } = useAuth();
  const { data, isPending, isError, error, refetch } = useDashboardOverview(
    barbearia?.codigo ?? null,
  );

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center space-y-4">
        <p className="text-[14px]" style={{ color: "var(--status-error)" }}>
          Não foi possível carregar o dashboard
          {error instanceof Error ? `: ${error.message}` : ""}.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg text-[13px] font-medium"
          style={{
            background: "var(--primary)",
            color: "#0D0D0D",
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <MetricsGrid kpis={data.kpis} />
      <LiveStatusCard
        liveMetrics={data.liveMetrics}
        barbeiros={data.barbeiros}
      />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <FaturamentoChart
          semana={data.faturamento.semana}
          mes={data.faturamento.mes}
        />
        <AtividadeFeed items={data.atividade} />
      </div>
      <ServicosPopulares servicos={data.servicos} />
      <AcoesRapidas />
    </div>
  );
}

export default function DashboardPage(): React.JSX.Element {
  return (
    <RequireRole
      roles={[
        Perfil.DONO,
        Perfil.GERENTE,
        Perfil.BARBEIRO,
        Perfil.RECEPCIONISTA,
      ]}
    >
      <DashboardContent />
    </RequireRole>
  );
}
