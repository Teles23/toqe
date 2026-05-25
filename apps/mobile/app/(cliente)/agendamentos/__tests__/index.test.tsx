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
  useSegments: jest.fn(() => ["(cliente)", "agendamentos"]),
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    barbearia: { codigo: 1, nome: "Urban Flow", perfil: "cliente" },
    barbearias: [{ codigo: 1, nome: "Urban Flow", perfil: "cliente" }],
    switchBarbearia: jest.fn(),
  }),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import type { AgendamentoResponse } from "@toqe/shared";

import ClienteAgendamentosScreen from "../index";

// ─── Infra: mock APENAS o boundary HTTP (global.fetch). O api-client real,
// o hook real (useAgendamentosMeus) e a tela real são exercitados de verdade. ──

const originalFetch = global.fetch;

interface FakeResponse {
  ok: boolean;
  status: number;
  url: string;
  json: () => Promise<unknown>;
}

function makeRes(body: unknown, status = 200): FakeResponse {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/agendamentos/meus",
    json: async () => body,
  };
}

/** Resolve toda chamada GET /agendamentos/meus com o payload informado. */
function respondWith(body: unknown, status = 200) {
  global.fetch = jest.fn(async () =>
    makeRes(body, status),
  ) as unknown as typeof fetch;
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function renderScreen() {
  return render(<ClienteAgendamentosScreen />, { wrapper });
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeProximo(
  codigo: number,
  over: Partial<AgendamentoResponse> = {},
): AgendamentoResponse {
  return {
    codigo,
    inicio: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // +1 dia
    fim: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
    status: "confirmado",
    barbeiro: { usrCodigo: 10, nome: "Carlos Barbeiro", avatarUrl: null },
    cliente: {
      usrCodigo: 1,
      nome: "Cliente X",
      telefone: null,
      tipo: "usuario" as const,
      email: "cliente@x.com",
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
    ...over,
  };
}

function makeHistorico(
  codigo: number,
  over: Partial<AgendamentoResponse> = {},
): AgendamentoResponse {
  return {
    codigo,
    inicio: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // -1 dia
    fim: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    status: "concluido",
    barbeiro: { usrCodigo: 10, nome: "Carlos Barbeiro", avatarUrl: null },
    cliente: {
      usrCodigo: 1,
      nome: "Cliente X",
      telefone: null,
      tipo: "usuario" as const,
      email: "cliente@x.com",
    },
    itens: [
      {
        codigo: 2,
        servico: { codigo: 1, nome: "Barba", precoBase: 30, duracaoBase: 20 },
        preco: 30,
        duracao: 20,
      },
    ],
    criadoEm: new Date().toISOString(),
    ...over,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ClienteAgendamentosScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("mostra loading enquanto a query do hook real está pendente", () => {
    // fetch nunca resolve → useAgendamentosMeus fica em isLoading.
    global.fetch = jest.fn(
      () => new Promise<never>(() => {}),
    ) as unknown as typeof fetch;
    renderScreen();
    expect(screen.getByTestId("lista-meus-agendamentos-loading")).toBeTruthy();
  });

  it("renderiza container e abas a partir do hook real (lista vazia)", async () => {
    respondWith([]);
    renderScreen();
    await waitFor(() =>
      expect(
        screen.queryByTestId("lista-meus-agendamentos-loading"),
      ).toBeNull(),
    );
    expect(screen.getByTestId("lista-meus-agendamentos")).toBeTruthy();
    expect(screen.getByTestId("tab-proximos")).toBeTruthy();
    expect(screen.getByTestId("tab-historico")).toBeTruthy();
    expect(screen.getByText(/nenhum agendamento futuro/i)).toBeTruthy();
    // chamou o endpoint de tenant correto
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/agendamentos/meus",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("renderiza item de agendamento próximo vindo da API", async () => {
    respondWith([makeProximo(99)]);
    renderScreen();
    expect(await screen.findByTestId("apt-row-99")).toBeTruthy();
  });

  it("tap em row navega para o detalhe", async () => {
    respondWith([makeProximo(42)]);
    renderScreen();
    fireEvent.press(await screen.findByTestId("apt-row-42"));
    expect(mockPush).toHaveBeenCalledWith("/(cliente)/agendamentos/42");
  });

  it("alterna para a aba histórico e filtra passados x futuros (lógica real)", async () => {
    respondWith([makeProximo(1), makeHistorico(2)]);
    renderScreen();

    // Aba próximos: só o futuro aparece.
    expect(await screen.findByTestId("apt-row-1")).toBeTruthy();
    expect(screen.queryByTestId("apt-row-2")).toBeNull();

    // Troca para histórico: inverte.
    fireEvent.press(screen.getByTestId("tab-historico"));
    expect(screen.getByTestId("apt-row-2")).toBeTruthy();
    expect(screen.queryByTestId("apt-row-1")).toBeNull();
  });

  it("mostra vazio no histórico quando só há futuros", async () => {
    respondWith([makeProximo(1)]);
    renderScreen();
    await screen.findByTestId("apt-row-1");
    fireEvent.press(screen.getByTestId("tab-historico"));
    expect(screen.getByText(/nenhum agendamento no histórico/i)).toBeTruthy();
  });

  it("mostra erro quando a API responde 500", async () => {
    respondWith({ message: "Erro interno" }, 500);
    renderScreen();
    expect(
      await screen.findByText(/não foi possível carregar seus agendamentos/i),
    ).toBeTruthy();
  });
});
