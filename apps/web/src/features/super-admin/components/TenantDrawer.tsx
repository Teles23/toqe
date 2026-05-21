"use client";

import { useState } from "react";
import {
  useUpdateTenantPlano,
  useUpdateTenantStatus,
} from "../hooks/use-admin-tenants";
import type { AdminTenant } from "../types";

const PLAN_COLORS: Record<string, string> = {
  pro: "#F4B400",
  basic: "#4DA3FF",
  free: "#4A4A4A",
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

interface TenantDrawerProps {
  tenant: AdminTenant;
  onClose: () => void;
}

export function TenantDrawer({ tenant, onClose }: TenantDrawerProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [localPlano, setLocalPlano] = useState(tenant.plano);
  const [localStatus, setLocalStatus] = useState(tenant.planoStatus);

  const updatePlano = useUpdateTenantPlano();
  const updateStatus = useUpdateTenantStatus();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function handleSavePlano() {
    updatePlano.mutate(
      { id: tenant.codigo, plano: localPlano },
      { onSuccess: () => showToast("Plano atualizado com sucesso!") },
    );
  }

  function handleSaveStatus(status: string) {
    setLocalStatus(status as AdminTenant["planoStatus"]);
    updateStatus.mutate(
      { id: tenant.codigo, status },
      { onSuccess: () => showToast("Status atualizado com sucesso!") },
    );
  }

  return (
    <div className="tqe-sa-drawer-overlay" onClick={onClose}>
      <div className="tqe-sa-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tqe-sa-drawer-header">
          <div className="tqe-sa-drawer-title-row">
            <div
              className="tqe-sa-drawer-avatar"
              style={{
                background: `${PLAN_COLORS[tenant.plano] ?? "#4A4A4A"}18`,
                borderColor: `${PLAN_COLORS[tenant.plano] ?? "#4A4A4A"}40`,
                color: PLAN_COLORS[tenant.plano] ?? "#4A4A4A",
              }}
            >
              {tenant.nome.charAt(0)}
            </div>
            <div>
              <div className="tqe-sa-drawer-tenant-name">{tenant.nome}</div>
              <div className="tqe-sa-drawer-tenant-slug">
                toqe.app/{tenant.slug}
              </div>
            </div>
          </div>
          <button className="tqe-sa-drawer-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="tqe-sa-drawer-body">
          {/* Meta grid */}
          <div className="tqe-sa-drawer-meta-grid">
            {[
              [
                "Membro desde",
                new Date(tenant.criadoEm).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "numeric",
                }),
              ],
              ["Barbeiros ativos", `${tenant.totalBarbeiros}`],
              ["Agend./mês", `${tenant.totalAgdMes}`],
              ["MRR", tenant.mrr > 0 ? `R$${tenant.mrr}` : "Grátis"],
            ].map(([k, v]) => (
              <div key={k} className="tqe-sa-meta-cell">
                <div className="tqe-sa-meta-label">{k}</div>
                <div className="tqe-sa-meta-value">{v}</div>
              </div>
            ))}
          </div>

          {/* Mudar plano */}
          <div className="tqe-sa-drawer-section">
            <div className="tqe-sa-drawer-section-label">Plano</div>
            <div className="tqe-sa-plan-picker">
              {(["free", "basic", "pro"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setLocalPlano(p)}
                  className={`tqe-sa-plan-btn${localPlano === p ? " tqe-sa-plan-btn--active" : ""}`}
                  style={
                    localPlano === p
                      ? {
                          background: `${PLAN_COLORS[p]}12`,
                          borderColor: `${PLAN_COLORS[p]}50`,
                          color: PLAN_COLORS[p],
                        }
                      : {}
                  }
                >
                  <span
                    style={{ textTransform: "capitalize", fontWeight: 600 }}
                  >
                    {p}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>
                    {p === "free" ? "R$0" : p === "basic" ? "R$89" : "R$189"}
                    /mês
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="tqe-sa-drawer-section">
            <div className="tqe-sa-drawer-section-label">Status da conta</div>
            <div className="tqe-sa-status-picker">
              {(["ativo", "inativo", "suspenso"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSaveStatus(s)}
                  className={`tqe-sa-status-btn${localStatus === s ? " tqe-sa-status-btn--active" : ""}`}
                  style={
                    localStatus === s
                      ? {
                          background: `${STATUS_COLORS[s]}12`,
                          borderColor: `${STATUS_COLORS[s]}40`,
                          color: STATUS_COLORS[s],
                        }
                      : {}
                  }
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Zona de risco */}
          <div className="tqe-sa-danger-zone">
            <div className="tqe-sa-danger-label">ZONA DE RISCO</div>
            <div className="tqe-sa-danger-actions">
              <button
                className="tqe-sa-danger-btn"
                onClick={() => handleSaveStatus("suspenso")}
              >
                Suspender conta
              </button>
              <button
                className="tqe-sa-danger-btn tqe-sa-danger-btn--fill"
                onClick={() => handleSaveStatus("inativo")}
              >
                Cancelar plano
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="tqe-sa-drawer-footer">
          <button
            className="tqe-sa-footer-btn-secondary"
            onClick={() => window.open(`/b/${tenant.slug}`, "_blank")}
            title="Abre a página pública de booking deste tenant"
          >
            ↗ Ver tenant
            {/* TODO Phase 2: impersonation — gerar JWT temporário como dono do tenant */}
          </button>
          <button
            className="tqe-sa-footer-btn-primary"
            onClick={handleSavePlano}
            disabled={updatePlano.isPending}
          >
            {updatePlano.isPending ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>

        {/* Toast */}
        {toast && <div className="tqe-sa-toast">● {toast}</div>}
      </div>
    </div>
  );
}
