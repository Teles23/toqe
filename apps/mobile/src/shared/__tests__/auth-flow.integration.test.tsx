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
import React, { useContext } from "react";
import { Text } from "react-native";

import { useAuth } from "@/src/shared/hooks/use-auth";
import {
  AuthContext,
  AuthProvider,
} from "@/src/shared/providers/auth-provider";

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
    url: "http://localhost:3000/api/v1/x",
    json: () => Promise.resolve(body),
  } as Response;
}

// Consumer mínimo — expõe a auth API e o estado via testID
let externalAuth: ReturnType<typeof useAuth> | null = null;

function AuthSpy() {
  "use no memo";
  const auth = useAuth();
  externalAuth = auth;
  // Garante presença do contexto real — não-null
  expect(useContext(AuthContext)).not.toBeNull();
  return (
    <>
      <Text testID="user-name">{auth.user?.nome ?? "anon"}</Text>
      <Text testID="loading">{auth.loading ? "loading" : "ready"}</Text>
      <Text testID="perfil">{auth.perfil ?? "none"}</Text>
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

const userMeResp = {
  codigo: 99,
  nome: "Carlos",
  email: "c@toqe.com",
  telefone: null,
  avatarUrl: null,
  barbearias: [{ codigo: 7, nome: "Toqe Centro", perfil: "barbeiro" }],
};

describe("Auth flow — integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    externalAuth = null;
    mockSS.getItemAsync.mockResolvedValue(null);
    mockSS.setItemAsync.mockResolvedValue(undefined);
    mockSS.deleteItemAsync.mockResolvedValue(undefined);
  });

  it("bootstrap sem token → loading=true → loading=false, user=null", async () => {
    mockSS.getItemAsync.mockResolvedValueOnce(null); // getAccessToken

    renderApp();

    expect(screen.getByTestId("loading").props.children).toBe("loading");

    await waitFor(() => {
      expect(screen.getByTestId("loading").props.children).toBe("ready");
    });
    expect(screen.getByTestId("user-name").props.children).toBe("anon");
  });

  it("bootstrap com token válido → carrega /usuarios/me e popula user", async () => {
    mockSS.getItemAsync.mockResolvedValueOnce("existing_access"); // getAccessToken initial
    mockFetch.mockResolvedValueOnce(jsonRes(200, userMeResp));

    renderApp();

    await waitFor(() => {
      expect(screen.getByTestId("user-name").props.children).toBe("Carlos");
    });
    expect(screen.getByTestId("perfil").props.children).toBe("barbeiro");

    // Verifica que chamou /usuarios/me
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/usuarios/me");
  });

  it("login → salva tokens → carrega /usuarios/me → redireciona por perfil", async () => {
    mockSS.getItemAsync.mockResolvedValueOnce(null); // bootstrap

    renderApp();
    await waitFor(() =>
      expect(screen.getByTestId("loading").props.children).toBe("ready"),
    );

    // Sequência de fetch após login():
    //   1. POST /auth/login → tokens
    //   2. GET /usuarios/me → user
    mockFetch
      .mockResolvedValueOnce(
        jsonRes(200, {
          access_token: "new_access",
          refresh_token: "new_refresh",
        }),
      )
      .mockResolvedValueOnce(jsonRes(200, userMeResp));

    await act(async () => {
      await externalAuth!.login("c@toqe.com", "senha123");
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-name").props.children).toBe("Carlos");
    });

    expect(mockSS.setItemAsync).toHaveBeenCalledWith(
      "toqe_access_token",
      "new_access",
    );
    expect(mockSS.setItemAsync).toHaveBeenCalledWith(
      "toqe_refresh_token",
      "new_refresh",
    );
    // Perfil BARBEIRO → redireciona para /(barbeiro)/agenda
    expect(mockRouterReplace).toHaveBeenCalledWith("/(barbeiro)/agenda");
  });

  it("logout → chama /auth/logout → limpa tokens → redireciona para login", async () => {
    // Boot com sessão ativa
    mockSS.getItemAsync.mockResolvedValueOnce("existing_access"); // bootstrap access
    mockFetch.mockResolvedValueOnce(jsonRes(200, userMeResp)); // bootstrap /me

    renderApp();
    await waitFor(() =>
      expect(screen.getByTestId("user-name").props.children).toBe("Carlos"),
    );

    // logout: getRefreshToken + POST /auth/logout
    mockSS.getItemAsync.mockResolvedValueOnce("refresh_xyz"); // getRefreshToken
    mockFetch.mockResolvedValueOnce(jsonRes(204, null)); // POST /auth/logout

    await act(async () => {
      await externalAuth!.logout();
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-name").props.children).toBe("anon");
    });

    expect(mockSS.deleteItemAsync).toHaveBeenCalledWith("toqe_access_token");
    expect(mockSS.deleteItemAsync).toHaveBeenCalledWith("toqe_refresh_token");
    expect(mockRouterReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("logout limpa tokens mesmo se /auth/logout falhar (ApiError)", async () => {
    // Boot
    mockSS.getItemAsync.mockResolvedValueOnce("existing_access");
    mockFetch.mockResolvedValueOnce(jsonRes(200, userMeResp));
    renderApp();
    await waitFor(() =>
      expect(screen.getByTestId("user-name").props.children).toBe("Carlos"),
    );

    // logout: getRefreshToken + POST /auth/logout responde 500
    mockSS.getItemAsync.mockResolvedValueOnce("refresh_xyz");
    mockFetch.mockResolvedValueOnce(jsonRes(500, { error: "boom" }));

    await act(async () => {
      await externalAuth!.logout();
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-name").props.children).toBe("anon");
    });
    expect(mockSS.deleteItemAsync).toHaveBeenCalledWith("toqe_access_token");
    expect(mockSS.deleteItemAsync).toHaveBeenCalledWith("toqe_refresh_token");
  });

  it("bootstrap com token mas /usuarios/me retorna 401 → limpa tokens e redireciona para login", async () => {
    // Simula token salvo mas inválido/usuário inativo
    mockSS.getItemAsync.mockResolvedValueOnce("stale_access"); // getAccessToken
    // /usuarios/me responde 401 (token expirado sem refresh disponível)
    mockFetch.mockResolvedValueOnce(jsonRes(401, { message: "Unauthorized" }));
    // Tentativa de refresh também falha
    mockSS.getItemAsync.mockResolvedValueOnce(null); // getRefreshToken retorna null

    renderApp();

    await waitFor(() => {
      expect(screen.getByTestId("loading").props.children).toBe("ready");
    });

    // Tokens devem ser limpos
    expect(mockSS.deleteItemAsync).toHaveBeenCalledWith("toqe_access_token");
    expect(mockSS.deleteItemAsync).toHaveBeenCalledWith("toqe_refresh_token");
    // Usuário não autenticado
    expect(screen.getByTestId("user-name").props.children).toBe("anon");
    // Redirecionado para login
    expect(mockRouterReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("switchBarbearia troca barbearia ativa + perfil", async () => {
    // Boot com usuário que tem 2 barbearias
    mockSS.getItemAsync.mockResolvedValueOnce("existing_access");
    mockFetch.mockResolvedValueOnce(
      jsonRes(200, {
        ...userMeResp,
        barbearias: [
          { codigo: 7, nome: "Centro", perfil: "barbeiro" },
          { codigo: 8, nome: "Norte", perfil: "dono" },
        ],
      }),
    );

    renderApp();
    await waitFor(() =>
      expect(screen.getByTestId("perfil").props.children).toBe("barbeiro"),
    );

    act(() => {
      externalAuth!.switchBarbearia(8);
    });

    await waitFor(() =>
      expect(screen.getByTestId("perfil").props.children).toBe("dono"),
    );
  });
});
