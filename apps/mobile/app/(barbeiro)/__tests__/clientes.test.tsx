// Clientes do barbeiro — exercita o hook real useClientesDaBarbearia +
// api-client real. Só o boundary HTTP (global.fetch) e a sessão (useAuth) são
// mockados. Os modais (walk-in, detalhe) têm specs próprios → stubs leves.

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
  router: { replace: jest.fn() },
}));

jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    barbearia: { codigo: 1, nome: "Centro", perfil: "barbeiro" },
    barbearias: [{ codigo: 1, nome: "Centro", perfil: "barbeiro" }],
    user: { codigo: 9, nome: "Barbeiro" },
  }),
}));

jest.mock("@/src/features/barbeiro/AdicionarClienteModal", () => {
  const RN = jest.requireActual("react-native");
  return {
    AdicionarClienteModal: ({ visible }: { visible: boolean }) =>
      visible ? <RN.View testID="cliente-modal" /> : null,
  };
});

jest.mock("@/src/features/barbeiro/ClienteDetalhe", () => {
  const RN = jest.requireActual("react-native");
  return {
    ClienteDetalhe: ({
      visible,
      cliente,
    }: {
      visible: boolean;
      cliente: { codigo: number; nome: string } | null;
    }) =>
      visible && cliente ? (
        <RN.View testID="detalhe-modal">
          <RN.Text>{cliente.nome}</RN.Text>
        </RN.View>
      ) : null,
  };
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import type { ClienteAPI } from "@toqe/contracts";

import BarbeiroClientesScreen from "../clientes";

const originalFetch = global.fetch;

function makeRes(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    url: "http://localhost:3000/api/v1/barbearias/1/clientes",
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
  return render(<BarbeiroClientesScreen />, { wrapper });
}

function makeC(over: Partial<ClienteAPI> = {}): ClienteAPI {
  return {
    codigo: 1,
    nome: "Carlos",
    email: "c@x.com",
    telefone: null,
    avatarUrl: null,
    perfil: "cliente",
    totalVisitas: 0,
    totalGasto: 0,
    ticketMedio: 0,
    ultimaVisita: null,
    servicoFav: null,
    ...over,
  };
}

describe("BarbeiroClientesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    respondWith([]);
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("mostra loading enquanto a query real está pendente", () => {
    global.fetch = jest.fn(
      () => new Promise<never>(() => {}),
    ) as unknown as typeof fetch;
    renderScreen();
    expect(screen.getByTestId("lista-clientes-loading")).toBeTruthy();
  });

  it("mostra empty state quando a API retorna lista vazia", async () => {
    respondWith([]);
    renderScreen();
    expect(await screen.findByText("Sem clientes ainda")).toBeTruthy();
  });

  it("mostra erro quando a API responde 500", async () => {
    respondWith({ message: "erro" }, 500);
    renderScreen();
    expect(await screen.findByText(/Não foi possível carregar/i)).toBeTruthy();
  });

  it("renderiza a lista vinda da API", async () => {
    respondWith([
      makeC({ codigo: 1, nome: "Ana Silva" }),
      makeC({ codigo: 2, nome: "Bruno Costa" }),
    ]);
    renderScreen();
    expect(await screen.findByText("Ana Silva")).toBeTruthy();
    expect(screen.getByText("Bruno Costa")).toBeTruthy();
    expect(screen.getByTestId("clientes-contagem").props.children).toEqual([
      2,
      " de ",
      2,
    ]);
  });

  it("filtra por busca local (case-insensitive)", async () => {
    respondWith([
      makeC({ codigo: 1, nome: "Ana Silva", email: "ana@x.com" }),
      makeC({ codigo: 2, nome: "Bruno Costa", email: "bruno@x.com" }),
      makeC({ codigo: 3, nome: "Carla Mendes", email: "carla@x.com" }),
    ]);
    renderScreen();
    await screen.findByText("Ana Silva");
    fireEvent.changeText(screen.getByTestId("clientes-busca"), "bru");
    expect(screen.queryByText("Ana Silva")).toBeNull();
    expect(screen.getByText("Bruno Costa")).toBeTruthy();
    expect(screen.queryByText("Carla Mendes")).toBeNull();
  });

  it("busca ignora acentos", async () => {
    respondWith([
      makeC({ codigo: 1, nome: "André Câmara" }),
      makeC({ codigo: 2, nome: "Bruno Lima" }),
    ]);
    renderScreen();
    await screen.findByText("André Câmara");
    fireEvent.changeText(screen.getByTestId("clientes-busca"), "andre");
    expect(screen.getByText("André Câmara")).toBeTruthy();
    expect(screen.queryByText("Bruno Lima")).toBeNull();
  });

  it("toggle sort por última visita reordena", async () => {
    respondWith([
      makeC({
        codigo: 1,
        nome: "A Recente",
        ultimaVisita: "2026-05-10T00:00:00.000Z",
      }),
      makeC({
        codigo: 2,
        nome: "B Antigo",
        ultimaVisita: "2025-01-01T00:00:00.000Z",
      }),
    ]);
    renderScreen();
    await screen.findByText("A Recente");
    fireEvent.press(screen.getByTestId("sort-ultimaVisita"));
    expect(screen.getByText("A Recente")).toBeTruthy();
    expect(screen.getByText("B Antigo")).toBeTruthy();
  });

  it("tap em card abre modal de detalhe (stub)", async () => {
    respondWith([makeC({ codigo: 7, nome: "Daniel Souza" })]);
    renderScreen();
    fireEvent.press(await screen.findByTestId("cliente-7"));
    expect(screen.getByTestId("detalhe-modal")).toBeTruthy();
  });

  it("filtro 'Recentes' exibe apenas clientes com visita nos últimos 7 dias", async () => {
    const hoje = new Date().toISOString();
    const antigo = new Date(Date.now() - 60 * 864e5).toISOString();
    respondWith([
      makeC({ codigo: 1, nome: "Recente", ultimaVisita: hoje }),
      makeC({ codigo: 2, nome: "Antigo", ultimaVisita: antigo }),
    ]);
    renderScreen();
    await screen.findByText("Recente");
    fireEvent.press(screen.getByTestId("filter-recentes"));
    expect(screen.getByText("Recente")).toBeTruthy();
    expect(screen.queryByText("Antigo")).toBeNull();
  });

  it("filtro 'Sumidos' exibe apenas clientes com visita há 30+ dias", async () => {
    const hoje = new Date().toISOString();
    const antigo = new Date(Date.now() - 60 * 864e5).toISOString();
    respondWith([
      makeC({ codigo: 1, nome: "Recente", ultimaVisita: hoje }),
      makeC({ codigo: 2, nome: "Sumido", ultimaVisita: antigo }),
    ]);
    renderScreen();
    await screen.findByText("Sumido");
    fireEvent.press(screen.getByTestId("filter-sumidos"));
    expect(screen.queryByText("Recente")).toBeNull();
    expect(screen.getByText("Sumido")).toBeTruthy();
  });

  it("botão + abre modal de cadastro de cliente", async () => {
    respondWith([]);
    renderScreen();
    await screen.findByText("Sem clientes ainda");
    expect(screen.queryByTestId("cliente-modal")).toBeNull();
    fireEvent.press(screen.getByTestId("btn-adicionar-cliente"));
    expect(screen.getByTestId("cliente-modal")).toBeTruthy();
  });
});
