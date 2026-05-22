// Detalhe do agendamento — exercita os hooks reais (useAgendamento /
// useCancelarAgendamento) + api-client real. Só o boundary HTTP (global.fetch)
// e a sessão (useAuth) são mockados.

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

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  router: { back: mockBack, replace: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ codigo: "42" })),
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({ barbearia: { codigo: 1 } }),
}));

import { Alert } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import type { AgendamentoResponse } from "@toqe/shared";

import AgendamentoDetalheScreen from "../[codigo]";

const originalFetch = global.fetch;

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/agendamentos/42",
    json: async () => body,
  };
}

function setupFetch(opts: { ag?: unknown; agStatus?: number }) {
  const { ag = null, agStatus = 200 } = opts;
  global.fetch = jest.fn(async (url: unknown, init?: { method?: string }) => {
    const u = String(url);
    const m = (init?.method ?? "GET").toUpperCase();
    if (m === "DELETE" && /\/agendamentos\/42$/.test(u)) {
      return makeRes({ codigo: 42, status: "cancelado" });
    }
    if (m === "POST" && /\/agendamentos\/42\/avaliacao/.test(u)) {
      return makeRes({});
    }
    if (/\/agendamentos\/42$/.test(u)) return makeRes(ag, agStatus); // GET
    return makeRes(null);
  }) as unknown as typeof fetch;
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderScreen() {
  return render(<AgendamentoDetalheScreen />, { wrapper });
}

function makeAg(over: Partial<AgendamentoResponse> = {}): AgendamentoResponse {
  return {
    codigo: 42,
    inicio: "2026-06-15T14:00:00.000Z",
    fim: "2026-06-15T14:30:00.000Z",
    status: "confirmado",
    barbeiro: { usrCodigo: 99, nome: "Carlos Barbeiro", avatarUrl: null },
    cliente: { usrCodigo: 1, nome: "Cliente X", telefone: null },
    itens: [
      {
        codigo: 1,
        servico: { codigo: 1, nome: "Corte", precoBase: 50, duracaoBase: 30 },
        preco: 50,
        duracao: 30,
      },
    ],
    criadoEm: "2026-06-10T10:00:00.000Z",
    ...over,
  };
}

describe("AgendamentoDetalheScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("mostra loading enquanto a query real está pendente", () => {
    global.fetch = jest.fn(
      () => new Promise<never>(() => {}),
    ) as unknown as typeof fetch;
    renderScreen();
    expect(screen.getByTestId("agendamento-loading")).toBeTruthy();
  });

  it("mostra erro quando a API responde 500", async () => {
    setupFetch({ ag: null, agStatus: 500 });
    renderScreen();
    expect(await screen.findByText(/não encontrado/i)).toBeTruthy();
  });

  it("renderiza status traduzido", async () => {
    setupFetch({ ag: makeAg({ status: "confirmado" }) });
    renderScreen();
    const status = await screen.findByTestId("status-text");
    expect(status.props.children).toBe("Confirmado");
  });

  it("renderiza barbeiro e serviços", async () => {
    setupFetch({ ag: makeAg() });
    renderScreen();
    expect(await screen.findByText("Carlos Barbeiro")).toBeTruthy();
    expect(screen.getByText("Corte")).toBeTruthy();
    expect(screen.getByText("30min")).toBeTruthy();
  });

  it("mostra botão cancelar para status confirmado", async () => {
    setupFetch({ ag: makeAg({ status: "confirmado" }) });
    renderScreen();
    expect(await screen.findByTestId("botao-cancelar")).toBeTruthy();
  });

  it("NÃO mostra botão cancelar para status concluído", async () => {
    setupFetch({ ag: makeAg({ status: "concluido" }) });
    renderScreen();
    // Espera o detalhe carregar (barbeiro presente) e então confirma ausência.
    await screen.findByText("Carlos Barbeiro");
    expect(screen.queryByTestId("botao-cancelar")).toBeNull();
  });

  it("cancelar pede confirmação via Alert e faz DELETE /agendamentos/42", async () => {
    setupFetch({ ag: makeAg() });
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_t, _m, buttons) => {
        const cancelar = buttons?.find(
          (b) => b.text === "Cancelar agendamento",
        );
        cancelar?.onPress?.();
      });

    renderScreen();
    fireEvent.press(await screen.findByTestId("botao-cancelar"));

    await waitFor(() => {
      const del = (global.fetch as jest.Mock).mock.calls.find(
        ([u, init]) =>
          /\/agendamentos\/42$/.test(String(u)) &&
          (init as { method?: string })?.method === "DELETE",
      );
      expect(del).toBeTruthy();
    });
    alertSpy.mockRestore();
  });
});
