// Integração: AuthProvider real + api-client real + SecureStore mockado.
// Exercita o fluxo loginWithGoogle ponta-a-ponta, sem mockar o SUT.

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

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));

import { act, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Text } from "react-native";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { AuthProvider } from "@/src/shared/providers/auth-provider";

const mockSS = SecureStore as jest.Mocked<typeof SecureStore>;
const mockRouterReplace = router.replace as jest.MockedFunction<
  typeof router.replace
>;

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function jsonRes(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    url: "http://localhost:3000/api/v1/auth/google",
    json: () => Promise.resolve(body),
  } as Response;
}

let externalAuth: ReturnType<typeof useAuth> | null = null;

function AuthSpy() {
  const auth = useAuth();
  externalAuth = auth;
  return (
    <>
      <Text testID="user-name">{auth.user?.nome ?? "anon"}</Text>
      <Text testID="loading">{auth.loading ? "loading" : "ready"}</Text>
    </>
  );
}

function renderApp() {
  return render(
    <AuthProvider>
      <AuthSpy />
    </AuthProvider>,
  );
}

describe("Auth flow Google — integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    externalAuth = null;
    mockSS.getItemAsync.mockResolvedValue(null);
    mockSS.setItemAsync.mockResolvedValue(undefined);
    mockSS.deleteItemAsync.mockResolvedValue(undefined);
  });

  it("loginWithGoogle → POST /auth/google → salva tokens → carrega /me → redirect", async () => {
    renderApp();
    await waitFor(() =>
      expect(screen.getByTestId("loading").props.children).toBe("ready"),
    );

    // Sequência real de fetch:
    //   1. POST /auth/google → tokens
    //   2. GET /usuarios/me → user
    mockFetch
      .mockResolvedValueOnce(
        jsonRes(200, {
          access_token: "google_access",
          refresh_token: "google_refresh",
        }),
      )
      .mockResolvedValueOnce(
        jsonRes(200, {
          codigo: 77,
          nome: "Carlos Google",
          email: "carlos@gmail.com",
          telefone: null,
          avatarUrl: "https://avatar/x.png",
          barbearias: [{ codigo: 9, nome: "Centro", perfil: "cliente" }],
        }),
      );

    await act(async () => {
      await externalAuth!.loginWithGoogle("fake_google_id_token");
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-name").props.children).toBe(
        "Carlos Google",
      );
    });

    // Tokens salvos no SecureStore (cobre fluxo real do api-client)
    expect(mockSS.setItemAsync).toHaveBeenCalledWith(
      "toqe_access_token",
      "google_access",
    );
    expect(mockSS.setItemAsync).toHaveBeenCalledWith(
      "toqe_refresh_token",
      "google_refresh",
    );

    // Perfil cliente → redireciona para home do cliente
    expect(mockRouterReplace).toHaveBeenCalledWith("/(cliente)/home");

    // Verifica que a 1ª chamada foi de fato para /auth/google com idToken
    const firstCall = mockFetch.mock.calls[0];
    expect(firstCall[0] as string).toContain("/auth/google");
    const body = JSON.parse((firstCall[1] as { body: string }).body) as Record<
      string,
      unknown
    >;
    expect(body.idToken).toBe("fake_google_id_token");
  });

  it("primeiro login Google sem barbearia vinculada → redireciona para cliente/home", async () => {
    // Cenário real do bug: usuário recém-criado via Google ainda não tem
    // UsuarioBarbearia. Backend retorna barbearias: [] e o app DEVE cair em
    // cliente/home (não voltar ao login).
    renderApp();
    await waitFor(() =>
      expect(screen.getByTestId("loading").props.children).toBe("ready"),
    );

    mockFetch
      .mockResolvedValueOnce(
        jsonRes(200, {
          access_token: "google_access",
          refresh_token: "google_refresh",
        }),
      )
      .mockResolvedValueOnce(
        jsonRes(200, {
          codigo: 385,
          nome: "Novo Usuario",
          email: "novo@gmail.com",
          telefone: null,
          avatarUrl: null,
          barbearias: [],
        }),
      );

    await act(async () => {
      await externalAuth!.loginWithGoogle("fake_google_id_token");
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-name").props.children).toBe(
        "Novo Usuario",
      );
    });

    expect(mockSS.setItemAsync).toHaveBeenCalledWith(
      "toqe_access_token",
      "google_access",
    );
    // Sem vínculo de barbearia → perfil null → cai em cliente/home, NÃO no login
    expect(mockRouterReplace).toHaveBeenCalledWith("/(cliente)/home");
    expect(mockRouterReplace).not.toHaveBeenCalledWith("/(auth)/login");
  });

  it("backend retorna 401 (idToken inválido) → propaga ApiError, sem salvar tokens", async () => {
    renderApp();
    await waitFor(() =>
      expect(screen.getByTestId("loading").props.children).toBe("ready"),
    );

    mockFetch.mockResolvedValueOnce(
      jsonRes(401, { message: "ID token Google inválido" }),
    );

    await expect(
      act(async () => {
        await externalAuth!.loginWithGoogle("bad_token");
      }),
    ).rejects.toThrow();

    // SecureStore NÃO deve ter sido chamado para salvar
    expect(mockSS.setItemAsync).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
