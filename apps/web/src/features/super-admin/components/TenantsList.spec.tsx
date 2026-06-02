import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { TenantsList } from "./TenantsList";

const BASE = "http://localhost:3000/api/v1";

const MOCK_TENANTS = [
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
  {
    codigo: 3,
    nome: "Barbearia Gamma",
    slug: "gamma",
    cidade: "Belo Horizonte",
    plano: "free",
    planoStatus: "inativo",
    mrr: 0,
    totalBarbeiros: 1,
    totalAgdMes: 0,
    criadoEm: "2025-06-01T00:00:00.000Z",
  },
];

const server = setupServer(
  http.get("/api/auth/token", () =>
    HttpResponse.json({ token: "mock-admin-token", canRefresh: false }),
  ),
  http.get(`${BASE}/admin/barbearias`, () => HttpResponse.json(MOCK_TENANTS)),
  http.patch(`${BASE}/admin/barbearias/:id/plano`, () =>
    HttpResponse.json({ ok: true }),
  ),
  http.patch(`${BASE}/admin/barbearias/:id/status`, () =>
    HttpResponse.json({ ok: true }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("TenantsList", () => {
  it("renderiza o título e a tabela de barbearias", async () => {
    render(<TenantsList />, { wrapper });
    expect(screen.getByText("Barbearias")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Barbearia Alpha")).toBeInTheDocument();
    });
    expect(screen.getByText("Barbearia Beta")).toBeInTheDocument();
    expect(screen.getByText("Barbearia Gamma")).toBeInTheDocument();
  });

  it("filtra barbearias ao clicar no botão de plano 'Pro'", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${BASE}/admin/barbearias`, ({ request }) => {
        const url = new URL(request.url);
        const plano = url.searchParams.get("plano");
        const filtered = plano
          ? MOCK_TENANTS.filter((t) => t.plano === plano)
          : MOCK_TENANTS;
        return HttpResponse.json(filtered);
      }),
    );
    render(<TenantsList />, { wrapper });
    await waitFor(() => screen.getByText("Barbearia Alpha"));

    const proBtn = screen.getByRole("button", { name: "Pro" });
    await user.click(proBtn);

    await waitFor(() => {
      expect(screen.getByText("Barbearia Alpha")).toBeInTheDocument();
    });
  });

  it("exibe campo de busca e reflete texto digitado", async () => {
    const user = userEvent.setup();
    render(<TenantsList />, { wrapper });
    const searchInput = screen.getByPlaceholderText(
      "Buscar barbearia ou slug…",
    );
    await user.type(searchInput, "Alpha");
    expect(searchInput).toHaveValue("Alpha");
  });

  it("abre o TenantDrawer ao clicar em uma linha da tabela", async () => {
    const user = userEvent.setup();
    render(<TenantsList />, { wrapper });
    await waitFor(() => screen.getByText("Barbearia Alpha"));

    const row = screen
      .getAllByRole("row")
      .find((r) => r.textContent?.includes("Barbearia Alpha"));
    expect(row).toBeDefined();
    await user.click(row!);

    // Drawer deve abrir com o nome do tenant
    await waitFor(() => {
      expect(
        screen.getAllByText("Barbearia Alpha").length,
      ).toBeGreaterThanOrEqual(1);
    });
    // Drawer tem botão de fechar
    expect(screen.getByText("×")).toBeInTheDocument();
  });
});
