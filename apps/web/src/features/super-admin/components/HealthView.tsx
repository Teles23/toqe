"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";

interface HealthStatus {
  status: "ok" | "error";
  uptime?: number;
  db?: string;
  timestamp?: string;
}

function useHealthCheck() {
  return useQuery<HealthStatus>({
    queryKey: ["health"],
    queryFn: () => api.get<HealthStatus>("/health"),
    refetchInterval: 30_000,
    retry: false,
  });
}

const ENDPOINTS = [
  { name: "GET /health", method: "GET", latency: "18ms", status: "ok" },
  { name: "POST /auth/login", method: "POST", latency: "62ms", status: "ok" },
  { name: "GET /barbearias/:id", method: "GET", latency: "34ms", status: "ok" },
  { name: "GET /agendamentos", method: "GET", latency: "48ms", status: "ok" },
  { name: "POST /agendamentos", method: "POST", latency: "91ms", status: "ok" },
  { name: "GET /admin/metrics", method: "GET", latency: "55ms", status: "ok" },
];

function formatUptime(seconds?: number): string {
  if (seconds === undefined) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function HealthView() {
  const { data: health, isLoading, isError } = useHealthCheck();

  const isUp = !isError && health?.status === "ok";

  return (
    <div className="tqe-sa-content">
      <div className="tqe-sa-page-header">
        <h1 className="tqe-sa-page-title">Health</h1>
        <div className="tqe-sa-page-sub-row">
          <p className="tqe-sa-page-sub">status da infraestrutura</p>
          <span
            className="tqe-sa-health-status-badge"
            style={{
              background: isLoading
                ? "#4A4A4A18"
                : isUp
                  ? "#1DB95418"
                  : "#FF4D4F18",
              color: isLoading ? "#4A4A4A" : isUp ? "#1DB954" : "#FF4D4F",
              borderColor: isLoading
                ? "#4A4A4A40"
                : isUp
                  ? "#1DB95440"
                  : "#FF4D4F40",
            }}
          >
            <span
              className="tqe-sa-health-dot"
              style={{
                background: isLoading
                  ? "#4A4A4A"
                  : isUp
                    ? "#1DB954"
                    : "#FF4D4F",
              }}
            />
            {isLoading
              ? "Verificando…"
              : isUp
                ? "Todos os sistemas operacionais"
                : "Degradado"}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="tqe-sa-kpi-grid">
        <div className="tqe-sa-kpi-card">
          <div
            className="tqe-sa-kpi-accent"
            style={{ background: "#1DB954" }}
          />
          <div className="tqe-sa-kpi-label">Uptime</div>
          <div className="tqe-sa-kpi-value">
            {isLoading ? "—" : isUp ? formatUptime(health?.uptime) : "—"}
          </div>
          <div
            className="tqe-sa-kpi-sub"
            style={{ color: isUp ? "#1DB954" : "#FF4D4F" }}
          >
            {isLoading ? "" : isUp ? "API online" : "API indisponível"}
          </div>
        </div>
        <div className="tqe-sa-kpi-card">
          <div
            className="tqe-sa-kpi-accent"
            style={{ background: "#F4B400" }}
          />
          <div className="tqe-sa-kpi-label">Latência P95</div>
          <div className="tqe-sa-kpi-value">~62ms</div>
          <div className="tqe-sa-kpi-sub" style={{ color: "#1DB954" }}>
            Nominal
          </div>
        </div>
        <div className="tqe-sa-kpi-card">
          <div
            className="tqe-sa-kpi-accent"
            style={{ background: "#FF4D4F" }}
          />
          <div className="tqe-sa-kpi-label">Erros 5xx (24h)</div>
          <div className="tqe-sa-kpi-value">0</div>
          <div className="tqe-sa-kpi-sub" style={{ color: "#1DB954" }}>
            Sem erros críticos
          </div>
        </div>
        <div className="tqe-sa-kpi-card">
          <div
            className="tqe-sa-kpi-accent"
            style={{ background: "#A78BFA" }}
          />
          <div className="tqe-sa-kpi-label">DB</div>
          <div className="tqe-sa-kpi-value">
            {isLoading
              ? "—"
              : health?.db === "ok"
                ? "OK"
                : isError
                  ? "Erro"
                  : "—"}
          </div>
          <div
            className="tqe-sa-kpi-sub"
            style={{ color: health?.db === "ok" ? "#1DB954" : "#FF4D4F" }}
          >
            {isLoading
              ? ""
              : health?.db === "ok"
                ? "PostgreSQL online"
                : "Verificando…"}
          </div>
        </div>
      </div>

      {/* Endpoint cards */}
      <div className="tqe-sa-card">
        <div className="tqe-sa-card-title">Endpoints monitorados</div>
        <div className="tqe-sa-endpoint-grid">
          {ENDPOINTS.map((ep) => (
            <div key={ep.name} className="tqe-sa-endpoint-card">
              <div className="tqe-sa-endpoint-header">
                <span
                  className="tqe-sa-method-badge"
                  style={{
                    background: ep.method === "GET" ? "#1DB95418" : "#4DA3FF18",
                    color: ep.method === "GET" ? "#1DB954" : "#4DA3FF",
                  }}
                >
                  {ep.method}
                </span>
                <span
                  className="tqe-sa-endpoint-status-dot"
                  style={{
                    background: ep.status === "ok" ? "#1DB954" : "#FF4D4F",
                  }}
                />
              </div>
              <div className="tqe-sa-endpoint-name">{ep.name}</div>
              <div className="tqe-sa-endpoint-latency">{ep.latency}</div>
            </div>
          ))}
        </div>
        <div className="tqe-sa-health-note">
          {/* TODO Phase 2: integrar Prometheus/Sentry para métricas de latência e erros reais */}
          Latência e erros 5xx são estimativas estáticas (Phase 1). Integração
          com Prometheus/Sentry na Phase 2.
        </div>
      </div>
    </div>
  );
}
