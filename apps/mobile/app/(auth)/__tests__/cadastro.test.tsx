jest.mock("expo-router", () => {
  function Link({ children }: { children: React.ReactNode }) {
    return children as React.ReactElement;
  }
  return {
    Link,
    router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  };
});

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:3000/api/v1" } },
  },
}));

jest.mock("@/src/shared/api/api-client", () => {
  // Reusa a ApiError real para que `instanceof` funcione no componente
  const actual = jest.requireActual("@/src/shared/api/api-client");
  return {
    ...actual,
    api: {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
  };
});

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: jest.fn(),
}));

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import { api, ApiError } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

import CadastroScreen from "../cadastro";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockApiPost = api.post as jest.MockedFunction<typeof api.post>;

function makeAuthValue(overrides: Partial<{ login: jest.Mock }> = {}) {
  return {
    user: null,
    barbearia: null,
    perfil: null,
    barbearias: [],
    loading: false,
    login: jest.fn().mockResolvedValue(undefined),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
    switchBarbearia: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAuth>;
}

/**
 * Caminha do step 1 ao step 3 preenchendo todos os campos. Útil para os
 * testes de submit (409/5xx/sucesso) que precisam do form completo.
 */
async function walkThroughSteps(
  opts: {
    email?: string;
    senha?: string;
    confirma?: string;
    nome?: string;
    telefone?: string;
  } = {},
) {
  const email = opts.email ?? "novo@toqe.com";
  const senha = opts.senha ?? "senha123";
  const confirma = opts.confirma ?? senha;
  const nome = opts.nome ?? "Carlos";
  const telefone = opts.telefone ?? "11999999999";

  // Step 1: email + senha + confirmar
  fireEvent.changeText(screen.getByLabelText("E-mail"), email);
  fireEvent.changeText(screen.getByLabelText("Senha"), senha);
  fireEvent.changeText(screen.getByLabelText("Confirmar senha"), confirma);
  await act(async () => {
    fireEvent.press(screen.getByTestId("continuar-step-1"));
  });

  // Step 2: nome + telefone (opcional)
  await waitFor(() => {
    expect(screen.getByTestId("cadastro-step-2")).toBeTruthy();
  });
  fireEvent.changeText(screen.getByLabelText("Nome completo"), nome);
  if (telefone) {
    fireEvent.changeText(screen.getByLabelText("Telefone"), telefone);
  }
  await act(async () => {
    fireEvent.press(screen.getByTestId("continuar-step-2"));
  });

  // Step 3: submit
  await waitFor(() => {
    expect(screen.getByTestId("cadastro-step-3")).toBeTruthy();
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId("criar-conta"));
  });
}

describe("CadastroScreen — fluxo de 3 steps", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockApiPost.mockReset();
    mockUseAuth.mockReturnValue(makeAuthValue());
  });

  it("step 1 mostra email e senha; não mostra nome nem toggle de tipo", () => {
    render(<CadastroScreen />);
    expect(screen.getByTestId("cadastro-step-1")).toBeTruthy();
    expect(screen.getByLabelText("E-mail")).toBeTruthy();
    expect(screen.getByLabelText("Senha")).toBeTruthy();
    expect(screen.getByLabelText("Confirmar senha")).toBeTruthy();
    // step 2 e 3 escondidos
    expect(screen.queryByLabelText("Nome completo")).toBeNull();
    expect(screen.queryByRole("button", { name: "Cliente" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Barbeiro" })).toBeNull();
  });

  it("botão Continuar do step 1 não avança se campos vazios", async () => {
    render(<CadastroScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId("continuar-step-1"));
    });
    // continua no step 1 — campo nome NÃO aparece
    expect(screen.queryByLabelText("Nome completo")).toBeNull();
    expect(screen.getByTestId("cadastro-step-1")).toBeTruthy();
  });

  it("Continuar do step 1 NÃO avança quando senhas não coincidem", async () => {
    render(<CadastroScreen />);
    fireEvent.changeText(screen.getByLabelText("E-mail"), "x@x.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "outra456");
    await act(async () => {
      fireEvent.press(screen.getByTestId("continuar-step-1"));
    });

    await waitFor(() => {
      expect(screen.getByText(/senhas não coincidem/i)).toBeTruthy();
    });
    // Continua no step 1
    expect(screen.queryByLabelText("Nome completo")).toBeNull();
    // E não chamou a API
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("step 2 mostra campo nome após Continuar válido no step 1", async () => {
    render(<CadastroScreen />);
    fireEvent.changeText(screen.getByLabelText("E-mail"), "novo@toqe.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "senha123");
    await act(async () => {
      fireEvent.press(screen.getByTestId("continuar-step-1"));
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Nome completo")).toBeTruthy();
    });
    expect(screen.getByTestId("cadastro-step-2")).toBeTruthy();
    // campos do step 1 não aparecem mais
    expect(screen.queryByLabelText("E-mail")).toBeNull();
  });

  it("step 3 mostra toggle Cliente/Barbeiro + botão Criar conta", async () => {
    render(<CadastroScreen />);
    fireEvent.changeText(screen.getByLabelText("E-mail"), "novo@toqe.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "senha123");
    await act(async () => {
      fireEvent.press(screen.getByTestId("continuar-step-1"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("cadastro-step-2")).toBeTruthy(),
    );
    fireEvent.changeText(screen.getByLabelText("Nome completo"), "Carlos");
    await act(async () => {
      fireEvent.press(screen.getByTestId("continuar-step-2"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("cadastro-step-3")).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: "Cliente" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Barbeiro" })).toBeTruthy();
    expect(screen.getByTestId("criar-conta")).toBeTruthy();
    // botão Continuar não existe mais — é Criar conta
    expect(screen.queryByTestId("continuar-step-1")).toBeNull();
    expect(screen.queryByTestId("continuar-step-2")).toBeNull();
  });

  it("toggle muda a opção selecionada ao pressionar", async () => {
    render(<CadastroScreen />);
    // navega até o step 3
    fireEvent.changeText(screen.getByLabelText("E-mail"), "x@x.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "senha123");
    await act(async () => {
      fireEvent.press(screen.getByTestId("continuar-step-1"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("cadastro-step-2")).toBeTruthy(),
    );
    fireEvent.changeText(screen.getByLabelText("Nome completo"), "Yago");
    await act(async () => {
      fireEvent.press(screen.getByTestId("continuar-step-2"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("cadastro-step-3")).toBeTruthy(),
    );

    // default = cliente
    expect(
      screen.getByRole("button", { name: "Cliente" }).props.accessibilityState
        .selected,
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Barbeiro" }).props.accessibilityState
        .selected,
    ).toBe(false);

    // troca para barbeiro
    fireEvent.press(screen.getByRole("button", { name: "Barbeiro" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Barbeiro" }).props
          .accessibilityState.selected,
      ).toBe(true);
    });
    expect(
      screen.getByRole("button", { name: "Cliente" }).props.accessibilityState
        .selected,
    ).toBe(false);
  });

  it("submete /auth/register e faz login automático em sucesso", async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(makeAuthValue({ login }));
    mockApiPost.mockResolvedValueOnce({});

    render(<CadastroScreen />);
    await walkThroughSteps();

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/auth/register", {
        nome: "Carlos",
        email: "novo@toqe.com",
        senha: "senha123",
        telefone: "(11) 99999-9999",
      });
    });
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("novo@toqe.com", "senha123");
    });
  });

  it("não envia telefone vazio (envia undefined para a API)", async () => {
    mockApiPost.mockResolvedValueOnce({});

    render(<CadastroScreen />);
    await walkThroughSteps({ telefone: "" });

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "/auth/register",
        expect.objectContaining({ telefone: undefined }),
      );
    });
  });

  it("em 409, marca erro no campo email e volta para step 1", async () => {
    mockApiPost.mockRejectedValueOnce(new ApiError(409, "Conflict"));

    render(<CadastroScreen />);
    await walkThroughSteps();

    await waitFor(() => {
      expect(screen.getByText(/já está cadastrado/i)).toBeTruthy();
    });
    // Volta para o step 1 (onde o erro mora)
    expect(screen.getByTestId("cadastro-step-1")).toBeTruthy();
  });

  it("em 5xx, mostra erro global de servidor", async () => {
    mockApiPost.mockRejectedValueOnce(new ApiError(500, "Server Error"));

    render(<CadastroScreen />);
    await walkThroughSteps();

    await waitFor(() => {
      expect(screen.getByText(/Erro no servidor/i)).toBeTruthy();
    });
  });

  it("Voltar do step 2 retorna para step 1 preservando email", async () => {
    render(<CadastroScreen />);
    fireEvent.changeText(screen.getByLabelText("E-mail"), "tmp@x.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "senha123");
    await act(async () => {
      fireEvent.press(screen.getByTestId("continuar-step-1"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("cadastro-step-2")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("voltar-step-2"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("cadastro-step-1")).toBeTruthy(),
    );
    // valor do email preservado pelo react-hook-form
    expect(
      (
        screen.getByLabelText("E-mail") as unknown as {
          props: { value: string };
        }
      ).props.value,
    ).toBe("tmp@x.com");
  });
});
