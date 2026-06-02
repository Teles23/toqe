import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterEach,
  afterAll,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { TenantDrawer } from "./TenantDrawer";
import type { AdminTenant } from "../types";

const BASE = "http://localhost:3000/api/v1";

const MOCK_TENANT: AdminTenant = {
  codigo: 1,
  nome: "Barbearia Alpha",
  slug: "alpha",
  cidade: "São Paulo",
  plano: "pro",
  planoStatus: "ativo",
  ativo: true,
  mrr: 189,
  totalBarbeiros: 3,
  totalAgdMes: 120,
  criadoEm: "2025-01-10T00:00:00.000Z",
  ultimaAtividade: null,
  logoUrl: null,
};

const server = setupServer(
  http.get("/api/auth/token", () =>
    HttpResponse.json({ token: "mock-admin-token", canRefresh: false }),
  ),
  http.get(`${BASE}/admin/barbearias`, () => HttpResponse.json([])),
  http.patch(`${BASE}/admin/barbearias/:id/plano`, () =>
    HttpResponse.json({ ok: true }),
  ),
  http.patch(`${BASE}/admin/barbearias/:id/status`, () =>
    HttpResponse.json({ ok: true }),
  ),
  http.get(`${BASE}/admin/metrics`, () =>
    HttpResponse.json({
      mrr: 0,
      arr: 0,
      totalTenants: 0,
      activeTenants: 0,
      totalBarbeiros: 0,
      totalAgdMes: 0,
    }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("TenantDrawer", () => {
  it("renderiza as informações do tenant corretamente", () => {
    const onClose = vi.fn();
    render(<TenantDrawer tenant={MOCK_TENANT} onClose={onClose} />, {
      wrapper,
    });

    expect(screen.getByText("Barbearia Alpha")).toBeInTheDocument();
    expect(screen.getByText("toqe.app/alpha")).toBeInTheDocument();
    // Meta grid
    expect(screen.getByText("Barbeiros ativos")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    // Plan picker
    expect(screen.getByRole("button", { name: /pro/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /basic/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /free/i })).toBeInTheDocument();
  });

  it("chama PATCH plano ao clicar em 'Salvar alterações' após trocar plano", async () => {
    const user = userEvent.setup();
    let patchedPlano = "";

    server.use(
      http.patch(`${BASE}/admin/barbearias/:id/plano`, async ({ request }) => {
        const body = (await request.json()) as { plano: string };
        patchedPlano = body.plano;
        return HttpResponse.json({ ok: true });
      }),
    );

    const onClose = vi.fn();
    render(<TenantDrawer tenant={MOCK_TENANT} onClose={onClose} />, {
      wrapper,
    });

    // Troca para "basic"
    await user.click(screen.getByRole("button", { name: /basic/i }));
    // Salva
    await user.click(
      screen.getByRole("button", { name: /salvar alterações/i }),
    );

    await waitFor(() => {
      expect(patchedPlano).toBe("basic");
    });
  });

  it("chama PATCH status ao clicar em um status diferente", async () => {
    const user = userEvent.setup();
    let patchedStatus = "";

    server.use(
      http.patch(`${BASE}/admin/barbearias/:id/status`, async ({ request }) => {
        const body = (await request.json()) as { status: string };
        patchedStatus = body.status;
        return HttpResponse.json({ ok: true });
      }),
    );

    const onClose = vi.fn();
    render(<TenantDrawer tenant={MOCK_TENANT} onClose={onClose} />, {
      wrapper,
    });

    // Clica em "Inativo"
    await user.click(screen.getByRole("button", { name: "Inativo" }));

    await waitFor(() => {
      expect(patchedStatus).toBe("inativo");
    });
  });

  it("fecha o drawer ao clicar no botão ×", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TenantDrawer tenant={MOCK_TENANT} onClose={onClose} />, {
      wrapper,
    });

    await user.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
