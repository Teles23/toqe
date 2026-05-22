// Buscar barbearias — exercita o hook real useBarbeariasPublico + api-client
// real. Só o boundary HTTP (global.fetch) é mockado.

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
  router: { push: jest.fn() },
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { router } from "expo-router";

import ClienteBuscarScreen from "../buscar";

const mockRouterPush = router.push as jest.Mock;

const originalFetch = global.fetch;

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/barbearias/publico",
    json: async () => body,
  };
}

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
  return render(<ClienteBuscarScreen />, { wrapper });
}

const barbeariasFixture = [
  {
    codigo: 1,
    nome: "Urban Flow Barber",
    slug: "urban-flow",
    tema: { logoUrl: null },
  },
  {
    codigo: 2,
    nome: "Barber Shop Classic",
    slug: "barber-classic",
    tema: null,
  },
];

describe("ClienteBuscarScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    respondWith([]);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("1. exibe loading enquanto a query do hook real está pendente", () => {
    global.fetch = jest.fn(
      () => new Promise<never>(() => {}),
    ) as unknown as typeof fetch;
    renderScreen();
    expect(screen.getByTestId("buscar-loading")).toBeTruthy();
  });

  it("2. exibe a lista de barbearias vinda da API", async () => {
    respondWith(barbeariasFixture);
    renderScreen();
    expect(await screen.findByTestId("barbearia-publica-1")).toBeTruthy();
    expect(screen.getByTestId("lista-barbearias-publicas")).toBeTruthy();
    expect(screen.getByTestId("barbearia-publica-2")).toBeTruthy();
    expect(screen.getByText("Urban Flow Barber")).toBeTruthy();
    expect(screen.getByText("Barber Shop Classic")).toBeTruthy();
  });

  it("3. exibe buscar-empty quando a API retorna lista vazia", async () => {
    respondWith([]);
    renderScreen();
    expect(await screen.findByTestId("buscar-empty")).toBeTruthy();
    expect(screen.getByText("Nenhuma barbearia encontrada")).toBeTruthy();
  });

  it("4. tocar em uma barbearia navega com o slug correto", async () => {
    respondWith(barbeariasFixture);
    renderScreen();
    fireEvent.press(await screen.findByTestId("barbearia-publica-1"));
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/(cliente)/barbearia/urban-flow",
    );
  });

  it("5. digitar no input altera o valor do campo de busca", () => {
    renderScreen();
    const input = screen.getByTestId("buscar-input");
    fireEvent.changeText(input, "urban");
    expect(input.props.value).toBe("urban");
  });

  it("6. exibe título 'Descobrir' no header", () => {
    renderScreen();
    expect(screen.getByText("Descobrir")).toBeTruthy();
  });
});
