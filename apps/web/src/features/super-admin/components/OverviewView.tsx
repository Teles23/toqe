"use client";

import { useAdminMetrics, useAdminActivity } from "../hooks/use-admin-metrics";
import { useAdminTenants } from "../hooks/use-admin-tenants";

const PLAN_COLORS: Record<string, string> = {
  pro: "#F4B400",
  basic: "#4DA3FF",
  free: "#4A4A4A",
  trial: "#A78BFA",
};

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  basic: "Basic",
  free: "Free",
  trial: "Trial",
};

const ACTIVITY_COLORS: Record<string, string> = {
  signup: "#1DB954",
  upgrade: "#F4B400",
  churn: "#FF4D4F",
  payment: "#1DB954",
  alert: "#FF4D4F",
};

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subPositive?: boolean;
  accentColor?: string;
}

function KpiCard({
  label,
  value,
  sub,
  subPositive,
  accentColor = "#F4B400",
}: KpiCardProps) {
  return (
    <div className="tqe-sa-kpi-card">
      <div className="tqe-sa-kpi-accent" style={{ background: accentColor }} />
      <div className="tqe-sa-kpi-label">{label}</div>
      <div className="tqe-sa-kpi-value">{value}</div>
      {sub && (
        <div
          className="tqe-sa-kpi-sub"
          style={{
            color:
              subPositive !== undefined
                ? subPositive
                  ? "#1DB954"
                  : "#FF4D4F"
                : undefined,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function OverviewView() {
  const { data: metrics, isLoading: loadingMetrics } = useAdminMetrics();
  const { data: activity, isLoading: loadingActivity } = useAdminActivity();
  const { data: tenants } = useAdminTenants();

  const planCounts = (tenants ?? []).reduce<Record<string, number>>(
    (acc, t) => {
      acc[t.plano] = (acc[t.plano] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const topTenants = [...(tenants ?? [])]
    .sort((a, b) => b.mrr - a.mrr)
    .slice(0, 5);

  return (
    <div className="tqe-sa-content">
      <div className="tqe-sa-page-header">
        <h1 className="tqe-sa-page-title">Visão Geral</h1>
        <p className="tqe-sa-page-sub">dados ao vivo da plataforma</p>
      </div>

      {/* KPIs */}
      <div className="tqe-sa-kpi-grid">
        <KpiCard
          label="MRR"
          value={
            loadingMetrics
              ? "—"
              : `R$${(metrics?.mrr ?? 0).toLocaleString("pt-BR")}`
          }
          sub={metrics ? `${metrics.activeTenants} ativos` : undefined}
          subPositive
          accentColor="#F4B400"
        />
        <KpiCard
          label="ARR projetado"
          value={
            loadingMetrics
              ? "—"
              : `R$${(metrics?.arr ?? 0).toLocaleString("pt-BR")}`
          }
          accentColor="#4DA3FF"
        />
        <KpiCard
          label="Barbearias"
          value={loadingMetrics ? "—" : (metrics?.totalTenants ?? 0)}
          sub={metrics ? `${metrics.activeTenants} ativas hoje` : undefined}
          subPositive
          accentColor="#1DB954"
        />
        <KpiCard
          label="Atend./mês"
          value={
            loadingMetrics
              ? "—"
              : (metrics?.totalAgdMes ?? 0).toLocaleString("pt-BR")
          }
          sub={metrics ? `${metrics.totalBarbeiros} barbeiros` : undefined}
          accentColor="#A78BFA"
        />
      </div>

      {/* Body grid */}
      <div className="tqe-sa-body-grid">
        {/* Por plano */}
        <div className="tqe-sa-card">
          <div className="tqe-sa-card-title">Por plano</div>
          {["pro", "basic", "free"].map((p) => {
            const count = planCounts[p] ?? 0;
            const total = tenants?.length ?? 1;
            return (
              <div key={p} className="tqe-sa-plan-row">
                <div className="tqe-sa-plan-row-header">
                  <span
                    style={{ color: "#CCC", fontWeight: 500, fontSize: 12 }}
                  >
                    {PLAN_LABELS[p]}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#4A4A4A",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {count} barbearias
                  </span>
                </div>
                <div className="tqe-sa-plan-bar-bg">
                  <div
                    className="tqe-sa-plan-bar-fill"
                    style={{
                      width: `${(count / total) * 100}%`,
                      background: PLAN_COLORS[p],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Atividade global */}
        <div className="tqe-sa-card tqe-sa-card--no-pad">
          <div className="tqe-sa-card-header">
            <span className="tqe-sa-card-title" style={{ margin: 0 }}>
              Atividade global
            </span>
            <span className="tqe-sa-live-badge">LIVE</span>
          </div>
          <div>
            {loadingActivity ? (
              <div className="tqe-sa-activity-placeholder" />
            ) : (
              (activity ?? []).map((a, i) => (
                <div key={i} className="tqe-sa-activity-row">
                  <span
                    className="tqe-sa-activity-dot"
                    style={{ background: ACTIVITY_COLORS[a.tipo] ?? "#888" }}
                  />
                  <div>
                    <div className="tqe-sa-activity-text">{a.texto}</div>
                    <div className="tqe-sa-activity-time">{a.tempo}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top barbearias */}
        <div className="tqe-sa-card tqe-sa-card--no-pad tqe-sa-card--span2">
          <div className="tqe-sa-card-header">
            <span className="tqe-sa-card-title" style={{ margin: 0 }}>
              Top barbearias por MRR
            </span>
          </div>
          {topTenants.map((t, i) => (
            <div key={t.codigo} className="tqe-sa-top-tenant-row">
              <span
                className="tqe-sa-top-rank"
                style={{ color: i === 0 ? "#F4B400" : "#4A4A4A" }}
              >
                #{i + 1}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.nome}</div>
                <div style={{ fontSize: 10, color: "#4A4A4A", marginTop: 1 }}>
                  {t.slug}
                </div>
              </div>
              <span
                className="tqe-sa-badge"
                style={{
                  background: `${PLAN_COLORS[t.plano]}18`,
                  color: PLAN_COLORS[t.plano],
                }}
              >
                {PLAN_LABELS[t.plano]}
              </span>
              <span className="tqe-sa-mrr-value">
                {t.mrr > 0 ? `R$${t.mrr}/mês` : "—"}
              </span>
              <span className="tqe-sa-appts-value">{t.totalAgdMes} agend.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
