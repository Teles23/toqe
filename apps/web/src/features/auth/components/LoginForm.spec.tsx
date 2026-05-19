import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { LoginForm } from "./LoginForm";
import { TwoFaRequiredError } from "@/features/auth/services/auth.service";
import { createWrapper } from "@/test/render-helpers";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/features/auth/hooks/use-login", () => ({
  useLogin: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// O GoogleLogin do @react-oauth/google requer GoogleOAuthProvider — basta
// renderizar um stub para o componente não estourar.
vi.mock("@react-oauth/google", () => ({
  GoogleLogin: () => <div data-testid="google-login-stub" />,
}));

import { useLogin } from "@/features/auth/hooks/use-login";

const mockUseLogin = useLogin as unknown as ReturnType<typeof vi.fn>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface LoginMutationOverrides {
  mutate?: ReturnType<typeof vi.fn>;
  isPending?: boolean;
  isError?: boolean;
  error?: Error | null;
}

function makeLoginMutation(overrides: LoginMutationOverrides = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

function renderForm(
  overrides: {
    onForgotPassword?: () => void;
    onCreateAccount?: () => void;
    onTwoFaRequired?: (tempToken: string) => void;
  } = {},
) {
  const onForgotPassword = overrides.onForgotPassword ?? vi.fn();
  const onCreateAccount = overrides.onCreateAccount ?? vi.fn();
  const onTwoFaRequired = overrides.onTwoFaRequired ?? vi.fn();
  const { Wrapper } = createWrapper();
  return {
    onForgotPassword,
    onCreateAccount,
    onTwoFaRequired,
    ...render(
      <LoginForm
        onForgotPassword={onForgotPassword}
        onCreateAccount={onCreateAccount}
        onTwoFaRequired={onTwoFaRequired}
      />,
      { wrapper: Wrapper },
    ),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLogin.mockReturnValue(makeLoginMutation());
  });

  it("renderiza campos de e-mail, senha e CTA principal", () => {
    renderForm();

    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /entrar no painel/i }),
    ).toBeInTheDocument();
  });

  it("chama useLogin.mutate com payload correto ao submeter", async () => {
    const mutate = vi.fn();
    mockUseLogin.mockReturnValue(makeLoginMutation({ mutate }));
    renderForm();

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "thiago@toqe.dev" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "senhaForte123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar no painel/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        { email: "thiago@toqe.dev", senha: "senhaForte123" },
        expect.objectContaining({ onError: expect.any(Function) }),
      );
    });
  });

  it("exibe erro de validação quando e-mail é inválido", async () => {
    const mutate = vi.fn();
    mockUseLogin.mockReturnValue(makeLoginMutation({ mutate }));
    renderForm();

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "email-invalido" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "senhaForte123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar no painel/i }));

    await waitFor(() => {
      expect(screen.getByText("E-mail inválido")).toBeInTheDocument();
    });
    expect(mutate).not.toHaveBeenCalled();
  });

  it("exibe erro de validação quando senha é muito curta", async () => {
    const mutate = vi.fn();
    mockUseLogin.mockReturnValue(makeLoginMutation({ mutate }));
    renderForm();

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "thiago@toqe.dev" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar no painel/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha deve ter ao menos 6 caracteres"),
      ).toBeInTheDocument();
    });
    expect(mutate).not.toHaveBeenCalled();
  });

  it("dispara onTwoFaRequired quando mutation lança TwoFaRequiredError", async () => {
    const onTwoFaRequired = vi.fn();
    // Quando o submit chama mutate, simulamos o caminho de erro do TanStack
    // Query invocando o callback `onError` imediatamente com a exceção 2FA.
    const mutate = vi.fn((_data, opts) => {
      opts?.onError?.(new TwoFaRequiredError("temp-token-xyz"));
    });
    mockUseLogin.mockReturnValue(makeLoginMutation({ mutate }));
    renderForm({ onTwoFaRequired });

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "thiago@toqe.dev" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "senhaForte123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar no painel/i }));

    await waitFor(() => {
      expect(onTwoFaRequired).toHaveBeenCalledWith("temp-token-xyz");
    });
  });

  it("chama onForgotPassword ao clicar em 'Esqueci minha senha'", () => {
    const onForgotPassword = vi.fn();
    renderForm({ onForgotPassword });

    fireEvent.click(
      screen.getByRole("button", { name: /esqueci minha senha/i }),
    );

    expect(onForgotPassword).toHaveBeenCalled();
  });

  it("chama onCreateAccount ao clicar em 'Cadastrar agora'", () => {
    const onCreateAccount = vi.fn();
    renderForm({ onCreateAccount });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar agora/i }));

    expect(onCreateAccount).toHaveBeenCalled();
  });

  it("renderiza o botão Apple como desabilitado (aria-disabled)", () => {
    renderForm();

    const apple = screen.getByRole("button", { name: /apple/i });
    expect(apple).toBeDisabled();
    expect(apple).toHaveAttribute("aria-disabled", "true");
  });

  it("renderiza o banner de magic link como desabilitado", () => {
    renderForm();

    const magic = screen.getByText(/Sem senha\?/i).closest("[role=button]");
    expect(magic).not.toBeNull();
    expect(magic).toHaveAttribute("aria-disabled", "true");
  });

  it("desabilita o botão enquanto isPending", () => {
    mockUseLogin.mockReturnValue(makeLoginMutation({ isPending: true }));
    renderForm();

    const btn = screen.getByRole("button", { name: /entrando/i });
    expect(btn).toBeDisabled();
  });

  it("exibe AuthErrorBanner com mensagem quando há erro genérico", () => {
    mockUseLogin.mockReturnValue(
      makeLoginMutation({
        isError: true,
        error: new Error("Credenciais inválidas"),
      }),
    );
    renderForm();

    expect(screen.getByText("Credenciais inválidas")).toBeInTheDocument();
  });

  it("NÃO exibe AuthErrorBanner quando erro é TwoFaRequiredError", () => {
    mockUseLogin.mockReturnValue(
      makeLoginMutation({
        isError: true,
        error: new TwoFaRequiredError("tt"),
      }),
    );
    renderForm();

    // O banner não deve aparecer porque o fluxo 2FA é tratado via callback,
    // não como erro visível na tela de login.
    expect(
      screen.queryByText(/Credenciais inválidas|2FA|two/i),
    ).not.toBeInTheDocument();
  });
});
