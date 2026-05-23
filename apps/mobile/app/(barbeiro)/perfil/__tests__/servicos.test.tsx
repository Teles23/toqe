// ServicosScreen — exercita os hooks reais (useServicosBarbeiro,
// useBarbeariaConfig, useToggleServicoBarbeiro, useAtualizarServicoBarbeiro) +
// api-client real. Só o boundary HTTP, a sessão e o router são mockados.

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

jest.mock("expo-router", () => ({
  router: { back: jest.fn() },
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({ barbearia: { codigo: 1 }, user: { codigo: 7 } }),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

import type { ServicoBarbeiroResponse } from "@toqe/shared";

import ServicosScreen from "../servicos";

const originalFetch = global.fetch;

interface FakeReq {
  method?: string;
  body?: string;
}
function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1",
    json: async () => body,
  };
}

function setupFetch(opts: {
  servicos: ServicoBarbeiroResponse[];
  criaServico?: boolean;
  alteraPreco?: boolean;
}) {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  global.fetch = jest.fn(async (url: unknown, init?: FakeReq) => {
    const u = String(url);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({
      url: u,
      method,
      body: init?.body ? JSON.parse(init.body) : undefined,
    });
    if (/\/servicos\/barbeiro\/\d+\/\d+/.test(u)) return makeRes({});
    if (/\/servicos\/barbeiro\/\d+/.test(u)) return makeRes(opts.servicos);
    if (/\/barbearias\/\d+/.test(u))
      return makeRes({
        codigo: 1,
        barbeiroCriaServico: opts.criaServico ?? false,
        barbeiroAlteraPreco: opts.alteraPreco ?? false,
      });
    return makeRes([]);
  }) as unknown as typeof fetch;
  return calls;
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function renderScreen() {
  return render(<ServicosScreen />, { wrapper });
}

function srv(
  over: Partial<ServicoBarbeiroResponse> = {},
): ServicoBarbeiroResponse {
  return {
    servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
    barbeiro: null,
    precoEfetivo: 40,
    duracaoEfetiva: 30,
    exclusivo: false,
    ...over,
  };
}

describe("ServicosScreen", () => {
  beforeEach(() => jest.clearAllMocks());
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("mostra preço efetivo e o base riscado quando diferentes", async () => {
    setupFetch({
      servicos: [
        srv({
          servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
          barbeiro: { precoProprio: 55, duracaoMin: 45, ativo: true },
          precoEfetivo: 55,
          duracaoEfetiva: 45,
        }),
      ],
    });
    renderScreen();
    expect(await screen.findByText("R$ 55,00")).toBeTruthy();
    expect(screen.getByText("R$ 40,00")).toBeTruthy(); // base riscado
    expect(screen.getByText(/45min/)).toBeTruthy();
  });

  it("FAB de criar só aparece quando barbeiroCriaServico=true", async () => {
    setupFetch({ servicos: [srv()], criaServico: false });
    const { unmount } = renderScreen();
    await screen.findByTestId("servico-row-1");
    expect(screen.queryByTestId("btn-add-servico")).toBeNull();
    unmount();

    setupFetch({ servicos: [srv()], criaServico: true });
    renderScreen();
    expect(await screen.findByTestId("btn-add-servico")).toBeTruthy();
  });

  it("desativar chama PATCH e mostra 'NÃO REALIZO'", async () => {
    const calls = setupFetch({
      servicos: [
        srv({
          servico: { codigo: 1, nome: "Corte", precoBase: 40, duracaoBase: 30 },
        }),
      ],
    });
    renderScreen();
    const toggle = await screen.findByTestId("servico-toggle-1");

    fireEvent(toggle, "valueChange", false);

    await waitFor(() => {
      const patch = calls.find(
        (c) =>
          c.method === "PATCH" && /\/servicos\/barbeiro\/7\/1$/.test(c.url),
      );
      expect(patch).toBeTruthy();
      expect(patch?.body).toEqual({ ativo: false });
    });
    expect(screen.getByText("NÃO REALIZO")).toBeTruthy();
  });

  it("com permissão, tocar no card edita o preço (PUT)", async () => {
    const calls = setupFetch({
      servicos: [srv()],
      alteraPreco: true,
    });
    renderScreen();
    const card = await screen.findByTestId("servico-row-1");

    fireEvent.press(card);
    const input = await screen.findByTestId("input-preco-proprio");
    fireEvent.changeText(input, "60");
    fireEvent.changeText(screen.getByTestId("input-duracao-min"), "50");
    fireEvent.press(screen.getByTestId("btn-salvar-preco"));

    await waitFor(() => {
      const put = calls.find(
        (c) => c.method === "PUT" && /\/servicos\/barbeiro\/7\/1$/.test(c.url),
      );
      expect(put).toBeTruthy();
      expect(put?.body).toEqual({ precoProprio: 60, duracaoMin: 50 });
    });
  });
});
