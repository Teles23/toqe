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

async function fillAndSubmit(opts: { senha?: string; confirma?: string } = {}) {
  const senha = opts.senha ?? "senha123";
  const confirma = opts.confirma ?? senha;
  fireEvent.changeText(screen.getByLabelText("Nome"), "Carlos");
  fireEvent.changeText(screen.getByLabelText("E-mail"), "novo@toqe.com");
  fireEvent.changeText(screen.getByLabelText("Telefone"), "+5511999999999");
  fireEvent.changeText(screen.getByLabelText("Senha"), senha);
  fireEvent.changeText(screen.getByLabelText("Confirmar senha"), confirma);
  await act(async () => {
    fireEvent.press(screen.getByRole("button", { name: "Criar conta" }));
  });
}

describe("CadastroScreen", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockApiPost.mockReset();
  });

  it("renderiza todos os 5 campos + botão", () => {
    mockUseAuth.mockReturnValue(makeAuthValue());
    render(<CadastroScreen />);

    expect(screen.getByLabelText("Nome")).toBeTruthy();
    expect(screen.getByLabelText("E-mail")).toBeTruthy();
    expect(screen.getByLabelText("Telefone")).toBeTruthy();
    expect(screen.getByLabelText("Senha")).toBeTruthy();
    expect(screen.getByLabelText("Confirmar senha")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Criar conta" })).toBeTruthy();
  });

  it("mostra erro de validação quando senhas não coincidem", async () => {
    mockUseAuth.mockReturnValue(makeAuthValue());
    render(<CadastroScreen />);

    await fillAndSubmit({ senha: "senha123", confirma: "outra456" });

    await waitFor(() => {
      expect(screen.getByText(/senhas não coincidem/i)).toBeTruthy();
    });
    // Não deve chamar a API se a validação local falhou
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("submete /auth/register e faz login automático em sucesso", async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(makeAuthValue({ login }));
    mockApiPost.mockResolvedValueOnce({});

    render(<CadastroScreen />);
    await fillAndSubmit();

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/auth/register", {
        nome: "Carlos",
        email: "novo@toqe.com",
        senha: "senha123",
        telefone: "+5511999999999",
      });
    });
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("novo@toqe.com", "senha123");
    });
  });

  it("não envia telefone vazio (envia undefined para a API)", async () => {
    mockUseAuth.mockReturnValue(makeAuthValue());
    mockApiPost.mockResolvedValueOnce({});

    render(<CadastroScreen />);
    fireEvent.changeText(screen.getByLabelText("Nome"), "Carlos");
    fireEvent.changeText(screen.getByLabelText("E-mail"), "novo@toqe.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    fireEvent.changeText(screen.getByLabelText("Confirmar senha"), "senha123");
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Criar conta" }));
    });

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "/auth/register",
        expect.objectContaining({ telefone: undefined }),
      );
    });
  });

  it("em 409, marca erro no campo email", async () => {
    mockUseAuth.mockReturnValue(makeAuthValue());
    mockApiPost.mockRejectedValueOnce(new ApiError(409, "Conflict"));

    render(<CadastroScreen />);
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/já está cadastrado/i)).toBeTruthy();
    });
  });

  it("em 5xx, mostra erro global de servidor", async () => {
    mockUseAuth.mockReturnValue(makeAuthValue());
    mockApiPost.mockRejectedValueOnce(new ApiError(500, "Server Error"));

    render(<CadastroScreen />);
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/Erro no servidor/i)).toBeTruthy();
    });
  });
});
