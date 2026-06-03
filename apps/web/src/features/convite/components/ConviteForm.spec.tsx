import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import React from "react";
import { createWrapper } from "@/test/render-helpers";
import { server } from "@/test/msw-handlers";
import { ConviteForm } from "./ConviteForm";

/* ── mocks ──────────────────────────────────────────────────────────────── */

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_t, tag: string) =>
        ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLElement> & {
          children?: React.ReactNode;
        }) =>
          React.createElement(tag === "form" ? "form" : "div", props, children),
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockEstablishSession = vi.fn().mockResolvedValue(undefined);
vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ establishSession: mockEstablishSession }),
}));

/* ── helpers ────────────────────────────────────────────────────────────── */

const TOKEN = "abc123token";

function renderForm() {
  const { Wrapper } = createWrapper();
  return render(<ConviteForm token={TOKEN} />, { wrapper: Wrapper });
}

/** Override do GET do convite (handler padrão = isNew:true). */
function mockConvite(overrides: Record<string, unknown> = {}) {
  server.use(
    http.get("/api/convite/:token", ({ params }) =>
      HttpResponse.json({
        token: String(params.token),
        barbeariaNome: "Studio Navalha",
        barbeariaSlug: "studio-navalha",
        email: "novo@barbeiro.com",
        perfil: "barbeiro",
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        isNew: true,
        ...overrides,
      }),
    ),
  );
}

/* ── tests ──────────────────────────────────────────────────────────────── */

describe("ConviteForm — jornada de aceite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEstablishSession.mockResolvedValue(undefined);
  });

  it("mostra loading enquanto a query do convite está pendente", () => {
    renderForm();
    expect(screen.getByTestId("convite-loading")).toBeInTheDocument();
  });

  it("mostra estado expirado quando o convite retorna 404", async () => {
    server.use(
      http.get(
        "/api/convite/:token",
        () =>
          new HttpResponse(JSON.stringify({ message: "expirado" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-expirado")).toBeInTheDocument(),
    );
    expect(screen.getByText("Link inválido")).toBeInTheDocument();
  });

  it("mostra estado expirado quando o convite retorna 500", async () => {
    server.use(
      http.get(
        "/api/convite/:token",
        () =>
          new HttpResponse(JSON.stringify({ message: "boom" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-expirado")).toBeInTheDocument(),
    );
  });

  it("renderiza a landing com nome da barbearia e e-mail do convite", async () => {
    mockConvite();
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Studio Navalha quer você na equipe\./i),
    ).toBeInTheDocument();
    expect(screen.getByText("novo@barbeiro.com")).toBeInTheDocument();
  });

  it("usuário novo (isNew:true) vê campo de nome + senha no form", async () => {
    mockConvite({ isNew: true });
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));

    expect(
      screen.getByRole("heading", { name: "Criar sua conta" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Mínimo 8 caracteres"),
    ).toBeInTheDocument();
    // E-mail readonly vindo do convite
    expect(screen.getByLabelText(/E-mail · do convite/i)).toHaveValue(
      "novo@barbeiro.com",
    );
  });

  it("usuário existente (isNew:false) vê só o campo de senha", async () => {
    mockConvite({ isNew: false, email: "existente@barbeiro.com" });
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));

    expect(
      screen.getByRole("heading", { name: "Confirmar acesso" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome completo")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Mínimo 8 caracteres"),
    ).toBeInTheDocument();
  });

  it("aceitar com sucesso estabelece sessão e mostra welcome", async () => {
    mockConvite({ isNew: true });
    server.use(
      http.post("/api/convite/:token/aceitar", () =>
        HttpResponse.json({
          user: {
            codigo: 7,
            nome: "Carlos Lima",
            email: "novo@barbeiro.com",
          },
          isNew: true,
          barbeariaNome: "Studio Navalha",
        }),
      ),
    );
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));
    fireEvent.change(screen.getByLabelText("Nome completo"), {
      target: { value: "Carlos Lima" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mínimo 8 caracteres"), {
      target: { value: "senha12345" },
    });
    fireEvent.click(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(screen.getByTestId("convite-success")).toBeInTheDocument(),
    );
    expect(screen.getByText(/Bem-vindo, Carlos\./i)).toBeInTheDocument();
    expect(mockEstablishSession).toHaveBeenCalledTimes(1);
  });

  it("'Ver minha agenda' navega para /agenda após o welcome", async () => {
    mockConvite({ isNew: false });
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));
    fireEvent.change(screen.getByPlaceholderText("Mínimo 8 caracteres"), {
      target: { value: "senha12345" },
    });
    fireEvent.click(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(screen.getByTestId("convite-success")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("btn-ver-agenda"));
    expect(mockPush).toHaveBeenCalledWith("/agenda");
  });

  it("erro 409 (já utilizado) volta ao form com mensagem e não estabelece sessão", async () => {
    mockConvite({ isNew: false });
    server.use(
      http.post(
        "/api/convite/:token/aceitar",
        () =>
          new HttpResponse(
            JSON.stringify({ message: "Convite já utilizado." }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            },
          ),
      ),
    );
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));
    fireEvent.change(screen.getByPlaceholderText("Mínimo 8 caracteres"), {
      target: { value: "senha12345" },
    });
    fireEvent.click(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(screen.getByText("Convite já utilizado.")).toBeInTheDocument(),
    );
    expect(mockEstablishSession).not.toHaveBeenCalled();
  });

  it("erro 401 (senha incorreta) mostra mensagem específica", async () => {
    mockConvite({ isNew: false });
    server.use(
      http.post(
        "/api/convite/:token/aceitar",
        () =>
          new HttpResponse(JSON.stringify({ message: "senha errada" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));
    fireEvent.change(screen.getByPlaceholderText("Mínimo 8 caracteres"), {
      target: { value: "errada123" },
    });
    fireEvent.click(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(screen.getByText("Senha incorreta.")).toBeInTheDocument(),
    );
  });

  it("erro 400 (senha curta) mostra mensagem de mínimo de caracteres", async () => {
    mockConvite({ isNew: true });
    server.use(
      http.post(
        "/api/convite/:token/aceitar",
        () =>
          new HttpResponse(JSON.stringify({ message: "curta" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));
    fireEvent.change(screen.getByLabelText("Nome completo"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mínimo 8 caracteres"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(
        screen.getByText("Senha de ao menos 8 caracteres."),
      ).toBeInTheDocument(),
    );
  });

  it("rejeitar chama DELETE /api/convite/:token e navega para /login", async () => {
    mockConvite();
    let deleted = false;
    server.use(
      http.delete("/api/convite/:token", () => {
        deleted = true;
        return HttpResponse.json({ sucesso: true });
      }),
    );
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-rejeitar"));

    await waitFor(() => expect(deleted).toBe(true));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });

  it("'Voltar' no form retorna para a landing", async () => {
    mockConvite();
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));
    expect(screen.getByText("Criar sua conta")).toBeInTheDocument();

    fireEvent.click(screen.getByText("← Voltar"));
    expect(screen.getByTestId("convite-landing")).toBeInTheDocument();
  });

  // ── Validação client-side ─────────────────────────────────────────────────

  it("bloqueia submit com nome vazio (isNew) sem chamar a API", async () => {
    mockConvite({ isNew: true });
    let apiCalled = false;
    server.use(
      http.post("/api/convite/:token/aceitar", () => {
        apiCalled = true;
        return HttpResponse.json({});
      }),
    );
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));
    // Nome vazio, senha válida
    fireEvent.change(screen.getByPlaceholderText("Mínimo 8 caracteres"), {
      target: { value: "senha12345" },
    });
    fireEvent.click(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(
        screen.getByText("Nome deve ter ao menos 2 caracteres."),
      ).toBeInTheDocument(),
    );
    expect(apiCalled).toBe(false);
  });

  it("bloqueia submit com senha < 8 chars sem chamar a API", async () => {
    mockConvite({ isNew: false });
    let apiCalled = false;
    server.use(
      http.post("/api/convite/:token/aceitar", () => {
        apiCalled = true;
        return HttpResponse.json({});
      }),
    );
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));
    fireEvent.change(screen.getByPlaceholderText("Mínimo 8 caracteres"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(
        screen.getByText("Senha de ao menos 8 caracteres."),
      ).toBeInTheDocument(),
    );
    expect(apiCalled).toBe(false);
  });

  it("erro 400 da API exibe a mensagem real (não hardcoded)", async () => {
    mockConvite({ isNew: false });
    server.use(
      http.post(
        "/api/convite/:token/aceitar",
        () =>
          new HttpResponse(
            JSON.stringify({ message: "Erro específico do servidor" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
    renderForm();
    await waitFor(() =>
      expect(screen.getByTestId("convite-landing")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("btn-aceitar-convite"));
    fireEvent.change(screen.getByPlaceholderText("Mínimo 8 caracteres"), {
      target: { value: "senha12345" },
    });
    fireEvent.click(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(
        screen.getByText("Erro específico do servidor"),
      ).toBeInTheDocument(),
    );
  });
});
