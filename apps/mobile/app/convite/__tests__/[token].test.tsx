// Convite — exercita os hooks reais (useConvite, useAceitarConvite,
// useRejeitarConvite) + api-client real. Só o boundary HTTP (global.fetch) e a
// sessão (useAuth.establishSession) são mockados.

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:3000/api/v1" } },
  },
}));

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ token: "abc123" })),
}));

const mockEstablishSession = jest.fn().mockResolvedValue(null);
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({ establishSession: mockEstablishSession }),
}));

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { router } from "expo-router";

import ConviteTokenScreen from "../[token]";

const originalFetch = global.fetch;

const validConvite = {
  token: "abc123",
  barbeariaNome: "Urban Flow Barber",
  barbeariaSlug: "urban-flow",
  email: "joao@test.com",
  perfil: "barbeiro",
  expiresAt: "2026-06-01T00:00:00Z",
  isNew: true,
};

const aceitarOk = {
  access_token: "acc",
  refresh_token: "ref",
  user: { codigo: 1, nome: "Carlos Mendes", email: "joao@test.com" },
  isNew: true,
  barbeariaNome: "Urban Flow Barber",
};

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/convite/abc123",
    json: async () => body,
  };
}

const releasePendingRequests: (() => void)[] = [];

function makePendingResponse() {
  return new Promise<Response>((_resolve, reject) => {
    releasePendingRequests.push(() => reject(new Error("test cleanup")));
  });
}

/** Roteia GET/POST/DELETE em /convite/:token. `convite` é o GET; `aceitar`
 *  controla o POST (`"ok"` resolve, `"hang"` fica pendente). */
function setupFetch(opts: {
  conviteStatus?: number;
  convite?: unknown;
  aceitar?: "ok" | "hang";
}) {
  const { conviteStatus = 200, convite = validConvite, aceitar = "ok" } = opts;
  global.fetch = jest.fn(async (url: unknown, init?: { method?: string }) => {
    const u = String(url);
    const m = (init?.method ?? "GET").toUpperCase();
    if (m === "POST" && u.includes("/aceitar")) {
      if (aceitar === "hang") return makePendingResponse();
      return makeRes(aceitarOk);
    }
    if (m === "DELETE") return makeRes({ sucesso: true });
    if (m === "GET" && u.includes("/convite/")) {
      return makeRes(convite, conviteStatus);
    }
    return makeRes(null);
  }) as unknown as typeof fetch;
}

const queryClients: QueryClient[] = [];

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  queryClients.push(client);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderScreen() {
  return render(<ConviteTokenScreen />, { wrapper });
}

describe("ConviteTokenScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEstablishSession.mockResolvedValue(null);
  });
  afterEach(async () => {
    await act(async () => {
      while (releasePendingRequests.length > 0) {
        releasePendingRequests.pop()?.();
      }
      await Promise.resolve();
    });
    queryClients.splice(0).forEach((client) => client.clear());
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("1. mostra loading enquanto a query do convite está pendente", () => {
    global.fetch = jest.fn(() => makePendingResponse()) as unknown as typeof fetch;
    renderScreen();
    expect(screen.queryByTestId("convite-expirado")).toBeNull();
    expect(screen.queryByTestId("convite-landing")).toBeNull();
  });

  it("2. mostra convite-expirado quando a API erra (500)", async () => {
    setupFetch({ conviteStatus: 500, convite: { message: "erro" } });
    renderScreen();
    expect(await screen.findByTestId("convite-expirado")).toBeTruthy();
  });

  it("3. mostra convite-expirado quando a API responde 404 (null)", async () => {
    setupFetch({ conviteStatus: 404, convite: { message: "not found" } });
    renderScreen();
    expect(await screen.findByTestId("convite-expirado")).toBeTruthy();
  });

  it("4. mostra convite-landing quando o convite é válido", async () => {
    setupFetch({});
    renderScreen();
    expect(await screen.findByTestId("convite-landing")).toBeTruthy();
  });

  it("5. landing mostra nome da barbearia no título editorial", async () => {
    setupFetch({});
    renderScreen();
    // O nome agora vive dentro da headline "{nome} quer você na equipe."
    expect(
      await screen.findByText(/Urban Flow Barber quer você na equipe\./),
    ).toBeTruthy();
  });

  it("6. landing mostra o e-mail do convite", async () => {
    setupFetch({});
    renderScreen();
    expect(await screen.findByText("joao@test.com")).toBeTruthy();
  });

  it("7. Aceitar convite mostra input-nome + input-senha (usuário novo)", async () => {
    setupFetch({});
    renderScreen();
    fireEvent.press(await screen.findByText("Aceitar convite"));
    expect(screen.getByTestId("input-nome")).toBeTruthy();
    expect(screen.getByTestId("input-senha")).toBeTruthy();
  });

  it("8. usuário existente (isNew=false) mostra só input-senha", async () => {
    setupFetch({ convite: { ...validConvite, isNew: false } });
    renderScreen();
    fireEvent.press(await screen.findByText("Aceitar convite"));
    expect(screen.queryByTestId("input-nome")).toBeNull();
    expect(screen.getByTestId("input-senha")).toBeTruthy();
  });

  it("9. btn-aceitar mostra estado convite-accepting", async () => {
    setupFetch({ aceitar: "hang" });
    renderScreen();
    fireEvent.press(await screen.findByText("Aceitar convite"));
    // isNew=true exige nome e senha válidos (validação client-side)
    fireEvent.changeText(screen.getByTestId("input-nome"), "Carlos Lima");
    fireEvent.changeText(screen.getByTestId("input-senha"), "senha12345");
    fireEvent.press(screen.getByTestId("btn-aceitar"));
    expect(await screen.findByTestId("convite-accepting")).toBeTruthy();
  });

  it("10. sucesso faz auto-login (establishSession) e mostra boas-vindas", async () => {
    setupFetch({ aceitar: "ok" });
    renderScreen();
    fireEvent.press(await screen.findByText("Aceitar convite"));
    fireEvent.changeText(screen.getByTestId("input-nome"), "Carlos Lima");
    fireEvent.changeText(screen.getByTestId("input-senha"), "senha12345");
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-aceitar"));
    });

    await waitFor(() =>
      expect(mockEstablishSession).toHaveBeenCalledWith("acc", "ref"),
    );
    expect(await screen.findByTestId("convite-success")).toBeTruthy();
    expect(screen.getByText(/Bem-vindo/)).toBeTruthy();
  });

  it("11. boas-vindas → 'Ver minha agenda' navega para a agenda", async () => {
    setupFetch({ aceitar: "ok" });
    renderScreen();
    fireEvent.press(await screen.findByText("Aceitar convite"));
    fireEvent.changeText(screen.getByTestId("input-nome"), "Carlos Lima");
    fireEvent.changeText(screen.getByTestId("input-senha"), "senha12345");
    await act(async () => {
      fireEvent.press(screen.getByTestId("btn-aceitar"));
    });
    fireEvent.press(await screen.findByText("Ver minha agenda"));
    expect(router.replace).toHaveBeenCalledWith("/(barbeiro)/agenda");
  });

  it("12. btn-voltar-convite chama router.back()", async () => {
    setupFetch({});
    renderScreen();
    fireEvent.press(await screen.findByTestId("btn-voltar-convite"));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("13. rejeitar convite faz DELETE /convite/abc123 e volta", async () => {
    setupFetch({});
    renderScreen();
    fireEvent.press(await screen.findByTestId("btn-rejeitar"));
    expect(router.back).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      const del = (global.fetch as jest.Mock).mock.calls.find(
        ([u, init]) =>
          /\/convite\/abc123$/.test(String(u)) &&
          (init as { method?: string })?.method === "DELETE",
      );
      expect(del).toBeTruthy();
    });
  });

  // ── Validação client-side ──────────────────────────────────────────────────

  it("14. bloqueia submit com nome vazio (isNew) sem chamar a API", async () => {
    setupFetch({});
    renderScreen();
    fireEvent.press(await screen.findByText("Aceitar convite"));

    // Nome vazio, senha válida (>= 8)
    fireEvent.changeText(screen.getByTestId("input-senha"), "senha12345");
    fireEvent.press(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(
        screen.getByText("Nome deve ter ao menos 2 caracteres."),
      ).toBeTruthy(),
    );
    // API não foi chamada
    const postCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([, init]) => (init as { method?: string })?.method === "POST",
    );
    expect(postCalls).toHaveLength(0);
  });

  it("15. bloqueia submit com senha < 8 chars sem chamar a API", async () => {
    setupFetch({ convite: { ...validConvite, isNew: false } });
    renderScreen();
    fireEvent.press(await screen.findByText("Aceitar convite"));

    fireEvent.changeText(screen.getByTestId("input-senha"), "abc");
    fireEvent.press(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(
        screen.getByText("Senha de ao menos 8 caracteres."),
      ).toBeTruthy(),
    );
    const postCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([, init]) => (init as { method?: string })?.method === "POST",
    );
    expect(postCalls).toHaveLength(0);
  });

  it("16. erro 400 da API exibe a mensagem real (não hardcoded)", async () => {
    global.fetch = jest.fn(async (url: unknown, init?: { method?: string }) => {
      const u = String(url);
      const m = (init?.method ?? "GET").toUpperCase();
      if (m === "POST" && u.includes("/aceitar")) {
        return makeRes({ message: "Mensagem real do servidor" }, 400);
      }
      if (m === "GET") {
        return makeRes({ ...validConvite, isNew: false });
      }
      return makeRes(null);
    }) as unknown as typeof fetch;

    renderScreen();
    fireEvent.press(await screen.findByText("Aceitar convite"));
    fireEvent.changeText(screen.getByTestId("input-senha"), "senha12345");
    fireEvent.press(screen.getByTestId("btn-aceitar"));

    await waitFor(() =>
      expect(screen.getByText("Mensagem real do servidor")).toBeTruthy(),
    );
  });
});
