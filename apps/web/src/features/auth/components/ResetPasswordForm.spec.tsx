import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { createWrapper } from "@/test/render-helpers";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/features/auth/hooks/use-reset-password", () => ({
  useResetPassword: vi.fn(),
}));

import { useResetPassword } from "@/features/auth/hooks/use-reset-password";

const mockUseResetPassword = useResetPassword as unknown as ReturnType<
  typeof vi.fn
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResetMutation(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

function renderForm(token = "valid-token-abc", onBackToLogin = vi.fn()) {
  const { Wrapper } = createWrapper();
  return {
    onBackToLogin,
    ...render(
      <ResetPasswordForm token={token} onBackToLogin={onBackToLogin} />,
      { wrapper: Wrapper },
    ),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ResetPasswordForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza os campos de nova senha e confirmar senha", () => {
    mockUseResetPassword.mockReturnValue(makeResetMutation());
    renderForm();

    expect(screen.getByPlaceholderText("Mínimo 6 caracteres")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repita a nova senha")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /redefinir senha/i }),
    ).toBeInTheDocument();
  });

  it("chama mutate com token e novaSenha ao submeter formulário válido", async () => {
    const mutate = vi.fn();
    mockUseResetPassword.mockReturnValue(makeResetMutation({ mutate }));
    renderForm("meu-token-123");

    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), {
      target: { value: "novaSenha123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repita a nova senha"), {
      target: { value: "novaSenha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        token: "meu-token-123",
        novaSenha: "novaSenha123",
      });
    });
  });

  it("exibe tela de sucesso após redefinição bem-sucedida", () => {
    mockUseResetPassword.mockReturnValue(makeResetMutation({ isSuccess: true }));
    renderForm();

    expect(screen.getByText("Senha redefinida!")).toBeInTheDocument();
    expect(screen.getByText(/Sua senha foi atualizada/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ir para o login/i }),
    ).toBeInTheDocument();
  });

  it("chama onBackToLogin ao clicar no botão de sucesso", () => {
    const onBackToLogin = vi.fn();
    mockUseResetPassword.mockReturnValue(makeResetMutation({ isSuccess: true }));
    renderForm("token", onBackToLogin);

    fireEvent.click(screen.getByRole("button", { name: /ir para o login/i }));

    expect(onBackToLogin).toHaveBeenCalled();
  });

  it("exibe AuthErrorBanner quando token é inválido (erro da API)", () => {
    mockUseResetPassword.mockReturnValue(
      makeResetMutation({
        isError: true,
        error: new Error("Token inválido ou expirado"),
      }),
    );
    renderForm();

    expect(
      screen.getByText("Token inválido ou expirado"),
    ).toBeInTheDocument();
  });

  it("exibe erro de validação quando senhas não coincidem", async () => {
    mockUseResetPassword.mockReturnValue(makeResetMutation());
    renderForm();

    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), {
      target: { value: "senhaAbc123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repita a nova senha"), {
      target: { value: "senhaDiferente" },
    });
    fireEvent.click(screen.getByRole("button", { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
    });
  });

  it("exibe erro de validação quando campos estão vazios", async () => {
    const mutate = vi.fn();
    mockUseResetPassword.mockReturnValue(makeResetMutation({ mutate }));
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve ter ao menos 6 caracteres"),
      ).toBeInTheDocument();
    });
    expect(mutate).not.toHaveBeenCalled();
  });

  it("exibe erro de validação quando senha é muito curta", async () => {
    const mutate = vi.fn();
    mockUseResetPassword.mockReturnValue(makeResetMutation({ mutate }));
    renderForm();

    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repita a nova senha"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve ter ao menos 6 caracteres"),
      ).toBeInTheDocument();
    });
    expect(mutate).not.toHaveBeenCalled();
  });

  it("desabilita o botão enquanto isPending", () => {
    mockUseResetPassword.mockReturnValue(
      makeResetMutation({ isPending: true }),
    );
    renderForm();

    const btn = screen.getByRole("button", { name: /redefinindo/i });
    expect(btn).toBeDisabled();
  });

  it("chama onBackToLogin ao clicar em 'Voltar para o login'", () => {
    const onBackToLogin = vi.fn();
    mockUseResetPassword.mockReturnValue(makeResetMutation());
    renderForm("token", onBackToLogin);

    fireEvent.click(
      screen.getByRole("button", { name: /voltar para o login/i }),
    );

    expect(onBackToLogin).toHaveBeenCalled();
  });
});
