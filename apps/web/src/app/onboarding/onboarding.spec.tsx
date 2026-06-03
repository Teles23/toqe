import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { createWrapper } from "@/test/render-helpers";

// Mocks antes do import do componente
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: () => null,
}));

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    establishSession: vi.fn().mockResolvedValue(undefined),
    user: null,
    barbearia: null,
    barbearias: [],
    perfil: null,
    loading: false,
    login: vi.fn(),
    verifyTwoFa: vi.fn(),
    logout: vi.fn(),
    switchBarbearia: vi.fn(),
  }),
}));

// Importar o componente padrão (default export)
import OnboardingPage from "./page";

function renderOnboarding() {
  const { Wrapper } = createWrapper();
  return render(<OnboardingPage />, { wrapper: Wrapper });
}

describe("Onboarding v2", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Step 1 ─────────────────────────────────────────────────────────────────

  it("renderiza passo 1 com campos de conta", () => {
    renderOnboarding();
    expect(screen.getByText("Primeiro, cria sua conta.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("João Silva")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("joao@barbearia.com"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Mín. 8 caracteres"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repita a senha")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("(11) 99999-9999")).toBeInTheDocument();
  });

  it("exibe erro quando nome é muito curto no passo 1", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("João Silva"), {
      target: { value: "A" },
    });
    fireEvent.change(screen.getByPlaceholderText("joao@barbearia.com"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mín. 8 caracteres"), {
      target: { value: "senha123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repita a senha"), {
      target: { value: "senha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/nome deve ter ao menos 2 caracteres/i),
      ).toBeInTheDocument();
    });
  });

  it("exibe erro quando senhas não conferem no passo 1", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("João Silva"), {
      target: { value: "João Silva" },
    });
    fireEvent.change(screen.getByPlaceholderText("joao@barbearia.com"), {
      target: { value: "joao@barbearia.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mín. 8 caracteres"), {
      target: { value: "senha123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repita a senha"), {
      target: { value: "senhadiferente" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(screen.getByText(/senhas não conferem/i)).toBeInTheDocument();
    });
  });

  // ── Step 2 ─────────────────────────────────────────────────────────────────

  it("avança para passo 2 ao passar validação do passo 1", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("João Silva"), {
      target: { value: "João Silva" },
    });
    fireEvent.change(screen.getByPlaceholderText("joao@barbearia.com"), {
      target: { value: "joao@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mín. 8 caracteres"), {
      target: { value: "senha123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repita a senha"), {
      target: { value: "senha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(
      await screen.findByText("Como sua barbearia se chama?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/PASSO 2 DE 7/i)).toBeInTheDocument();
  });

  it("auto-preenche slug ao digitar nome da barbearia", async () => {
    renderOnboarding();

    // Avança para step 2
    fireEvent.change(screen.getByPlaceholderText("João Silva"), {
      target: { value: "João Silva" },
    });
    fireEvent.change(screen.getByPlaceholderText("joao@barbearia.com"), {
      target: { value: "joao@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mín. 8 caracteres"), {
      target: { value: "senha123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repita a senha"), {
      target: { value: "senha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    await screen.findByText("Como sua barbearia se chama?");

    // Digita nome → slug deve ser auto-preenchido
    // maskSlug("Barba Test") → "barba-test" (sem caracteres especiais para simplificar)
    fireEvent.change(screen.getByPlaceholderText("Ex: Barba do Zé"), {
      target: { value: "Barba Test" },
    });

    const slugInput = screen.getByDisplayValue("barba-test");
    expect(slugInput).toBeInTheDocument();
  });

  // ── Sidebar navigation ─────────────────────────────────────────────────────

  it("renderiza sidebar com 7 passos e destaca o ativo", () => {
    renderOnboarding();
    expect(screen.getByText("Criar conta")).toBeInTheDocument();
    expect(screen.getByText("Sua barbearia")).toBeInTheDocument();
    expect(screen.getByText("Identidade visual")).toBeInTheDocument();
    expect(screen.getByText("Horário de funcionamento")).toBeInTheDocument();
    expect(screen.getByText("Serviços")).toBeInTheDocument();
    expect(screen.getByText("Equipe")).toBeInTheDocument();
    expect(screen.getByText("Tudo pronto")).toBeInTheDocument();
  });

  // ── Botão Voltar ───────────────────────────────────────────────────────────

  it("botão Voltar está desabilitado no passo 1", () => {
    renderOnboarding();
    const backBtn = screen.getByRole("button", { name: /← voltar/i });
    expect(backBtn).toBeDisabled();
  });

  // ── Step 4 — horários ──────────────────────────────────────────────────────

  async function goToStep4() {
    renderOnboarding();
    // Step 1
    fireEvent.change(screen.getByPlaceholderText("João Silva"), { target: { value: "João Silva" } });
    fireEvent.change(screen.getByPlaceholderText("joao@barbearia.com"), { target: { value: "joao@step4.com" } });
    fireEvent.change(screen.getByPlaceholderText("Mín. 8 caracteres"), { target: { value: "senha123" } });
    fireEvent.change(screen.getByPlaceholderText("Repita a senha"), { target: { value: "senha123" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByText("Como sua barbearia se chama?");
    // Step 2
    fireEvent.change(screen.getByPlaceholderText("Ex: Barba do Zé"), { target: { value: "Barbearia XYZ" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByText("Qual a cara da sua marca?");
    // Step 3
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByText("Quando vocês abrem?");
  }

  it("passo 4: bloqueia avanço quando todos os dias estão fechados", async () => {
    await goToStep4();

    // Fecha todos os dias abertos (6 por padrão — Seg a Sáb)
    const togglesAbertos = screen.getAllByRole("button", { pressed: true });
    togglesAbertos.forEach((t) => fireEvent.click(t));

    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/ative ao menos um dia de funcionamento/i),
      ).toBeInTheDocument(),
    );
    // Permanece no step 4
    expect(screen.getByText("Quando vocês abrem?")).toBeInTheDocument();
  });

  it("passo 4: avança normalmente com ao menos 1 dia ativo", async () => {
    await goToStep4();
    // Por padrão 6 dias abertos — apenas avança
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByText("O que vocês fazem?");
  });

  // ── Step 5 — serviços ──────────────────────────────────────────────────────

  async function goToStep5() {
    await goToStep4();
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByText("O que vocês fazem?");
  }

  it("passo 5: bloqueia avanço sem serviços válidos", async () => {
    await goToStep5();

    // Remove serviços um por um — após cada clique o DOM re-renderiza
    let removeBtns = screen.queryAllByRole("button", { name: /remover serviço/i });
    while (removeBtns.length > 0) {
      fireEvent.click(removeBtns[0]!);
      removeBtns = screen.queryAllByRole("button", { name: /remover serviço/i });
    }

    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/adicione ao menos um serviço/i),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("O que vocês fazem?")).toBeInTheDocument();
  });

  it("passo 5: avança com ao menos 1 serviço com nome, preço e duração válidos", async () => {
    await goToStep5();
    // Preset basic tem 3 serviços válidos por padrão
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByText("Quem mais corta com você?");
  });
});
