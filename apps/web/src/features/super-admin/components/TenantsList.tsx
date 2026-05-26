"use client";

import { useState } from "react";
import { useAdminTenants } from "../hooks/use-admin-tenants";
import { TenantDrawer } from "./TenantDrawer";
import type { AdminTenant } from "../types";

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

const STATUS_COLORS: Record<string, string> = {
  ativo: "#1DB954",
  inativo: "#FF4D4F",
  suspenso: "#FF4D4F",
};

const STATUS_LABELS: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  suspenso: "Suspenso",
};

export function TenantsList() {
  const [search, setSearch] = useState("");
  const [planoFilter, setPlanoFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [selectedTenant, setSelectedTenant] = useState<AdminTenant | null>(
    null,
  );

  const { data: tenants, isLoading } = useAdminTenants({
    search: search || undefined,
    plano: planoFilter,
    status: statusFilter,
  });

  return (
    <div className="tqe-sa-content">
      <div className="tqe-sa-page-header">
        <h1 className="tqe-sa-page-title">Barbearias</h1>
        <p className="tqe-sa-page-sub">todos os tenants da plataforma</p>
      </div>

      {/* Filters */}
      <div className="tqe-sa-filters-bar">
        <input
          className="tqe-sa-search-input"
          placeholder="Buscar barbearia ou slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="tqe-sa-filter-group">
          {[undefined, "free", "basic", "pro"].map((p) => (
            <button
              key={p ?? "all"}
              onClick={() => setPlanoFilter(p)}
              className={`tqe-sa-filter-btn${planoFilter === p ? " tqe-sa-filter-btn--active" : ""}`}
              style={
                planoFilter === p && p
                  ? {
                      background: `${PLAN_COLORS[p]}18`,
                      borderColor: `${PLAN_COLORS[p]}50`,
                      color: PLAN_COLORS[p],
                    }
                  : {}
              }
            >
              {p ? PLAN_LABELS[p] : "Todos"}
            </button>
          ))}
        </div>

        <div className="tqe-sa-filter-group">
          {[undefined, "ativo", "inativo", "suspenso"].map((s) => (
            <button
              key={s ?? "all"}
              onClick={() => setStatusFilter(s)}
              className={`tqe-sa-filter-btn${statusFilter === s ? " tqe-sa-filter-btn--active" : ""}`}
              style={
                statusFilter === s && s
                  ? {
                      background: `${STATUS_COLORS[s]}18`,
                      borderColor: `${STATUS_COLORS[s]}40`,
                      color: STATUS_COLORS[s],
                    }
                  : {}
              }
            >
              {s ? STATUS_LABELS[s] : "Todos status"}
            </button>
          ))}
        </div>

        <span className="tqe-sa-result-count">
          {isLoading
            ? "—"
            : `${tenants?.length ?? 0} resultado${tenants?.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Table */}
      <div className="tqe-sa-table-wrapper">
        <table className="tqe-sa-table">
          <thead>
            <tr>
              <th>Barbearia</th>
              <th>Cidade</th>
              <th>Plano</th>
              <th className="tqe-sa-th-mono">MRR</th>
              <th className="tqe-sa-th-mono">Barbeiros</th>
              <th className="tqe-sa-th-mono">Agend./mês</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr
                  key={i}
                  className="tqe-sa-table-row tqe-sa-table-row--skeleton"
                >
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}>
                      <div className="tqe-sa-skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (tenants ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="tqe-sa-table-empty">
                  Nenhuma barbearia encontrada
                </td>
              </tr>
            ) : (
              (tenants ?? []).map((t) => (
                <tr
                  key={t.codigo}
                  className="tqe-sa-table-row tqe-sa-table-row--clickable"
                  onClick={() => setSelectedTenant(t)}
                >
                  <td>
                    <div className="tqe-sa-tenant-cell">
                      <div
                        className="tqe-sa-tenant-avatar-sm"
                        style={{
                          background: `${PLAN_COLORS[t.plano] ?? "#4A4A4A"}18`,
                          color: PLAN_COLORS[t.plano] ?? "#4A4A4A",
                        }}
                      >
                        {t.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="tqe-sa-tenant-name-cell">{t.nome}</div>
                        <div className="tqe-sa-tenant-slug-cell">{t.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="tqe-sa-td-secondary">{t.cidade ?? "—"}</td>
                  <td>
                    <span
                      className="tqe-sa-badge"
                      style={{
                        background: `${PLAN_COLORS[t.plano] ?? "#4A4A4A"}18`,
                        color: PLAN_COLORS[t.plano] ?? "#4A4A4A",
                      }}
                    >
                      {PLAN_LABELS[t.plano] ?? t.plano}
                    </span>
                  </td>
                  <td className="tqe-sa-td-mono">
                    {t.mrr > 0 ? (
                      `R$${t.mrr}`
                    ) : (
                      <span style={{ color: "#4A4A4A" }}>—</span>
                    )}
                  </td>
                  <td className="tqe-sa-td-mono">{t.totalBarbeiros}</td>
                  <td className="tqe-sa-td-mono">{t.totalAgdMes}</td>
                  <td>
                    <span
                      className="tqe-sa-status-dot-label"
                      style={{ color: STATUS_COLORS[t.planoStatus] ?? "#888" }}
                    >
                      <span
                        className="tqe-sa-status-dot-sm"
                        style={{
                          background: STATUS_COLORS[t.planoStatus] ?? "#888",
                        }}
                      />
                      {STATUS_LABELS[t.planoStatus] ?? t.planoStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTenant && (
        <TenantDrawer
          tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
        />
      )}
    </div>
  );
}
