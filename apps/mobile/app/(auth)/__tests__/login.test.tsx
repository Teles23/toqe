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

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
  },
}));

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { ApiError } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";
import LoginScreen from "../login";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGoogleSignIn = GoogleSignin.signIn as jest.MockedFunction<
  typeof GoogleSignin.signIn
>;

function makeAuthValue(
  overrides: Partial<{ login: jest.Mock; loginWithGoogle: jest.Mock }> = {},
) {
  return {
    user: null,
    barbearia: null,
    perfil: null,
    barbearias: [],
    loading: false,
    login: jest.fn().mockResolvedValue(undefined),
    loginWithGoogle: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn(),
    switchBarbearia: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAuth>;
}

describe("LoginScreen", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockGoogleSignIn.mockReset();
  });

  it("renderiza os campos e o botão", () => {
    mockUseAuth.mockReturnValue(makeAuthValue());
    render(<LoginScreen />);

    expect(screen.getByLabelText("E-mail")).toBeTruthy();
    expect(screen.getByLabelText("Senha")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
  });

  it("chama useAuth().login com email e senha do formulário", async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(makeAuthValue({ login }));

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("E-mail"), "a@b.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Entrar" }));
    });

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("a@b.com", "senha123");
    });
  });

  it("mostra erro de credencial em 401", async () => {
    const login = jest
      .fn()
      .mockRejectedValue(new ApiError(401, "Unauthorized"));
    mockUseAuth.mockReturnValue(makeAuthValue({ login }));

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("E-mail"), "a@b.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Entrar" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/E-mail ou senha incorretos/i)).toBeTruthy();
    });
  });

  it("mostra erro de servidor em 5xx", async () => {
    const login = jest
      .fn()
      .mockRejectedValue(new ApiError(500, "Server Error"));
    mockUseAuth.mockReturnValue(makeAuthValue({ login }));

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("E-mail"), "a@b.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Entrar" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Erro no servidor/i)).toBeTruthy();
    });
  });

  it("mostra erro genérico de conexão em erro não-API", async () => {
    const login = jest
      .fn()
      .mockRejectedValue(new TypeError("Network request failed"));
    mockUseAuth.mockReturnValue(makeAuthValue({ login }));

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("E-mail"), "a@b.com");
    fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Entrar" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Sem conexão/i)).toBeTruthy();
    });
  });

  // ─── Google Sign-In ─────────────────────────────────────────────────────
  // Mock só na fronteira nativa (GoogleSignin) — handler real (onGoogle) é
  // exercitado, useAuth.loginWithGoogle é o spy do contexto.

  describe("Google", () => {
    it("renderiza botão 'Entrar com Google'", () => {
      mockUseAuth.mockReturnValue(makeAuthValue());
      render(<LoginScreen />);
      expect(
        screen.getByRole("button", { name: "Entrar com Google" }),
      ).toBeTruthy();
    });

    it("chama loginWithGoogle com idToken quando Google retorna sucesso", async () => {
      const loginWithGoogle = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue(makeAuthValue({ loginWithGoogle }));
      // SDK retorna idToken no topo (versões mais antigas)
      mockGoogleSignIn.mockResolvedValueOnce({
        idToken: "fake_google_id_token",
      } as unknown as Awaited<ReturnType<typeof GoogleSignin.signIn>>);

      render(<LoginScreen />);
      await act(async () => {
        fireEvent.press(
          screen.getByRole("button", { name: "Entrar com Google" }),
        );
      });

      await waitFor(() => {
        expect(loginWithGoogle).toHaveBeenCalledWith("fake_google_id_token");
      });
    });

    it("aceita formato novo do SDK com idToken dentro de `data`", async () => {
      const loginWithGoogle = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue(makeAuthValue({ loginWithGoogle }));
      mockGoogleSignIn.mockResolvedValueOnce({
        data: { idToken: "novo_formato_token" },
      } as unknown as Awaited<ReturnType<typeof GoogleSignin.signIn>>);

      render(<LoginScreen />);
      await act(async () => {
        fireEvent.press(
          screen.getByRole("button", { name: "Entrar com Google" }),
        );
      });

      await waitFor(() => {
        expect(loginWithGoogle).toHaveBeenCalledWith("novo_formato_token");
      });
    });

    it("sem idToken retornado → mensagem 'Falha ao obter token Google'", async () => {
      mockUseAuth.mockReturnValue(makeAuthValue());
      mockGoogleSignIn.mockResolvedValueOnce(
        {} as Awaited<ReturnType<typeof GoogleSignin.signIn>>,
      );

      render(<LoginScreen />);
      await act(async () => {
        fireEvent.press(
          screen.getByRole("button", { name: "Entrar com Google" }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Falha ao obter token Google/i)).toBeTruthy();
      });
    });

    it("erro 401 do backend → 'Conta Google não autorizada'", async () => {
      const loginWithGoogle = jest
        .fn()
        .mockRejectedValue(new ApiError(401, "Unauthorized"));
      mockUseAuth.mockReturnValue(makeAuthValue({ loginWithGoogle }));
      mockGoogleSignIn.mockResolvedValueOnce({
        idToken: "fake",
      } as unknown as Awaited<ReturnType<typeof GoogleSignin.signIn>>);

      render(<LoginScreen />);
      await act(async () => {
        fireEvent.press(
          screen.getByRole("button", { name: "Entrar com Google" }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Conta Google não autorizada/i)).toBeTruthy();
      });
    });

    it("usuário cancela Google sign-in → mensagem genérica", async () => {
      mockUseAuth.mockReturnValue(makeAuthValue());
      mockGoogleSignIn.mockRejectedValueOnce(new Error("USER_CANCELLED"));

      render(<LoginScreen />);
      await act(async () => {
        fireEvent.press(
          screen.getByRole("button", { name: "Entrar com Google" }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Falha no login Google/i)).toBeTruthy();
      });
    });
  });
});
