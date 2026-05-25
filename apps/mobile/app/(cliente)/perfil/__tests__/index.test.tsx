// Perfil do cliente — exercita o hook real useAgendamentosMeus + api-client
// real. Só o boundary HTTP (global.fetch) e a sessão (useAuth) são mockados.

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("fake-access-token"),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:3000/api/v1" } },
  },
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useSegments: jest.fn(() => ["(cliente)", "perfil"]),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { Alert } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import type { AgendamentoResponse } from "@toqe/shared";

import ClientePerfilScreen from "../index";

const originalFetch = global.fetch;

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/agendamentos/meus",
    json: async () => body,
  };
}
function respondWith(body: unknown) {
  global.fetch = jest.fn(async () => makeRes(body)) as unknown as typeof fetch;
}
function neverResolve() {
  global.fetch = jest.fn(
    () => new Promise<never>(() => {}),
  ) as unknown as typeof fetch;
}
function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderScreen() {
  return render(<ClientePerfilScreen />, { wrapper });
}

function makeAuthBase(over = {}) {
  return {
    user: {
      codigo: 1,
      nome: "Maria Cliente",
      email: "maria@x.com",
      telefone: null,
      avatarUrl: null,
    },
    perfil: "cliente",
    barbearias: [
      {
        codigo: 1,
        nome: "Barbearia Centro",
        slug: "centro",
        perfil: "cliente",
      },
    ],
    barbearia: { codigo: 1, nome: "Barbearia Centro", slug: "centro" },
    switchBarbearia: jest.fn(),
    logout: jest.fn(),
    ...over,
  };
}

function makeAg(
  codigo: number,
  status: AgendamentoResponse["status"] = "concluido",
): AgendamentoResponse {
  return {
    codigo,
    inicio: new Date(Date.now() - 864e5).toISOString(),
    fim: new Date(Date.now() - 82_800_000).toISOString(),
    status,
    barbeiro: { usrCodigo: 10, nome: "Carlos Barbeiro", avatarUrl: null },
    cliente: {
      usrCodigo: 1,
      nome: "Maria Cliente",
      telefone: null,
      tipo: "usuario" as const,
      email: "maria@x.com",
    },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 50, duracaoBase: 30 },
        preco: 50,
        duracao: 30,
      },
    ],
    criadoEm: new Date().toISOString(),
  };
}

describe("ClientePerfilScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    respondWith([]);
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("renderiza nome do usuário", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    renderScreen();
    expect(screen.getByText("Maria Cliente")).toBeTruthy();
  });

  it("mostra stats com cortes feitos (da API)", async () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    respondWith([
      makeAg(1, "concluido"),
      makeAg(2, "concluido"),
      makeAg(3, "pendente"),
    ]);
    renderScreen();
    expect(await screen.findByText("2")).toBeTruthy(); // 2 concluídos
    expect(screen.getByText("1")).toBeTruthy(); // 1 barbearia (sessão)
    expect(screen.getByText("CORTES FEITOS")).toBeTruthy();
    expect(screen.getByText("BARBEARIAS")).toBeTruthy();
  });

  it("mostra traço enquanto os agendamentos não carregaram", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    neverResolve();
    renderScreen();
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("Sair pede confirmação e chama logout", () => {
    const logout = jest.fn();
    mockUseAuth.mockReturnValue(makeAuthBase({ logout }));
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_t, _m, buttons) => {
        const sair = buttons?.find((b) => b.text === "Sair");
        sair?.onPress?.();
      });

    renderScreen();
    fireEvent.press(screen.getByTestId("btn-logout"));

    expect(alertSpy).toHaveBeenCalled();
    expect(logout).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("perfil-scroll e ir-editar existem", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    renderScreen();
    expect(screen.getByTestId("perfil-scroll")).toBeTruthy();
    expect(screen.getByTestId("ir-editar")).toBeTruthy();
  });

  it("ir-senha navega para senha", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    renderScreen();
    fireEvent.press(screen.getByTestId("ir-senha"));
    expect(mockPush).toHaveBeenCalledWith("/(cliente)/perfil/senha");
  });

  it("ir-notificacoes navega para notificacoes", () => {
    mockUseAuth.mockReturnValue(makeAuthBase());
    renderScreen();
    fireEvent.press(screen.getByTestId("ir-notificacoes"));
    expect(mockPush).toHaveBeenCalledWith("/(cliente)/perfil/notificacoes");
  });
});
