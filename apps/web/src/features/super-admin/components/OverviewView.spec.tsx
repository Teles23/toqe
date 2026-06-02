import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { OverviewView } from "./OverviewView";

const BASE = "http://localhost:3000/api/v1";

const server = setupServer(
  http.get("/api/auth/token", () =>
    HttpResponse.json({ token: "mock-admin-token", canRefresh: false }),
  ),
  http.get(`${BASE}/admin/metrics`, () =>
    HttpResponse.json({
      mrr: 1246,
      arr: 14952,
      totalTenants: 18,
      activeTenants: 12,
      totalBarbeiros: 34,
      totalAgdMes: 872,
    }),
  ),
  http.get(`${BASE}/admin/activity`, () =>
    HttpResponse.json([
      {
        tipo: "signup",
        texto: "Nova barbearia: Corte & Cia",
        tempo: "2 min atrás",
      },
      {
        tipo: "upgrade",
        texto: "Alpha fez upgrade para Pro",
        tempo: "18 min atrás",
      },
      { tipo: "churn", texto: "Gamma cancelou o plano", tempo: "3h atrás" },
    ]),
  ),
  http.get(`${BASE}/admin/barbearias`, () =>
    HttpResponse.json([
      {
        codigo: 1,
        nome: "Barbearia Alpha",
        slug: "alpha",
        cidade: "São Paulo",
        plano: "pro",
        planoStatus: "ativo",
        mrr: 189,
        totalBarbeiros: 3,
        totalAgdMes: 120,
        criadoEm: "2025-01-10T00:00:00.000Z",
      },
      {
        codigo: 2,
        nome: "Barbearia Beta",
        slug: "beta",
        cidade: "Rio de Janeiro",
        plano: "basic",
        planoStatus: "ativo",
        mrr: 89,
        totalBarbeiros: 2,
        totalAgdMes: 68,
        criadoEm: "2025-03-15T00:00:00.000Z",
      },
    ]),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("OverviewView", () => {
  it("renderiza os 4 KPI cards com labels", () => {
    render(<OverviewView />, { wrapper });
    expect(screen.getByText("MRR")).toBeInTheDocument();
    expect(screen.getByText("ARR projetado")).toBeInTheDocument();
    expect(screen.getByText("Barbearias")).toBeInTheDocument();
    expect(screen.getByText("Atend./mês")).toBeInTheDocument();
  });

  it("exibe os valores de métricas após carregar", async () => {
    render(<OverviewView />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("R$1.246")).toBeInTheDocument();
    });
    expect(screen.getByText("R$14.952")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("872")).toBeInTheDocument();
  });

  it("renderiza o feed de atividade global", async () => {
    render(<OverviewView />, { wrapper });
    await waitFor(() => {
      expect(
        screen.getByText("Nova barbearia: Corte & Cia"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Alpha fez upgrade para Pro")).toBeInTheDocument();
    expect(screen.getByText("Gamma cancelou o plano")).toBeInTheDocument();
  });

  it("renderiza o breakdown por plano com barras", async () => {
    render(<OverviewView />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Pro")).toBeInTheDocument();
    });
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
  });
});
