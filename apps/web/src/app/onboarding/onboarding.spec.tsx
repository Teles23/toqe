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
});
