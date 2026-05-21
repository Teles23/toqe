"use client";

import { useAdminRevenue } from "../hooks/use-admin-revenue";
import { useAdminMetrics } from "../hooks/use-admin-metrics";

const PLAN_COLORS: Record<string, string> = {
  pro: "#F4B400",
  basic: "#4DA3FF",
  free: "#4A4A4A",
};

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  basic: "Basic",
  free: "Free",
};

export function RevenueView() {
  const { data: revenue, isLoading: loadingRevenue } = useAdminRevenue();
  const { data: metrics, isLoading: loadingMetrics } = useAdminMetrics();

  const maxMrr = Math.max(...(revenue?.historico ?? []).map((m) => m.mrr), 1);

  return (
    <div className="tqe-sa-content">
      <div className="tqe-sa-page-header">
        <h1 className="tqe-sa-page-title">Receita</h1>
        <p className="tqe-sa-page-sub">MRR, ARR e breakdown por plano</p>
      </div>

      {/* KPIs */}
      <div className="tqe-sa-kpi-grid">
        <div className="tqe-sa-kpi-card">
          <div
            className="tqe-sa-kpi-accent"
            style={{ background: "#F4B400" }}
          />
          <div className="tqe-sa-kpi-label">MRR</div>
          <div className="tqe-sa-kpi-value">
            {loadingMetrics
              ? "—"
              : `R$${(metrics?.mrr ?? 0).toLocaleString("pt-BR")}`}
          </div>
          <div className="tqe-sa-kpi-sub" style={{ color: "#1DB954" }}>
            {metrics ? `${metrics.activeTenants} pagantes` : ""}
          </div>
        </div>
        <div className="tqe-sa-kpi-card">
          <div
            className="tqe-sa-kpi-accent"
            style={{ background: "#4DA3FF" }}
          />
          <div className="tqe-sa-kpi-label">ARR projetado</div>
          <div className="tqe-sa-kpi-value">
            {loadingMetrics
              ? "—"
              : `R$${(metrics?.arr ?? 0).toLocaleString("pt-BR")}`}
          </div>
        </div>
        <div className="tqe-sa-kpi-card">
          <div
            className="tqe-sa-kpi-accent"
            style={{ background: "#1DB954" }}
          />
          <div className="tqe-sa-kpi-label">Ticket médio</div>
          <div className="tqe-sa-kpi-value">
            {loadingMetrics || !metrics
              ? "—"
              : metrics.activeTenants > 0
                ? `R$${Math.round((metrics.mrr ?? 0) / metrics.activeTenants)}`
                : "—"}
          </div>
        </div>
        <div className="tqe-sa-kpi-card">
          <div
            className="tqe-sa-kpi-accent"
            style={{ background: "#A78BFA" }}
          />
          <div className="tqe-sa-kpi-label">Planos ativos</div>
          <div className="tqe-sa-kpi-value">
            {loadingMetrics ? "—" : (metrics?.activeTenants ?? 0)}
          </div>
          <div className="tqe-sa-kpi-sub" style={{ color: "#4A4A4A" }}>
            {metrics ? `de ${metrics.totalTenants} barbearias` : ""}
          </div>
        </div>
      </div>

      <div className="tqe-sa-body-grid">
        {/* MRR por mês */}
        <div className="tqe-sa-card tqe-sa-card--span2">
          <div className="tqe-sa-card-title">MRR por mês</div>
          {loadingRevenue ? (
            <div className="tqe-sa-activity-placeholder" />
          ) : (
            <div className="tqe-sa-bar-chart">
              {(revenue?.historico ?? []).map((m) => (
                <div key={m.mes} className="tqe-sa-bar-col">
                  <div className="tqe-sa-bar-value">
                    R${m.mrr.toLocaleString("pt-BR")}
                  </div>
                  <div className="tqe-sa-bar-track">
                    <div
                      className="tqe-sa-bar-fill"
                      style={{
                        height: `${(m.mrr / maxMrr) * 100}%`,
                        background: "#F4B400",
                      }}
                    />
                  </div>
                  <div className="tqe-sa-bar-label">{m.mes}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakdown por plano */}
        <div className="tqe-sa-card tqe-sa-card--span2">
          <div className="tqe-sa-card-title">Breakdown por plano</div>
          <table className="tqe-sa-table">
            <thead>
              <tr>
                <th>Plano</th>
                <th className="tqe-sa-th-mono">Tenants</th>
                <th className="tqe-sa-th-mono">Preço/mês</th>
                <th className="tqe-sa-th-mono">MRR contribuído</th>
                <th className="tqe-sa-th-mono">% do total</th>
              </tr>
            </thead>
            <tbody>
              {loadingRevenue
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr
                      key={i}
                      className="tqe-sa-table-row tqe-sa-table-row--skeleton"
                    >
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j}>
                          <div className="tqe-sa-skeleton" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (revenue?.breakdown ?? []).map((p) => {
                    const totalMrr = (revenue?.breakdown ?? []).reduce(
                      (s, x) => s + x.total,
                      0,
                    );
                    const pct =
                      totalMrr > 0
                        ? ((p.total / totalMrr) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <tr key={p.plano} className="tqe-sa-table-row">
                        <td>
                          <span
                            className="tqe-sa-badge"
                            style={{
                              background: `${PLAN_COLORS[p.plano] ?? "#4A4A4A"}18`,
                              color: PLAN_COLORS[p.plano] ?? "#4A4A4A",
                            }}
                          >
                            {PLAN_LABELS[p.plano] ?? p.plano}
                          </span>
                        </td>
                        <td className="tqe-sa-td-mono">{p.count}</td>
                        <td className="tqe-sa-td-mono">
                          R${p.preco.toLocaleString("pt-BR")}
                        </td>
                        <td className="tqe-sa-td-mono">
                          {p.total > 0 ? (
                            `R$${p.total.toLocaleString("pt-BR")}`
                          ) : (
                            <span style={{ color: "#4A4A4A" }}>—</span>
                          )}
                        </td>
                        <td className="tqe-sa-td-mono">
                          <div className="tqe-sa-pct-cell">
                            <div className="tqe-sa-pct-bar-bg">
                              <div
                                className="tqe-sa-pct-bar-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: PLAN_COLORS[p.plano] ?? "#4A4A4A",
                                }}
                              />
                            </div>
                            <span>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
